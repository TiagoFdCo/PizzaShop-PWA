export interface AdminCredentials {
  username: string;
  password: string;
}

export interface AdminSession {
  username: string;
  token: string;
}

const MOCK_ADMIN = {
  username: "admin",
  password: "pizzashop123",
};

export async function login(credentials: AdminCredentials): Promise<AdminSession> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (
    credentials.username !== MOCK_ADMIN.username ||
    credentials.password !== MOCK_ADMIN.password
  ) {
    throw new Error("Usuário ou senha inválidos");
  }

  return {
    username: credentials.username,
    token: `mock-token-${Date.now()}`,
  };
}

export function logout(): void {
  // Mock: nada pra limpar no backend, o store cuida do estado local
}
