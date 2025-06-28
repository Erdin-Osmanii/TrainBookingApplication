export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export class User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export type UserWithoutPassword = Omit<User, 'password'>;
