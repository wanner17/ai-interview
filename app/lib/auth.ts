export type AuthUser = {
  userId: string;
  loginId: string;
  email: string | null;
  nickname: string;
  userName: string | null;
  tokens: number;
  userRole: string;
  userStatus: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || '요청 처리에 실패했습니다.');
  }
  return payload;
}

export async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  const payload = await parseResponse(response);
  return (payload.user ?? null) as AuthUser | null;
}

export async function loginWithPassword(payload: {
  identifier: string;
  password: string;
}) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response);
  return data as { ok: true; message: string; user: AuthUser };
}

export async function signUpWithPassword(payload: {
  loginId: string;
  email: string;
  password: string;
  nickname: string;
  userName?: string;
}) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response);
  return data as { ok: true; message: string; user: AuthUser };
}

export async function logout() {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = await parseResponse(response);
  return data as { ok: true; message: string };
}
