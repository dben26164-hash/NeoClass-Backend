import prisma from '../prisma';

export async function createSchool(data: { name: string; code?: string }) {
  return prisma.school.create({ data });
}

export async function getSchoolById(id: string) {
  return prisma.school.findUnique({ where: { id } });
}

export default { createSchool, getSchoolById };
