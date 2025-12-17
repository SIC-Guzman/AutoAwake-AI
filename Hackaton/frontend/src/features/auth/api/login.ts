import { apiClient } from "../../../app/api/client";
import type { LoginRequest, LoginResponse } from "../types";

export const loginRequest = async (payload: LoginRequest) => {
  const res = await apiClient.post<LoginResponse>("/auth/login", payload);
  return res.data;
};
