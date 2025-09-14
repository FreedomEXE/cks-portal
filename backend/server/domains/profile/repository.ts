import pool from '../../db/connection';
import { UserProfile } from './types';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const result = await pool.query(
    `SELECT user_id, user_name, email, role_code, template_version, created_at, archived
     FROM users
     WHERE user_id = $1`,
    [userId.toUpperCase()]
  );
  return result.rows?.[0] || null;
}

export async function updateUserProfile(userId: string, updates: Partial<Pick<UserProfile, 'user_name' | 'email' | 'template_version'>>): Promise<UserProfile | null> {
  const sets: string[] = [];
  const vals: any[] = [];

  if (updates.user_name !== undefined) {
    vals.push(updates.user_name);
    sets.push(`user_name = $${vals.length}`);
  }
  if (updates.email !== undefined) {
    vals.push(updates.email);
    sets.push(`email = $${vals.length}`);
  }
  if (updates.template_version !== undefined) {
    vals.push(updates.template_version);
    sets.push(`template_version = $${vals.length}`);
  }

  if (!sets.length) {
    return await getUserProfile(userId);
  }

  vals.push(userId.toUpperCase());
  const query = `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE user_id = $${vals.length} RETURNING user_id, user_name, email, role_code, template_version, created_at, archived`;
  const result = await pool.query(query, vals);
  return result.rows?.[0] || null;
}

