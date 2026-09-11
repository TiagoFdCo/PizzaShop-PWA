export type StaffRole = "admin" | "cozinha" | "entrega" | "garcom";

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  username: string;
}