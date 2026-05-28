import bcrypt from 'bcryptjs';
import type { Secret } from 'jsonwebtoken';
import { sign, verify } from 'jsonwebtoken';
import prisma from '../prisma';
import { UserRole } from '@prisma/client';

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? 'dev-secret';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? '7d';

export interface RegisterInput {
  schoolId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  let school = await prisma.school.findUnique({ where: { id: input.schoolId } });
  if (!school) {
    school = await prisma.school.create({ data: { id: input.schoolId, name: `School ${input.schoolId}` } });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const role = validateRole(input.role);

  const user = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role
    }
  });

  const { passwordHash: _, ...safeUser } = user;
  const token = signToken(user.id);
  return { user: safeUser, token };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  const { passwordHash: _, ...safeUser } = user;
  const token = signToken(user.id);
  return { user: safeUser, token };
}

export function signToken(userId: string) {
  return sign({ sub: userId }, JWT_SECRET as any, { expiresIn: JWT_EXPIRES_IN as any });
}

export function verifyToken(token: string) {
  try {
    return verify(token, JWT_SECRET as any) as { sub: string };
  } catch (error) {
    return null;
  }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

function validateRole(role?: string): UserRole {
  if (!role) return UserRole.STUDENT;
  const normalized = role.toUpperCase();
  if (normalized === 'SCHOOL_ADMIN') {
    return normalized as UserRole;
  }
  if (Object.values(UserRole).includes(normalized as UserRole)) {
    return normalized as UserRole;
  }
  return UserRole.STUDENT;
}
