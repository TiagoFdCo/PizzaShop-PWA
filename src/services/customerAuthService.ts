import { apiFetch, setAuthToken } from "./api";
import type { Customer } from "../types/customer";

export interface CustomerRegisterInput {
  name: string;
  phone: string;
  cpf: string;
  password: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CustomerLoginInput {
  cpf: string;
  password: string;
}

interface CustomerLoginResponse {
  accessToken: string;
  tokenType: string;
  customer: Customer;
}

export interface CustomerSession {
  token: string;
  customer: Customer;
}

export async function registerCustomer(input: CustomerRegisterInput): Promise<CustomerSession> {
  const data = await apiFetch<CustomerLoginResponse>("/auth/customer/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setAuthToken(data.accessToken);
  return { token: data.accessToken, customer: data.customer };
}

export async function loginCustomer(input: CustomerLoginInput): Promise<CustomerSession> {
  const data = await apiFetch<CustomerLoginResponse>("/auth/customer/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setAuthToken(data.accessToken);
  return { token: data.accessToken, customer: data.customer };
}

export function logoutCustomer(): void {
  setAuthToken(null);
}
