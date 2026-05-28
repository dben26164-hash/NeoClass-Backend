import prisma from '../prisma';

export async function createTeacher(data: { schoolId: string; employeeNumber: string; firstName: string; lastName: string; email: string; hireDate: Date }) {
  return prisma.teacher.create({ data });
}

export async function getTeacherById(id: string) {
  return prisma.teacher.findUnique({ where: { id } });
}

export default { createTeacher, getTeacherById };
