export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user_id: number;
  role: string;
  email?: string | null;
  expires_at?: string | null;
};
