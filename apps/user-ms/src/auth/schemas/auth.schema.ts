import { UserWithoutPassword } from '../../user/schemas/user.schema';

export interface LoginResponse {
  access_token: string;
}

export type AuthUser = UserWithoutPassword;
