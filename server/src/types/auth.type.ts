export type SignUpRequest = {
  loginId: string;
  email?: string;
  password: string;
  nickname: string;
  userName?: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type SafeUser = {
  userId: string;
  loginId: string;
  email: string | null;
  nickname: string;
  userName: string | null;
  userRole: string;
  userStatus: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};
