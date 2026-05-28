import prisma from '../prisma';

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: { schoolId: string; email: string; passwordHash?: string; firstName: string; lastName: string; role?: string }) {
  return prisma.user.create({ data: data as any });
}

export default { getUserByEmail, getUserById, createUser };
