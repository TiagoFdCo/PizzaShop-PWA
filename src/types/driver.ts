import type { StaffRole } from "./staff";

export interface Driver {
  id: string;
  name: string;
  role: StaffRole;
  username: string;
  password?: string; // só usado ao criar; nunca vem do backend nas leituras
}