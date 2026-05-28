# Database Schema - Module Académique NeoClass

## 1. Prisma Schema (`schema.prisma`)

```prisma
// ============================================================================
// ACADEMIC MODULE DATA SCHEMA
// Multi-tenant, with complete audit trail and RLS support
// ============================================================================

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

/// A school using NeoClass
model School {
  id                    String @id @default(cuid())
  name                  String
  country               String
  timezone              String @default("UTC")
  currency              String @default("XOF") // Franc CFA by default
  gradeScale            String @default("0-20") // 0-20, 0-100, A-F
  phoneCountryCode      String @default("+223") // Mali default
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  academicYears         AcademicYear[]
  classes               Class[]
  students              Student[]
  teachers              Teacher[]
  subjects              Subject[]
  enrollments           Enrollment[]
  grades                Grade[]
  attendance            Attendance[]
  bulletins             Bulletin[]
  auditLogs             AuditLog[]
  studentHistories      StudentHistory[]
  classTransfers        ClassTransfer[]
  competencies          Competency[]
  
  @@unique([name, country])
  @@index([country])
  @@index([timezone])
}

/// Academic year (2023-2024, etc)
model AcademicYear {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  year                  String // "2023-2024"
  startDate             DateTime
  endDate               DateTime
  isCurrent             Boolean @default(false)
  isActive              Boolean @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  semesters             Semester[]
  classes               Class[]
  gradesScale           GradeScale?
  
  @@unique([schoolId, year])
  @@index([schoolId])
  @@index([isCurrent])
}

/// Semester within academic year
model Semester {
  id                    String @id @default(cuid())
  academicYearId        String
  academicYear          AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  
  name                  String // "Sem1", "Q1", etc.
  startDate             DateTime
  endDate               DateTime
  order                 Int // 1, 2, 3
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([academicYearId, order])
  @@index([academicYearId])
}

/// A student/learner
model Student {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  // Personal Info
  firstName             String
  lastName              String
  dateOfBirth           DateTime
  gender                String // M, F
  studentNumber         String @unique
  nationalId            String?
  
  // Contact
  email                 String?
  phone                 String?
  
  // Biometric (optional for African context)
  photoUrl              String? // Profile photo
  fingerprintHash       String? // Hashed fingerprint for attendance
  
  // Status
  status                String @default("active") // active, transferred, withdrawn, graduated
  enrollmentDate        DateTime
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?
  
  // Relations
  enrollments           Enrollment[]
  grades                Grade[]
  attendance            Attendance[]
  bulletins             Bulletin[]
  histories             StudentHistory[]
  transfers             ClassTransfer[]
  competencyResults     CompetencyResult[]
  
  @@unique([schoolId, studentNumber])
  @@index([schoolId])
  @@index([lastName])
  @@index([status])
  @@fulltext([firstName, lastName]) // MySQL only, use trigram for PostgreSQL
}

/// A teacher/instructor
model Teacher {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  // Personal Info
  firstName             String
  lastName              String
  employeeNumber        String @unique
  email                 String @unique
  phone                 String?
  
  // Professional
  specialization        String[] // ["Math", "French"]
  qualifications        String[] // ["License", "Master"]
  experienceYears       Int @default(0)
  
  // Status
  status                String @default("active") // active, on_leave, retired
  hireDate              DateTime
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  classTeachings        ClassSubject[]
  grades                Grade[]
  
  @@unique([schoolId, employeeNumber])
  @@index([schoolId])
}

/// A class/group/section
model Class {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  academicYearId        String
  academicYear          AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  
  // Identification
  name                  String // "6A", "Class 1 Blue"
  level                 String // CP, CE1, CE2, CM1, CM2, 6e, 5e, 4e, 3e, etc.
  section               String? // A, B, C (for large schools)
  
  // Capacity
  maxCapacity           Int @default(50)
  minCapacity           Int @default(20)
  
  // Master teacher
  classTeacherId        String?
  classTeacher          Teacher?
  
  // Status
  isActive              Boolean @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  students              Student[] // via Enrollment
  enrollments           Enrollment[]
  classSubjects         ClassSubject[]
  transfers             ClassTransfer[]
  
  @@unique([schoolId, academicYearId, name])
  @@index([schoolId])
  @@index([level])
}

/// Enrollment (linking Student to Class)
model Enrollment {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  studentId             String
  student               Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  classId               String
  class                 Class @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  academicYearId        String
  enrollmentDate        DateTime
  withdrawalDate        DateTime? // NULL if still enrolled
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([studentId, classId, academicYearId])
  @@index([schoolId])
  @@index([studentId])
  @@index([classId])
}

/// A subject/course
model Subject {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  name                  String // "Mathématiques", "Mathematics"
  code                  String // MAT, MATH
  description           String?
  coefficient           Float @default(1.0) // Weight in final grade
  
  // Validation rules
  maxGradeValue         Float @default(20)
  minGradeValue         Float @default(0)
  
  // Status
  isActive              Boolean @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  classSubjects         ClassSubject[]
  grades                Grade[]
  competencies          Competency[]
  
  @@unique([schoolId, code])
  @@index([schoolId])
}

/// Linking Class to Subject and Teacher (many-to-many with Teacher)
model ClassSubject {
  id                    String @id @default(cuid())
  classId               String
  class                 Class @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  subjectId             String
  subject               Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  
  teacherId             String
  teacher               Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  
  // Schedule
  hoursPerWeek          Int @default(3)
  scheduleJson          Json? // ICS or custom format
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([classId, subjectId])
  @@index([classId])
  @@index([teacherId])
}

// ============================================================================
// GRADES MODULE
// ============================================================================

/// A grade/mark/score
model Grade {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  studentId             String
  student               Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  subjectId             String
  subject               Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  
  teacherId            String
  teacher              Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  
  academicYearId        String
  
  // Grade value and type
  value                 Float
  type                  String @default("exam") // exam, assignment, participation, midterm, final
  weight                Float @default(1.0)
  assessmentDate        DateTime
  
  // Validation
  isValidated           Boolean @default(false)
  validatedBy           String? // User ID
  validatedAt           DateTime?
  
  // Flags
  isAbsence             Boolean @default(false) // Mark flagged as absence-related
  notes                 String?
  
  // Audit
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?
  createdBy             String // User ID
  
  // Relations
  auditTrail            AuditLog[]
  
  @@unique([studentId, subjectId, academicYearId, type, assessmentDate])
  @@index([schoolId])
  @@index([studentId])
  @@index([subjectId])
  @@index([academicYearId])
}

/// Grade scale configuration per school
model GradeScale {
  id                    String @id @default(cuid())
  academicYearId        String @unique
  academicYear          AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  
  // Format: "0-20", "0-100", "A-F"
  format                String @default("0-20")
  
  // Thresholds for letter grades (if applicable)
  scaleJson             Json // { "A": 90, "B": 80, "C": 70, "D": 60, "E": 0 }
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([academicYearId])
}

// ============================================================================
// BULLETINS (Report Cards)
// ============================================================================

/// A report card/bulletin
model Bulletin {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  studentId             String
  student               Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  academicYearId        String
  semesterNumber        Int // 1, 2, 3 (per year)
  
  // Average calculations
  averageGrade          Float? // Average of all subjects weighted
  classRank             Int?
  classSize             Int?
  
  // PDF storage
  pdfUrl                String?
  pdfGeneratedAt        DateTime?
  
  // Signature
  signedBy              String? // Teacher ID
  signedAt              DateTime?
  
  // Status
  status                String @default("draft") // draft, ready, sent, viewed
  sentAt                DateTime?
  viewedAt              DateTime?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([studentId, academicYearId, semesterNumber])
  @@index([schoolId])
  @@index([studentId])
  @@index([status])
}

// ============================================================================
// ATTENDANCE MODULE
// ============================================================================

/// Attendance record (present/absent/justified/excused)
model Attendance {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  studentId             String
  student               Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  classId               String
  subjectId             String? // NULL if full day absence
  
  date                  DateTime
  
  // Status: present, absent, excused, justified, late
  status                String @default("present")
  
  // If justified or excused
  justificationUrl      String? // Document upload URL
  justificationReason   String?
  justifiedAt           DateTime?
  
  // Teacher notes
  notes                 String?
  recordedBy            String // User ID (teacher)
  recordedAt            DateTime
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([studentId, classId, date, subjectId])
  @@index([schoolId])
  @@index([studentId])
  @@index([date])
  @@index([status])
}

/// Absence summary (for quick access to statistics)
model AbsenceSummary {
  id                    String @id @default(cuid())
  schoolId              String
  studentId             String
  academicYearId        String
  
  totalAbsences         Int @default(0)
  totalJustified        Int @default(0)
  totalExcused          Int @default(0)
  totalPresent          Int @default(0)
  
  lastAbsenceDate       DateTime?
  absentThisWeek        Int @default(0)
  absentThisMonth       Int @default(0)
  
  // Auto-alert if > 15%
  absenceRate           Float @default(0)
  hasAlert              Boolean @default(false)
  
  updatedAt             DateTime @updatedAt
  
  @@unique([schoolId, studentId, academicYearId])
}

// ============================================================================
// COMPETENCIES (Transversal skills assessment)
// ============================================================================

/// Competency definition (ex: "Critical Thinking")
model Competency {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  subjectId             String
  subject               Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  
  name                  String // "Critical Thinking", "Collaboration"
  description           String?
  level                 Int // 1 (developing), 2 (proficient), 3 (advanced)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  results               CompetencyResult[]
  
  @@unique([schoolId, subjectId, name])
  @@index([schoolId])
}

/// Student competency assessment result
model CompetencyResult {
  id                    String @id @default(cuid())
  competencyId          String
  competency            Competency @relation(fields: [competencyId], references: [id], onDelete: Cascade)
  
  studentId             String
  student               Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  academicYearId        String
  
  // Rating: 1 (developing), 2 (proficient), 3 (advanced)
  rating                Int
  
  assessmentDate        DateTime
  assessedBy            String // Teacher ID
  notes                 String?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([competencyId, studentId, academicYearId])
  @@index([studentId])
}

// ============================================================================
// AUDIT & HISTORY
// ============================================================================

/// Student history tracking (photos, transfers, changes)
model StudentHistory {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  studentId             String
  student               Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  changeType            String // profile_update, transfer, status_change
  fieldChanged          String? // firstName, photoUrl, status
  oldValue               String?
  newValue               String?
  
  changedBy             String // User ID
  changedAt             DateTime
  
  createdAt             DateTime @default(now())
  
  @@index([schoolId])
  @@index([studentId])
  @@index([changedAt])
}

/// Class transfer history
model ClassTransfer {
  id                    String @id @default(cuid())
  schoolId              String
  studentId             String
  student               Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  fromClassId           String
  fromClass             Class @relation("fromClass", fields: [fromClassId], references: [id])
  
  toClassId             String
  toClass               Class @relation("toClass", fields: [toClassId], references: [id])
  
  transferDate          DateTime
  reason                String? // promotion, demotion, parent_request
  
  transferredBy         String // User ID
  
  createdAt             DateTime @default(now())
  
  @@index([schoolId])
  @@index([transferDate])
}

/// Complete audit trail for compliance
model AuditLog {
  id                    String @id @default(cuid())
  schoolId              String
  school                School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  entity                String // Student, Grade, Attendance
  entityId              String
  action                String // create, update, delete
  
  userId                String // Who made the change
  userEmail             String?
  
  oldValues             Json? // Previous state
  newValues             Json? // New state
  
  ipAddress             String?
  userAgent             String?
  
  createdAt             DateTime @default(now())
  
  // Relations (can link to Grade if needed)
  grade                 Grade?
  
  @@index([schoolId])
  @@index([entity, entityId])
  @@index([createdAt])
}
```

---

## 2. PostgreSQL Migrations

### Migration 1: Create Core Tables

```sql
-- Migration: 001_academic_module_core.sql

CREATE TYPE student_status AS ENUM ('active', 'transferred', 'withdrawn', 'graduated');
CREATE TYPE teacher_status AS ENUM ('active', 'on_leave', 'retired');
CREATE TYPE grade_type AS ENUM ('exam', 'assignment', 'participation', 'midterm', 'final');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused', 'justified', 'late');
CREATE TYPE bulletin_status AS ENUM ('draft', 'ready', 'sent', 'viewed');

-- Schools table
CREATE TABLE IF NOT EXISTS "School" (
  "id" CHAR(24) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "country" VARCHAR(100) NOT NULL,
  "timezone" VARCHAR(50) DEFAULT 'UTC',
  "currency" VARCHAR(3) DEFAULT 'XOF',
  "gradeScale" VARCHAR(20) DEFAULT '0-20',
  "phoneCountryCode" VARCHAR(20) DEFAULT '+223',
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("name", "country")
);

CREATE INDEX idx_school_country ON "School"("country");

-- Academic Years table
CREATE TABLE IF NOT EXISTS "AcademicYear" (
  "id" CHAR(24) PRIMARY KEY,
  "schoolId" CHAR(24) NOT NULL REFERENCES "School"("id") ON DELETE CASCADE,
  "year" VARCHAR(20) NOT NULL,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "isCurrent" BOOLEAN DEFAULT FALSE,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("schoolId", "year")
);

CREATE INDEX idx_academic_year_school ON "AcademicYear"("schoolId");
CREATE INDEX idx_academic_year_current ON "AcademicYear"("isCurrent");

-- Students table
CREATE TABLE IF NOT EXISTS "Student" (
  "id" CHAR(24) PRIMARY KEY,
  "schoolId" CHAR(24) NOT NULL REFERENCES "School"("id") ON DELETE CASCADE,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "dateOfBirth" DATE NOT NULL,
  "gender" CHAR(1),
  "studentNumber" VARCHAR(50) NOT NULL UNIQUE,
  "nationalId" VARCHAR(50),
  "email" VARCHAR(255),
  "phone" VARCHAR(20),
  "photoUrl" TEXT,
  "fingerprintHash" VARCHAR(255),
  "status" student_status DEFAULT 'active',
  "enrollmentDate" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_student_school_number ON "Student"("schoolId", "studentNumber");
CREATE INDEX idx_student_school ON "Student"("schoolId");
CREATE INDEX idx_student_status ON "Student"("status");
CREATE INDEX idx_student_last_name ON "Student"("lastName");

-- Teachers table
CREATE TABLE IF NOT EXISTS "Teacher" (
  "id" CHAR(24) PRIMARY KEY,
  "schoolId" CHAR(24) NOT NULL REFERENCES "School"("id") ON DELETE CASCADE,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "employeeNumber" VARCHAR(50) NOT NULL UNIQUE,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "phone" VARCHAR(20),
  "specialization" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "experienceYears" INT DEFAULT 0,
  "status" teacher_status DEFAULT 'active',
  "hireDate" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_teacher_school_number ON "Teacher"("schoolId", "employeeNumber");
CREATE INDEX idx_teacher_school ON "Teacher"("schoolId");

-- Classes table
CREATE TABLE IF NOT EXISTS "Class" (
  "id" CHAR(24) PRIMARY KEY,
  "schoolId" CHAR(24) NOT NULL REFERENCES "School"("id") ON DELETE CASCADE,
  "academicYearId" CHAR(24) NOT NULL REFERENCES "AcademicYear"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "level" VARCHAR(50) NOT NULL,
  "section" VARCHAR(10),
  "maxCapacity" INT DEFAULT 50,
  "minCapacity" INT DEFAULT 20,
  "classTeacherId" CHAR(24),
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("schoolId", "academicYearId", "name")
);

CREATE INDEX idx_class_school ON "Class"("schoolId");
CREATE INDEX idx_class_level ON "Class"("level");
CREATE INDEX idx_class_academic_year ON "Class"("academicYearId");

-- Enrollments table
CREATE TABLE IF NOT EXISTS "Enrollment" (
  "id" CHAR(24) PRIMARY KEY,
  "schoolId" CHAR(24) NOT NULL REFERENCES "School"("id") ON DELETE CASCADE,
  "studentId" CHAR(24) NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "classId" CHAR(24) NOT NULL REFERENCES "Class"("id") ON DELETE CASCADE,
  "academicYearId" CHAR(24) NOT NULL,
  "enrollmentDate" TIMESTAMPTZ NOT NULL,
  "withdrawalDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("studentId", "classId", "academicYearId")
);

CREATE INDEX idx_enrollment_school ON "Enrollment"("schoolId");
CREATE INDEX idx_enrollment_student ON "Enrollment"("studentId");
CREATE INDEX idx_enrollment_class ON "Enrollment"("classId");

-- Subjects table
CREATE TABLE IF NOT EXISTS "Subject" (
  "id" CHAR(24) PRIMARY KEY,
  "schoolId" CHAR(24) NOT NULL REFERENCES "School"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "code" VARCHAR(20) NOT NULL,
  "description" TEXT,
  "coefficient" DECIMAL(3,1) DEFAULT 1.0,
  "maxGradeValue" DECIMAL(5,2) DEFAULT 20,
  "minGradeValue" DECIMAL(5,2) DEFAULT 0,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("schoolId", "code")
);

CREATE INDEX idx_subject_school ON "Subject"("schoolId");

-- ClassSubject mapping
CREATE TABLE IF NOT EXISTS "ClassSubject" (
  "id" CHAR(24) PRIMARY KEY,
  "classId" CHAR(24) NOT NULL REFERENCES "Class"("id") ON DELETE CASCADE,
  "subjectId" CHAR(24) NOT NULL REFERENCES "Subject"("id") ON DELETE CASCADE,
  "teacherId" CHAR(24) NOT NULL REFERENCES "Teacher"("id") ON DELETE SET NULL,
  "hoursPerWeek" INT DEFAULT 3,
  "scheduleJson" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("classId", "subjectId")
);

CREATE INDEX idx_class_subject_class ON "ClassSubject"("classId");
CREATE INDEX idx_class_subject_teacher ON "ClassSubject"("teacherId");

-- Grades table
CREATE TABLE IF NOT EXISTS "Grade" (
  "id" CHAR(24) PRIMARY KEY,
  "schoolId" CHAR(24) NOT NULL REFERENCES "School"("id") ON DELETE CASCADE,
  "studentId" CHAR(24) NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "subjectId" CHAR(24) NOT NULL REFERENCES "Subject"("id") ON DELETE CASCADE,
  "teacherId" CHAR(24) NOT NULL,
  "academicYearId" CHAR(24) NOT NULL,
  "value" DECIMAL(5,2) NOT NULL,
  "type" grade_type DEFAULT 'exam',
  "weight" DECIMAL(3,2) DEFAULT 1.0,
  "assessmentDate" TIMESTAMPTZ NOT NULL,
  "isValidated" BOOLEAN DEFAULT FALSE,
  "validatedBy" VARCHAR(255),
  "validatedAt" TIMESTAMPTZ,
  "isAbsence" BOOLEAN DEFAULT FALSE,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMPTZ,
  "createdBy" VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX idx_grade_unique ON "Grade"("studentId", "subjectId", "academicYearId", "type", "assessmentDate") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_grade_student ON "Grade"("studentId");
CREATE INDEX idx_grade_subject ON "Grade"("subjectId");
CREATE INDEX idx_grade_academic_year ON "Grade"("academicYearId");
CREATE INDEX idx_grade_validated ON "Grade"("isValidated");

-- Attendance table
CREATE TABLE IF NOT EXISTS "Attendance" (
  "id" CHAR(24) PRIMARY KEY,
  "schoolId" CHAR(24) NOT NULL REFERENCES "School"("id") ON DELETE CASCADE,
  "studentId" CHAR(24) NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "classId" CHAR(24) NOT NULL,
  "subjectId" CHAR(24),
  "date" DATE NOT NULL,
  "status" attendance_status DEFAULT 'present',
  "justificationUrl" TEXT,
  "justificationReason" VARCHAR(500),
  "justifiedAt" TIMESTAMPTZ,
  "notes" TEXT,
  "recordedBy" VARCHAR(255) NOT NULL,
  "recordedAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("studentId", "classId", "date", "subjectId")
);

CREATE INDEX idx_attendance_student ON "Attendance"("studentId");
CREATE INDEX idx_attendance_date ON "Attendance"("date");
CREATE INDEX idx_attendance_status ON "Attendance"("status");

-- Bulletins table
CREATE TABLE IF NOT EXISTS "Bulletin" (
  "id" CHAR(24) PRIMARY KEY,
  "schoolId" CHAR(24) NOT NULL REFERENCES "School"("id") ON DELETE CASCADE,
  "studentId" CHAR(24) NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "academicYearId" CHAR(24) NOT NULL,
  "semesterNumber" INT NOT NULL,
  "averageGrade" DECIMAL(5,2),
  "classRank" INT,
  "classSize" INT,
  "pdfUrl" TEXT,
  "pdfGeneratedAt" TIMESTAMPTZ,
  "signedBy" VARCHAR(255),
  "signedAt" TIMESTAMPTZ,
  "status" bulletin_status DEFAULT 'draft',
  "sentAt" TIMESTAMPTZ,
  "viewedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("studentId", "academicYearId", "semesterNumber")
);

CREATE INDEX idx_bulletin_student ON "Bulletin"("studentId");
CREATE INDEX idx_bulletin_status ON "Bulletin"("status");

-- Audit logs table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" CHAR(24) PRIMARY KEY,
  "schoolId" CHAR(24) NOT NULL REFERENCES "School"("id") ON DELETE CASCADE,
  "entity" VARCHAR(50) NOT NULL,
  "entityId" VARCHAR(255) NOT NULL,
  "action" VARCHAR(20) NOT NULL,
  "userId" VARCHAR(255) NOT NULL,
  "userEmail" VARCHAR(255),
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" INET,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_school ON "AuditLog"("schoolId");
CREATE INDEX idx_audit_entity ON "AuditLog"("entity", "entityId");
CREATE INDEX idx_audit_date ON "AuditLog"("createdAt");

-- Enable Row-Level Security
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Grade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Class" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY school_isolation ON "Student" FOR ALL USING ("schoolId" = CURRENT_SETTING('app.current_school')::TEXT);
CREATE POLICY grade_school_isolation ON "Grade" FOR ALL USING ("schoolId" = CURRENT_SETTING('app.current_school')::TEXT);
CREATE POLICY attendance_school_isolation ON "Attendance" FOR ALL USING ("schoolId" = CURRENT_SETTING('app.current_school')::TEXT);
CREATE POLICY class_school_isolation ON "Class" FOR ALL USING ("schoolId" = CURRENT_SETTING('app.current_school')::TEXT);
```

---

## 3. Database Indices Strategy

```sql
-- Performance-critical indices
CREATE INDEX CONCURRENTLY idx_grade_search ON "Grade"("schoolId", "academicYearId", "studentId") 
  WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY idx_attendance_search ON "Attendance"("schoolId", "studentId", "date");

CREATE INDEX CONCURRENTLY idx_student_class_year ON "Enrollment"("schoolId", "classId", "academicYearId");

-- Full-text search (PostgreSQL specific)
ALTER TABLE "Student" ADD COLUMN search_tsvector TSVECTOR;
UPDATE "Student" SET search_tsvector = 
  to_tsvector('french', "firstName" || ' ' || "lastName");
CREATE INDEX idx_student_search ON "Student" USING GIST(search_tsvector);
```

---

## 4. Views for Common Queries

```sql
-- Get student academic status
CREATE OR REPLACE VIEW student_academic_status AS
SELECT 
  s."id",
  s."schoolId",
  s."firstName" || ' ' || s."lastName" as full_name,
  COUNT(DISTINCT e."classId") as classes_count,
  AVG(g."value") as average_grade,
  COUNT(DISTINCT a."id") as total_attendances
FROM "Student" s
LEFT JOIN "Enrollment" e ON s."id" = e."studentId"
LEFT JOIN "Grade" g ON s."id" = g."studentId"
LEFT JOIN "Attendance" a ON s."id" = a."studentId"
GROUP BY s."id", s."schoolId", full_name;

-- Get class statistics
CREATE OR REPLACE VIEW class_statistics AS
SELECT 
  c."id",
  c."schoolId",
  c."name",
  COUNT(DISTINCT e."studentId") as enrolled_students,
  AVG(g."value") as class_average_grade,
  COUNT(DISTINCT t."id") as total_teachers
FROM "Class" c
LEFT JOIN "Enrollment" e ON c."id" = e."classId"
LEFT JOIN "Grade" g ON e."studentId" = g."studentId"
LEFT JOIN "ClassSubject" cs ON c."id" = cs."classId"
LEFT JOIN "Teacher" t ON cs."teacherId" = t."id"
GROUP BY c."id", c."schoolId", c."name";
```

---

## 5. Triggerze for Audit Trail

```sql
-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_student_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "AuditLog" (id, "schoolId", entity, "entityId", action, "userId", "oldValues", "newValues", "createdAt")
  VALUES (
    gen_random_uuid()::TEXT,
    NEW."schoolId",
    'Student',
    NEW."id",
    TG_OP,
    CURRENT_USER,
    to_jsonb(OLD),
    to_jsonb(NEW),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_student
  AFTER INSERT OR UPDATE OR DELETE ON "Student"
  FOR EACH ROW
  EXECUTE FUNCTION audit_student_changes();

-- Similar triggers for Grade, Attendance, Class
```

---

## Notes d'Implémentation

1. **Multi-tenancy**: `schoolId` sur chaque table + RLS policies
2. **Performances**: Indices composites sur (schoolId, ressource_id)
3. **Audit**: Triggers automatiques + views
4. **Localisation**: Support UTF-8 complet, dates en TIMESTAMPTZ
5. **Scalabilité**: Partitioning possible sur `academicYearId` + `schoolId`
