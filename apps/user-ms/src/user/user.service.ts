import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User, UserWithoutPassword, UserRole } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<UserWithoutPassword> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: UserRole.CUSTOMER, // Default to CUSTOMER
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      role: UserRole[user.role as keyof typeof UserRole],
    };
  }

  async findAll(): Promise<UserWithoutPassword[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        role: UserRole[user.role as keyof typeof UserRole],
      };
    });
  }

  async findOne(id: number): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      role: UserRole[user.role as keyof typeof UserRole],
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return {
      ...user,
      role: UserRole[user.role as keyof typeof UserRole],
    };
  }

  async update(id: number, data: UpdateUserDto): Promise<UserWithoutPassword> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (userWithEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      role: UserRole[user.role as keyof typeof UserRole],
    };
  }

  async updateRole(
    id: number,
    data: UpdateUserRoleDto,
  ): Promise<UserWithoutPassword> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { role: data.role },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      role: UserRole[user.role as keyof typeof UserRole],
    };
  }

  async remove(id: number): Promise<UserWithoutPassword> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const user = await this.prisma.user.delete({ where: { id } });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      role: UserRole[user.role as keyof typeof UserRole],
    };
  }
}
