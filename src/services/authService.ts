import prisma from '../prisma';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

export async function registerUser({ schoolId, email, password, firstName, lastName, role }: {
  schoolId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const passwordHash = await (bcrypt as any).hash(password, 10);
  const user = await prisma.user.create({
    data: {
      schoolId,
      email,
      passwordHash,
      firstName,
      lastName,
      role: (role as any) ?? undefined
    }
  });

  const token = signToken(user.id);
  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new Error('Invalid credentials');
  const ok = await (bcrypt as any).compare(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');

  const token = signToken(user.id);
  return { user, token };
}

export function signToken(userId: string) {
  return (jwt as any).sign({ sub: userId }, JWT_SECRET as any, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string) {
  try {
    return (jwt as any).verify(token, JWT_SECRET as any) as any;
  } catch (e) {
    return null;
  }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export default { registerUser, loginUser, signToken, verifyToken, getUserById };
