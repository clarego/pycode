const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function callManageUsers(body: Record<string, unknown>) {
  const cachedUser = localStorage.getItem('auth_user');
  const adminUsername = cachedUser ? JSON.parse(cachedUser).username : null;

  const res = await fetch(`${FUNCTIONS_URL}/manage-users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, _adminUsername: adminUsername }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function createUser(username: string, password: string, role: 'admin' | 'student') {
  return callManageUsers({ action: 'create', username, password, role });
}

export async function updateUser(userId: string, updates: { username?: string; password?: string }) {
  return callManageUsers({ action: 'update', userId, ...updates });
}

export async function deleteUsers(userIds: string[]) {
  return callManageUsers({ action: 'delete', userIds });
}

export function generateShareCode(length = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
