import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { AdminUserCreateInput, AdminUserRecord, AdminUserUpdateInput } from "./types";

const DATA_DIR = path.resolve(__dirname, "../../../server/data");
const DATA_FILE = path.join(DATA_DIR, "admin-users.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      const seed: AdminUserRecord[] = [];
      await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2), "utf8");
      return;
    }
    throw err;
  }
}

async function readAll(): Promise<AdminUserRecord[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  if (!raw.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as AdminUserRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(records: AdminUserRecord[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf8");
}

function generateId() {
  return `adm-${crypto.randomUUID()}`;
}

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() || undefined;
}

export async function getAdminUsers(): Promise<AdminUserRecord[]> {
  return readAll();
}

export async function getAdminUserById(id: string): Promise<AdminUserRecord | undefined> {
  const records = await readAll();
  return records.find((record) => record.id === id);
}

export async function findAdminUserByClerkIdentifier(options: {
  clerkUserId?: string;
  email?: string;
  username?: string;
}): Promise<AdminUserRecord | undefined> {
  const { clerkUserId, email, username } = options;
  const normalizedEmail = normalize(email);
  const normalizedUsername = normalize(username);

  const records = await readAll();
  return records.find((record) => {
    if (clerkUserId && record.clerkUserId === clerkUserId) {
      return true;
    }
    if (normalizedEmail && normalize(record.email) === normalizedEmail) {
      return true;
    }
    if (normalizedUsername && normalize(record.username) === normalizedUsername) {
      return true;
    }
    return false;
  });
}

export async function createAdminUser(input: AdminUserCreateInput): Promise<AdminUserRecord> {
  const now = new Date().toISOString();
  const record: AdminUserRecord = {
    id: generateId(),
    clerkUserId: input.clerkUserId,
    email: input.email,
    username: input.username,
    cksCode: input.cksCode,
    role: "admin",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const records = await readAll();
  records.push(record);
  await writeAll(records);
  return record;
}

export async function updateAdminUser(id: string, update: AdminUserUpdateInput): Promise<AdminUserRecord | undefined> {
  const records = await readAll();
  const idx = records.findIndex((record) => record.id === id);
  if (idx === -1) {
    return undefined;
  }

  const existing = records[idx];
  const next: AdminUserRecord = {
    ...existing,
    ...update,
    updatedAt: new Date().toISOString(),
  };

  records[idx] = next;
  await writeAll(records);
  return next;
}

export async function upsertAdminUserFromSession(input: {
  clerkUserId: string;
  email?: string;
  username?: string;
  defaultCode?: string;
}): Promise<AdminUserRecord> {
  const existing = await findAdminUserByClerkIdentifier({
    clerkUserId: input.clerkUserId,
    email: input.email,
    username: input.username,
  });

  if (existing) {
    return existing;
  }

  const code = input.defaultCode || normalize(input.username) || normalize(input.email?.split("@")[0]) || "admin";
  return createAdminUser({
    clerkUserId: input.clerkUserId,
    email: input.email,
    username: input.username,
    cksCode: code ?? "admin",
  });
}

export async function removeAdminUser(id: string): Promise<AdminUserRecord | undefined> {
  const records = await readAll();
  const idx = records.findIndex((record) => record.id === id);
  if (idx === -1) {
    return undefined;
  }
  const [removed] = records.splice(idx, 1);
  await writeAll(records);
  return removed;
}
