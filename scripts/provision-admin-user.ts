import { query } from '../apps/backend/server/db/connection';
import { clerkClient } from '../apps/backend/server/core/clerk/client';

type Options = {
  username: string;
  email: string;
  fullName: string | null;
  sendInvite: boolean;
};

type ClerkUserLike = {
  id: string;
  username?: string | null;
  emailAddresses?: Array<{ emailAddress?: string | null }>;
};

function parseArgs(argv: string[]): Options {
  const args = new Map<string, string>();
  const flags = new Set<string>();

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    if (key === 'send-invite') {
      flags.add(key);
      continue;
    }

    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }
    args.set(key, value);
    i += 1;
  }

  const username = (args.get('username') ?? '').trim().toLowerCase();
  const email = (args.get('email') ?? '').trim().toLowerCase();
  const fullNameRaw = (args.get('full-name') ?? '').trim();

  if (!username) {
    throw new Error('Missing required --username');
  }
  if (!email) {
    throw new Error('Missing required --email');
  }
  if (!email.includes('@')) {
    throw new Error('Invalid --email format');
  }

  return {
    username,
    email,
    fullName: fullNameRaw.length ? fullNameRaw : null,
    sendInvite: flags.has('send-invite'),
  };
}

function asUserList(result: unknown): ClerkUserLike[] {
  if (Array.isArray(result)) {
    return result as ClerkUserLike[];
  }
  if (
    result &&
    typeof result === 'object' &&
    'data' in (result as Record<string, unknown>) &&
    Array.isArray((result as { data?: unknown[] }).data)
  ) {
    return ((result as { data: unknown[] }).data ?? []) as ClerkUserLike[];
  }
  return [];
}

async function findClerkUserByEmail(email: string): Promise<ClerkUserLike | null> {
  const users = asUserList(await (clerkClient.users as any).getUserList?.({ emailAddress: [email] }));
  return users[0] ?? null;
}

async function ensureClerkAdminUser(options: {
  username: string;
  email: string;
}): Promise<ClerkUserLike> {
  const { username, email } = options;
  const metadata = { role: 'admin', cksCode: username };

  let user = await findClerkUserByEmail(email);

  if (!user) {
    try {
      user = (await clerkClient.users.createUser({
        username,
        externalId: username,
        emailAddress: [email],
        publicMetadata: metadata,
        skipPasswordRequirement: true,
      })) as ClerkUserLike;
    } catch (error: any) {
      const code = error?.errors?.[0]?.code || error?.code;
      if (code === 'form_identifier_exists' || code === 'email_address_exists') {
        user = await findClerkUserByEmail(email);
      } else {
        throw error;
      }
    }
  }

  if (!user?.id) {
    throw new Error('Failed to resolve Clerk user by email');
  }

  if ((user.username ?? '').toLowerCase() !== username) {
    try {
      user = (await clerkClient.users.updateUser(user.id, {
        username,
        externalId: username,
        publicMetadata: metadata,
      })) as ClerkUserLike;
    } catch (error: any) {
      const code = error?.errors?.[0]?.code || error?.code;
      if (code === 'form_identifier_exists' || code === 'username_exists') {
        throw new Error(`Clerk username "${username}" is already in use`);
      }
      throw error;
    }
  } else {
    user = (await clerkClient.users.updateUser(user.id, {
      externalId: username,
      publicMetadata: metadata,
    })) as ClerkUserLike;
  }

  return user;
}

async function upsertAdminRow(options: {
  clerkUserId: string;
  username: string;
  email: string;
  fullName: string | null;
}) {
  const { clerkUserId, username, email, fullName } = options;

  const existingByEmail = await query<{
    clerk_user_id: string;
    cks_code: string;
  }>(
    `SELECT clerk_user_id, cks_code
     FROM admin_users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );

  if (
    existingByEmail.rows[0] &&
    existingByEmail.rows[0].cks_code.toLowerCase() !== username
  ) {
    throw new Error(
      `Email "${email}" is already linked to admin "${existingByEmail.rows[0].cks_code}"`,
    );
  }

  const result = await query<{
    clerk_user_id: string;
    cks_code: string;
    status: string;
    email: string | null;
    full_name: string | null;
  }>(
    `INSERT INTO admin_users (
      clerk_user_id,
      cks_code,
      role,
      status,
      full_name,
      email,
      created_at,
      updated_at
    )
    VALUES ($1, $2, 'admin', 'active', $3, $4, NOW(), NOW())
    ON CONFLICT (cks_code) DO UPDATE
    SET
      clerk_user_id = EXCLUDED.clerk_user_id,
      role = 'admin',
      status = 'active',
      full_name = COALESCE(EXCLUDED.full_name, admin_users.full_name),
      email = EXCLUDED.email,
      updated_at = NOW()
    RETURNING clerk_user_id, cks_code, status, email, full_name`,
    [clerkUserId, username, fullName, email],
  );

  return result.rows[0] ?? null;
}

async function sendInviteEmail(email: string, username: string): Promise<void> {
  await clerkClient.invitations.createInvitation({
    emailAddress: email,
    notify: true,
    ignoreExisting: true,
    publicMetadata: {
      role: 'admin',
      cksCode: username,
    },
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const clerkUser = await ensureClerkAdminUser({
    username: options.username,
    email: options.email,
  });

  const row = await upsertAdminRow({
    clerkUserId: clerkUser.id,
    username: options.username,
    email: options.email,
    fullName: options.fullName,
  });

  if (!row) {
    throw new Error('Failed to upsert admin row');
  }

  if (options.sendInvite) {
    await sendInviteEmail(options.email, options.username);
  }

  console.log('Admin provisioning complete');
  console.log(
    JSON.stringify(
      {
        clerkUserId: row.clerk_user_id,
        cksCode: row.cks_code,
        status: row.status,
        email: row.email,
        fullName: row.full_name,
        inviteSent: options.sendInvite,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Admin provisioning failed:', message);
  process.exit(1);
});
