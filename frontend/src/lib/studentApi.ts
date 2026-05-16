import { api } from "./api";
export { MAX_FILE_SIZE_BYTES, validateFileSize } from "./fileUpload";

export type Department = "CSE" | "COMPUTER" | "ELECTRICAL" | "MECHANICAL" | "EXTC" | "CIVIL";
export type AcademicYear = "FIRST_YEAR" | "SECOND_YEAR" | "THIRD_YEAR" | "FOURTH_YEAR";

export const DEPARTMENT_LABELS: Record<Department, string> = {
  CSE: "CSE(AI/ML)",
  COMPUTER: "COMPUTER",
  ELECTRICAL: "ELECTRICAL",
  MECHANICAL: "MECHANICAL",
  EXTC: "EXTC",
  CIVIL: "CIVIL",
};

export const departmentLabel = (d: string | null | undefined): string =>
  d ? DEPARTMENT_LABELS[d as Department] ?? d : "";

export interface StudentProfile {
  id: number;
  fullName: string;
  legalName: string | null;
  emailId: string;
  contactNo: string | null;
  parentsContactNo: string | null;
  studentId: string | null;
  department: Department | null;
  academicYear: AcademicYear | null;
  skills: string[];
  socialProfile: string | null;
  profilePic: string | null;
  resumeUrl: string | null;
  role: string;
  isHOD: boolean;
  isVerified: boolean;
  isActive: boolean;
  ambassadorAssignments: AmbassadorAssignment[];
}

export interface AmbassadorAssignment {
  id: string;
  roleName: string;
  servedAcademicYear: AcademicYear;
  createdAt: string;
}

export interface FieldDiff {
  oldValue: unknown;
  newValue: unknown;
}

export interface PendingVerification {
  id: string;
  changes: Record<string, FieldDiff>;
  entityType: "PROFILE" | "MARKS" | "INTERNSHIP" | "ACHIEVEMENT";
  entityId: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface ProfileResponse {
  user: StudentProfile;
}

export interface UpdateProfilePayload {
  fullName?: string;
  legalName?: string;
  contactNo?: string;
  parentsContactNo?: string;
  studentId?: string;
  department?: Department;
  academicYear?: AcademicYear;
  skills?: string[];
  socialProfile?: string;
  profilePic?: string;
  resumeUrl?: string;
}

export const getProfile = async (): Promise<ProfileResponse> => {
  const { data } = await api.get<ProfileResponse>("/student/profile");
  return data;
};

export const updateProfile = async (
  payload: UpdateProfilePayload
): Promise<ProfileResponse> => {
  const { data } = await api.patch<ProfileResponse>("/student/profile", payload);
  return data;
};

export const uploadProfilePic = async (file: File): Promise<{ url: string }> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ url: string }>("/student/profile/profile-pic", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const uploadResume = async (file: File): Promise<{ url: string }> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ url: string }>("/student/profile/resume", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// =================== MARKS ===================

export interface Marks {
  id: string;
  userId: number;
  sscPercentage: number | null;
  hscPercentage: number | null;
  diplomaPercentage: number | null;
  sem1: number | null;
  sem2: number | null;
  sem3: number | null;
  sem4: number | null;
  sem5: number | null;
  sem6: number | null;
  sem7: number | null;
  sem8: number | null;

  sscMarksheetUrl: string | null;
  hscMarksheetUrl: string | null;
  diplomaMarksheetUrl: string | null;
  sem1MarksheetUrl: string | null;
  sem2MarksheetUrl: string | null;
  sem3MarksheetUrl: string | null;
  sem4MarksheetUrl: string | null;
  sem5MarksheetUrl: string | null;
  sem6MarksheetUrl: string | null;
  sem7MarksheetUrl: string | null;
  sem8MarksheetUrl: string | null;

  isVerified: boolean;
  updatedAt: string;
}

export interface MarksResponse {
  marks: Marks;
  pendingVerification: PendingVerification | null;
}

export interface UpdateMarksResponse extends MarksResponse {
  appliedFields: string[];
  pendingFieldCount: number;
}

export type UpdateMarksPayload = Partial<
  Pick<
    Marks,
    | "sscPercentage"
    | "hscPercentage"
    | "diplomaPercentage"
    | "sem1"
    | "sem2"
    | "sem3"
    | "sem4"
    | "sem5"
    | "sem6"
    | "sem7"
    | "sem8"
    | "sscMarksheetUrl"
    | "hscMarksheetUrl"
    | "diplomaMarksheetUrl"
    | "sem1MarksheetUrl"
    | "sem2MarksheetUrl"
    | "sem3MarksheetUrl"
    | "sem4MarksheetUrl"
    | "sem5MarksheetUrl"
    | "sem6MarksheetUrl"
    | "sem7MarksheetUrl"
    | "sem8MarksheetUrl"
  >
>;

export const getMarks = async (): Promise<MarksResponse> => {
  const { data } = await api.get<MarksResponse>("/student/marks");
  return data;
};

export const updateMarks = async (
  payload: UpdateMarksPayload
): Promise<UpdateMarksResponse> => {
  const { data } = await api.patch<UpdateMarksResponse>("/student/marks", payload);
  return data;
};

// =================== INTERNSHIP ===================

export interface Internship {
  id: string;
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
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InternshipPayload {
  companyName: string;
  role: string;
  roleDescription?: string;
  duration?: string;
  startDate: string;
  endDate?: string;
  certificateUrl?: string;
  hrName?: string;
  hrEmail?: string;
  hrPhone?: string;
}

export const listInternships = async (): Promise<{ items: Internship[] }> => {
  const { data } = await api.get<{ items: Internship[] }>("/student/internships");
  return data;
};

export const createInternship = async (
  payload: InternshipPayload
): Promise<{ internship: Internship }> => {
  const { data } = await api.post<{ internship: Internship }>(
    "/student/internships",
    payload
  );
  return data;
};

export const updateInternship = async (
  id: string,
  payload: Partial<InternshipPayload>
): Promise<{ internship: Internship }> => {
  const { data } = await api.patch<{ internship: Internship }>(
    `/student/internships/${id}`,
    payload
  );
  return data;
};

export const deleteInternship = async (id: string): Promise<void> => {
  await api.delete(`/student/internships/${id}`);
};

// =================== ACHIEVEMENT ===================

export interface Achievement {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  certificateUrl: string | null;
  achievementDate: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementPayload {
  title: string;
  description?: string;
  category?: string;
  certificateUrl?: string;
  achievementDate?: string;
}

export const listAchievements = async (): Promise<{ items: Achievement[] }> => {
  const { data } = await api.get<{ items: Achievement[] }>("/student/achievements");
  return data;
};

export const createAchievement = async (
  payload: AchievementPayload
): Promise<{ achievement: Achievement }> => {
  const { data } = await api.post<{ achievement: Achievement }>(
    "/student/achievements",
    payload
  );
  return data;
};

export const updateAchievement = async (
  id: string,
  payload: Partial<AchievementPayload>
): Promise<{ achievement: Achievement }> => {
  const { data } = await api.patch<{ achievement: Achievement }>(
    `/student/achievements/${id}`,
    payload
  );
  return data;
};

export const deleteAchievement = async (id: string): Promise<void> => {
  await api.delete(`/student/achievements/${id}`);
};

// =================== PROJECT ===================

export interface Project {
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
  updatedAt: string;
}

export interface ProjectPayload {
  title: string;
  description?: string;
  techStack?: string[];
  projectUrl?: string;
  repoUrl?: string;
  startDate?: string;
  endDate?: string;
}

export const listProjects = async (): Promise<{ items: Project[] }> => {
  const { data } = await api.get<{ items: Project[] }>("/student/projects");
  return data;
};

export const createProject = async (
  payload: ProjectPayload
): Promise<{ project: Project }> => {
  const { data } = await api.post<{ project: Project }>(
    "/student/projects",
    payload
  );
  return data;
};

export const updateProject = async (
  id: string,
  payload: Partial<ProjectPayload>
): Promise<{ project: Project }> => {
  const { data } = await api.patch<{ project: Project }>(
    `/student/projects/${id}`,
    payload
  );
  return data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/student/projects/${id}`);
};

// =================== CERTIFICATE ===================

export interface Certificate {
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
  updatedAt: string;
}

export interface CertificatePayload {
  title: string;
  issuingOrg: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  certificateUrl?: string;
}

export const listCertificates = async (): Promise<{ items: Certificate[] }> => {
  const { data } = await api.get<{ items: Certificate[] }>("/student/certificates");
  return data;
};

export const createCertificate = async (
  payload: CertificatePayload
): Promise<{ certificate: Certificate }> => {
  const { data } = await api.post<{ certificate: Certificate }>(
    "/student/certificates",
    payload
  );
  return data;
};

export const updateCertificate = async (
  id: string,
  payload: Partial<CertificatePayload>
): Promise<{ certificate: Certificate }> => {
  const { data } = await api.patch<{ certificate: Certificate }>(
    `/student/certificates/${id}`,
    payload
  );
  return data;
};

export const deleteCertificate = async (id: string): Promise<void> => {
  await api.delete(`/student/certificates/${id}`);
};

// =================== GENERIC UPLOADS ===================

const upload = async (path: string, file: File): Promise<{ url: string }> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ url: string }>(path, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const uploadCertificate = (file: File) =>
  upload("/student/uploads/certificate", file);

export const uploadMarksheet = async (
  file: File,
  field: string
): Promise<{ url: string }> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ url: string }>(
    `/student/marks/upload/${field}`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};
