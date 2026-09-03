export interface Driver {
  id: string;
  name: string;
  username: string;
  password: string; // mock: plaintext — em prod usar hash (bcrypt)
}
