import prisma from '../prisma';

export async function createStudent(data: { schoolId: string; studentNumber: string; firstName: string; lastName: string; dateOfBirth: Date; gender: string }) {
  return prisma.student.create({ data: data as any });
}

export async function getStudentById(id: string) {
  return prisma.student.findUnique({ where: { id } });
}

export default { createStudent, getStudentById };
