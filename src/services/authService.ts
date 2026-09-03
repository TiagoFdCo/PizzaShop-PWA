import { apiFetch, setAuthToken } from "./api";
import type { Staff } from "../types/staff";

export interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  staff: Staff;
}

export interface StaffSession {
  token: string;
  staff: Staff;
}

export async function login(credentials: LoginCredentials): Promise<StaffSession> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  setAuthToken(data.accessToken);
  return { token: data.accessToken, staff: data.staff };
}

export function logout(): void {
  setAuthToken(null);
}