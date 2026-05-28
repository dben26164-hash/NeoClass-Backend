import prisma from '../prisma';

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: {
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  role?: string;
}) {
  return prisma.user.create({ data: data as any });
}

export default { findUserByEmail, findUserById, createUser };
