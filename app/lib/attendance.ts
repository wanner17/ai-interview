const API_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || '요청 처리에 실패했습니다.');
  }
  return payload;
}

export type AttendanceStatus = {
  ok: true;
  balance: number;
  todayKey: string;
  todayChecked: boolean;
  rewardAmount: number;
  attendanceDays: string[];
  checkedCount: number;
  year: number;
  month: number;
};

export async function fetchAttendanceStatus(year: number, month: number) {
  const query = new URLSearchParams({
    year: String(year),
    month: String(month),
  });

  const response = await fetch(`${API_BASE}/attendance?${query.toString()}`, {
    credentials: 'include',
  });

  const data = await parseResponse(response);
  return data as AttendanceStatus;
}

export async function checkInAttendance() {
  const response = await fetch(`${API_BASE}/attendance/check-in`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = await parseResponse(response);
  return data as {
    ok: true;
    attendanceKey: string;
    rewardAmount: number;
    balance: number;
    message: string;
  };
}
