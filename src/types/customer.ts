export interface Customer {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
}
