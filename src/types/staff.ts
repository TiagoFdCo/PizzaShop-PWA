export type StaffRole = "admin" | "cozinha" | "entrega";

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  username: string;
}