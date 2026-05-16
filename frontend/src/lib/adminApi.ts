import { api } from "./api";
import type { Department, AcademicYear, FieldDiff } from "./studentApi";

export type Role = "ADMIN" | "FACULTY" | "STUDENT" | "ALUMNI";

export interface AdminStats {
  totals: {
    students: number;
    alumni: number;
    faculty: number;
  };
  pending: {
    registrations: number;
    profileOrMarksVerifications: number;
    internshipVerifications: number;
    achievementVerifications: number;
  };
  studentsByDepartment: Array<{
    department: Department | null;
    count: number;
  }>;
}

export interface PendingRegistration {
  id: number;
  fullName: string;
  emailId: string;
  contactNo: string | null;
  studentId: string | null;
  department: Department | null;
  academicYear: AcademicYear | null;
  createdAt: string;
}

export interface StudentListItem {
  id: number;
  fullName: string;
  legalName: string | null;
  emailId: string;
  contactNo: string | null;
  studentId: string | null;
  department: Department | null;
  academicYear: AcademicYear | null;
  avgCgpa: number | null;
  role: Role;
  profilePic: string | null;
  resumeUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  ambassadorAssignments: AmbassadorAssignment[];
  createdAt: string;
}

export interface StudentListResponse {
  items: StudentListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StudentListFilters {
  page?: number;
  limit?: number;
  department?: Department;
  academicYear?: AcademicYear;
  role?: "STUDENT" | "ALUMNI";
  isVerified?: boolean;
  isActive?: boolean;
  minCgpa?: number;
  search?: string;
  pendingEntity?: "PROFILE_OR_MARKS" | "INTERNSHIP" | "ACHIEVEMENT";
}

export interface StudentProject {
  id: string;
  title: string;
  description: string | null;
  techStack: string[];
  projectUrl: string | null;
  repoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface StudentCertificate {
  id: string;
  title: string;
  issuingOrg: string;
  issueDate: string | null;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  certificateUrl: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface StudentDetailResponse {
  user: StudentListItem & {
    parentsContactNo: string | null;
    skills: string[];
    socialProfile: string | null;
  };
  marks: Record<string, unknown> | null;
  internships: Array<Record<string, unknown>>;
  achievements: Array<Record<string, unknown>>;
  certificates: StudentCertificate[];
  projects: StudentProject[];
  pendingVerifications: Array<Record<string, unknown>>;
}

export interface StartupItem {
  id: string;
  name: string;
  tagline: string | null;
  industry: string | null;
  website: string | null;
  location: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  foundedYear: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StartupPayload {
  name: string;
  tagline?: string;
  industry?: string;
  website?: string;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  foundedYear?: number;
  notes?: string;
  isActive?: boolean;
}

export interface AmbassadorAssignment {
  id: string;
  roleName: string;
  servedAcademicYear: string;
  createdAt: string;
  student: {
    id: number;
    fullName: string;
    emailId: string;
    studentId: string | null;
    department: Department | null;
    academicYear: AcademicYear | null;
    profilePic: string | null;
  };
}

export const AMBASSADOR_ROLE_OPTIONS = [
  "TPO Head",
  "TPO Co-Head",
  "Magazine Team",
  "Drive Team",
  "Database Team",
  "Industry Relation Team",
  "LinkedIn Team",
  "Coding Club Team",
  "Media Team",
  "Event Management Team",
] as const;

export type AmbassadorRole = (typeof AMBASSADOR_ROLE_OPTIONS)[number];

export interface FacultyListItem {
  id: number;
  fullName: string;
  emailId: string;
  contactNo: string | null;
  department: Department | null;
  isHOD: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface FacultyDetailResponse {
  faculty: FacultyListItem;
}

export interface CreateFacultyPayload {
  fullName: string;
  emailId: string;
  contactNo: string;
  department: Department;
  isHOD?: boolean;
  password?: string;
}

export interface UpdateFacultyPayload {
  fullName?: string;
  contactNo?: string;
  department?: Department;
  isHOD?: boolean;
}

export const getStats = async (): Promise<AdminStats> => {
  const { data } = await api.get<AdminStats>("/admin/stats");
  return data;
};

export interface PlacementReportItem {
  id: string;
  appliedAt: string;
  updatedAt: string;
  student: {
    id: number;
    fullName: string;
    emailId: string;
    studentId: string | null;
    department: Department | null;
    academicYear: AcademicYear | null;
    avgCgpa: number | null;
  };
  job: {
    id: string;
    companyName: string;
    jobTitle: string;
    package: string | null;
    jobType: string | null;
    location: string | null;
  };
}

export interface PlacementReport {
  items: PlacementReportItem[];
  generatedAt: string;
}

export const getPlacementReport = async (): Promise<PlacementReport> => {
  const { data } = await api.get<PlacementReport>("/admin/placement-report");
  return data;
};

export const listPendingRegistrations = async (): Promise<PendingRegistration[]> => {
  const { data } = await api.get<{ items: PendingRegistration[] }>(
    "/admin/registrations"
  );
  return data.items;
};

export const approveRegistration = async (id: number): Promise<void> => {
  await api.post(`/admin/registrations/${id}/approve`);
};

export const rejectRegistration = async (
  id: number,
  reason?: string
): Promise<void> => {
  await api.post(`/admin/registrations/${id}/reject`, { reason });
};

// ==================== ADMIN PENDING VERIFICATIONS ====================

export interface AdminQueueStudentStub {
  id: number;
  fullName: string;
  emailId: string;
  studentId: string | null;
  department: Department | null;
  academicYear: AcademicYear | null;
  profilePic: string | null;
}

interface AdminBaseQueueItem {
  id: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  student: AdminQueueStudentStub;
}

export interface AdminVerificationRequestItem extends AdminBaseQueueItem {
  kind: "VERIFICATION_REQUEST";
  entityType: "PROFILE" | "MARKS";
  changes: Record<string, FieldDiff>;
}

export interface AdminInternshipQueueItem extends AdminBaseQueueItem {
  kind: "INTERNSHIP";
  entityType: "INTERNSHIP";
  data: {
    companyName: string;
    role: string;
    roleDescription: string | null;
    duration: string | null;
    startDate: string;
    endDate: string | null;
    certificateUrl: string | null;
    hrName: string | null;
    hrEmail: string | null;
    hrPhone: string | null;
  };
}

export interface AdminAchievementQueueItem extends AdminBaseQueueItem {
  kind: "ACHIEVEMENT";
  entityType: "ACHIEVEMENT";
  data: {
    title: string;
    description: string | null;
    category: string | null;
    certificateUrl: string | null;
    achievementDate: string | null;
  };
}

export interface AdminCertificateQueueItem extends AdminBaseQueueItem {
  kind: "CERTIFICATE";
  entityType: "CERTIFICATE";
  data: {
    title: string;
    issuingOrg: string;
    issueDate: string | null;
    expiryDate: string | null;
    credentialId: string | null;
    credentialUrl: string | null;
    certificateUrl: string | null;
  };
}

export type AdminQueueItem =
  | AdminVerificationRequestItem
  | AdminInternshipQueueItem
  | AdminAchievementQueueItem
  | AdminCertificateQueueItem;

export const listAdminPendingVerifications = async (): Promise<AdminQueueItem[]> => {
  const { data } = await api.get<{ items: AdminQueueItem[] }>("/admin/verifications");
  return data.items;
};

export const adminReviewVerificationRequest = async (
  id: string,
  payload: { status: "APPROVED" | "REJECTED"; remarks?: string }
): Promise<void> => {
  await api.post(`/admin/verifications/${id}/review`, payload);
};

export const adminReviewInternship = async (
  id: string,
  payload: { isVerified: boolean; remarks?: string }
): Promise<void> => {
  await api.post(`/admin/internships/${id}/review`, payload);
};

export const adminReviewAchievement = async (
  id: string,
  payload: { isVerified: boolean; remarks?: string }
): Promise<void> => {
  await api.post(`/admin/achievements/${id}/review`, payload);
};

export const adminReviewCertificate = async (
  id: string,
  payload: { isVerified: boolean; remarks?: string }
): Promise<void> => {
  await api.post(`/admin/certificates/${id}/review`, payload);
};

export const listFaculty = async (): Promise<FacultyListItem[]> => {
  const { data } = await api.get<{ items: FacultyListItem[] }>("/admin/faculty");
  return data.items;
};

export const getFacultyDetail = async (
  id: number
): Promise<FacultyDetailResponse> => {
  const { data } = await api.get<FacultyDetailResponse>(`/admin/faculty/${id}`);
  return data;
};

export const createFaculty = async (
  payload: CreateFacultyPayload
): Promise<FacultyListItem> => {
  const { data } = await api.post<{ faculty: FacultyListItem }>(
    "/admin/faculty",
    payload
  );
  return data.faculty;
};

export const updateFaculty = async (
  id: number,
  payload: UpdateFacultyPayload
): Promise<FacultyListItem> => {
  const { data } = await api.patch<{ faculty: FacultyListItem }>(
    `/admin/faculty/${id}`,
    payload
  );
  return data.faculty;
};

export const listStudents = async (
  filters: StudentListFilters = {}
): Promise<StudentListResponse> => {
  const params: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      params[key] = value as string | number | boolean;
    }
  });
  const { data } = await api.get<StudentListResponse>("/admin/students", { params });
  return data;
};

export const getStudentDetail = async (
  id: number
): Promise<StudentDetailResponse> => {
  const { data } = await api.get<StudentDetailResponse>(`/admin/students/${id}`);
  return data;
};

export const graduateStudent = async (id: number): Promise<void> => {
  await api.post(`/admin/students/${id}/graduate`);
};

export const setUserStatus = async (
  id: number,
  isActive: boolean
): Promise<void> => {
  await api.patch(`/admin/users/${id}/status`, { isActive });
};

// =================== STUDENT NOTES ===================

export interface StudentNote {
  id: string;
  content: string;
  createdAt: string;
  author: { id: number; fullName: string; role: string; profilePic: string | null };
}

export const listStudentNotes = async (studentId: number): Promise<StudentNote[]> => {
  const { data } = await api.get<{ notes: StudentNote[] }>(`/admin/students/${studentId}/notes`);
  return data.notes;
};

export const addStudentNote = async (studentId: number, content: string): Promise<StudentNote> => {
  const { data } = await api.post<{ note: StudentNote }>(`/admin/students/${studentId}/notes`, { content });
  return data.note;
};

export const deleteStudentNote = async (studentId: number, noteId: string): Promise<void> => {
  await api.delete(`/admin/students/${studentId}/notes/${noteId}`);
};

export const listStartups = async (): Promise<StartupItem[]> => {
  const { data } = await api.get<{ items: StartupItem[] }>("/admin/startups");
  return data.items;
};

export const createStartup = async (payload: StartupPayload): Promise<StartupItem> => {
  const { data } = await api.post<{ startup: StartupItem }>("/admin/startups", payload);
  return data.startup;
};

export const updateStartup = async (
  id: string,
  payload: Partial<StartupPayload>
): Promise<StartupItem> => {
  const { data } = await api.patch<{ startup: StartupItem }>(`/admin/startups/${id}`, payload);
  return data.startup;
};

export const deleteStartup = async (id: string): Promise<void> => {
  await api.delete(`/admin/startups/${id}`);
};

export const listAmbassadors = async (): Promise<AmbassadorAssignment[]> => {
  const { data } = await api.get<{ items: AmbassadorAssignment[] }>("/admin/ambassadors");
  return data.items;
};

export const createAmbassadorAssignment = async (payload: {
  studentId: number;
  roleName: AmbassadorRole;
  servedAcademicYear: string;
}): Promise<AmbassadorAssignment> => {
  const { data } = await api.post<{ assignment: AmbassadorAssignment }>("/admin/ambassadors", payload);
  return data.assignment;
};

export const deleteAmbassadorAssignment = async (id: string): Promise<void> => {
  await api.delete(`/admin/ambassadors/${id}`);
};
