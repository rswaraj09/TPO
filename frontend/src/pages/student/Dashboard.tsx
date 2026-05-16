import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  FileText,
  Upload,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { StudentLayout } from "@/components/shared/StudentLayout";
import { extractErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  getProfile,
  updateProfile,
  uploadProfilePic,
  uploadResume,
  getMarks,
  updateMarks,
  uploadMarksheet,
  type StudentProfile,
  DEPARTMENT_LABELS,
  type Department,
  type AcademicYear,
  type UpdateProfilePayload,
  type Marks,
} from "@/lib/studentApi";
import { validateFileSize } from "@/lib/fileUpload";
import { MAX_PROFILE_PIC_BYTES } from "@/lib/fileUpload";

const DEPARTMENTS: Department[] = [
  "CSE",
  "COMPUTER",
  "ELECTRICAL",
  "MECHANICAL",
  "EXTC",
  "CIVIL",
];
const YEARS: { value: AcademicYear; label: string }[] = [
  { value: "FIRST_YEAR", label: "1st Year" },
  { value: "SECOND_YEAR", label: "2nd Year" },
  { value: "THIRD_YEAR", label: "3rd Year" },
  { value: "FOURTH_YEAR", label: "4th Year" },
];

interface FormState {
  fullName: string;
  legalName: string;
  contactNo: string;
  parentsContactNo: string;
  studentId: string;
  department: Department | "";
  academicYear: AcademicYear | "";
  skills: string;
  socialProfile: string;
}

const toFormState = (u: StudentProfile): FormState => ({
  fullName: u.fullName ?? "",
  legalName: u.legalName ?? "",
  contactNo: u.contactNo ?? "",
  parentsContactNo: u.parentsContactNo ?? "",
  studentId: u.studentId ?? "",
  department: (u.department ?? "") as FormState["department"],
  academicYear: (u.academicYear ?? "") as FormState["academicYear"],
  skills: (u.skills ?? []).join(", "),
  socialProfile: u.socialProfile ?? "",
});

const buildPayload = (form: FormState): UpdateProfilePayload => {
  const payload: UpdateProfilePayload = {
    fullName: form.fullName,
    legalName: form.legalName,
    contactNo: form.contactNo,
    parentsContactNo: form.parentsContactNo,
    studentId: form.studentId,
    skills: form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    socialProfile: form.socialProfile || "",
  };
  if (form.department) payload.department = form.department as Department;
  if (form.academicYear)
    payload.academicYear = form.academicYear as AcademicYear;
  return payload;
};

export function StudentDashboard() {
  const picInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const { refresh } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [marks, setMarks] = useState<Marks | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [profileData, marksData] = await Promise.all([
        getProfile(),
        getMarks(),
      ]);
      setProfile(profileData.user);
      setMarks(marksData.marks);
      setForm(toFormState(profileData.user));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !profile) return;
    setSaving(true);
    try {
      const res = await updateProfile(buildPayload(form));
      setProfile(res.user);
      setForm(toFormState(res.user));
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onPicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFileSize(file, MAX_PROFILE_PIC_BYTES)) {
      if (picInputRef.current) picInputRef.current.value = "";
      return;
    }
    setUploadingPic(true);
    try {
      const { url } = await uploadProfilePic(file);
      setProfile((p) => (p ? { ...p, profilePic: url } : p));
      // Refresh AuthContext so header/sidebar reflect the new picture immediately
      await refresh();
      toast.success("Profile picture updated.");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUploadingPic(false);
      if (picInputRef.current) picInputRef.current.value = "";
    }
  };

  const onResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFileSize(file)) {
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      return;
    }
    setUploadingResume(true);
    try {
      const { url } = await uploadResume(file);
      setProfile((p) => (p ? { ...p, resumeUrl: url } : p));
      toast.success("Resume uploaded.");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  return (
    <StudentLayout
      title="Dashboard"
      subtitle="Manage your profile, resume and placement details."
    >
      {loading || !form || !profile ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Welcome banner */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative">
                {profile.profilePic ? (
                  <img
                    src={profile.profilePic}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover ring-1 ring-neutral-200"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-2xl font-bold text-white">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => picInputRef.current?.click()}
                  disabled={uploadingPic}
                  className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-60"
                  title="Change profile picture"
                >
                  {uploadingPic ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>
                <input
                  ref={picInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onPicChange}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                  Welcome, {profile.fullName}
                </h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {[
                    profile.studentId,
                    profile.department
                      ? DEPARTMENT_LABELS[profile.department]
                      : null,
                    profile.academicYear?.replace("_", " ").toLowerCase(),
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Complete your profile to get started"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 ring-1 ring-yellow-200">
                      Verification pending
                    </span>
                  )}
                  {profile.resumeUrl ? (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                      Resume uploaded
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                      Resume missing
                    </span>
                  )}
                </div>
                {profile.ambassadorAssignments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.ambassadorAssignments.map((assignment) => (
                      <span
                        key={assignment.id}
                        className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700"
                      >
                        {assignment.roleName} · {assignment.servedAcademicYear.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic info */}
            <Section
              title="Basic information"
              subtitle="Update your personal details and contact information."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  id="fullName"
                  label="Full Name"
                  value={form.fullName}
                  onChange={(v) => set("fullName", v)}
                />
                <FormField
                  id="legalName"
                  label="Legal Name"
                  value={form.legalName}
                  onChange={(v) => set("legalName", v)}
                  placeholder="As on official records"
                />
                <FormField
                  id="emailId"
                  label="Email"
                  value={profile.emailId}
                  onChange={() => {}}
                  disabled
                />
                <FormField
                  id="contactNo"
                  label="Contact No"
                  value={form.contactNo}
                  onChange={(v) => set("contactNo", v)}
                  placeholder="+91 7070416209"
                />
                <FormField
                  id="parentsContactNo"
                  label="Parent's Contact No"
                  value={form.parentsContactNo}
                  onChange={(v) => set("parentsContactNo", v)}
                />
                <FormField
                  id="studentId"
                  label="Student ID"
                  value={form.studentId}
                  onChange={(v) => set("studentId", v)}
                />
                <FormSelect
                  id="department"
                  label="Department"
                  value={form.department}
                  onChange={(v) => set("department", v)}
                  options={[
                    { value: "", label: "Select department" },
                    ...DEPARTMENTS.map((d) => ({
                      value: d,
                      label: DEPARTMENT_LABELS[d],
                    })),
                  ]}
                />
                <FormSelect
                  id="academicYear"
                  label="Academic Year"
                  value={form.academicYear}
                  onChange={(v) => set("academicYear", v)}
                  options={[
                    { value: "", label: "Select year" },
                    ...YEARS.map((y) => ({ value: y.value, label: y.label })),
                  ]}
                />
                <FormField
                  id="skills"
                  label="Skills (comma-separated)"
                  className="md:col-span-2"
                  value={form.skills}
                  onChange={(v) => set("skills", v)}
                  placeholder="React, Node.js, PostgreSQL"
                />
                <FormField
                  id="socialProfile"
                  label="Social / Portfolio URL"
                  className="md:col-span-2"
                  value={form.socialProfile}
                  onChange={(v) => set("socialProfile", v)}
                  placeholder="https://linkedin.com/in/…"
                />
              </div>
            </Section>

            {/* Resume */}
            <Section title="Resume" subtitle="PDF only, max 1MB.">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                  <FileText className="h-5 w-5 text-neutral-500" />
                </div>
                <div className="min-w-0 flex-1">
                  {profile.resumeUrl ? (
                    <a
                      href={profile.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 hover:underline"
                    >
                      View current resume
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="text-sm text-neutral-500">
                      No resume uploaded yet.
                    </p>
                  )}
                </div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={onResumeChange}
                />
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={uploadingResume}
                  className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-60"
                >
                  {uploadingResume ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingResume
                    ? "Uploading…"
                    : profile.resumeUrl
                      ? "Replace"
                      : "Upload"}
                </button>
              </div>
            </Section>

            {/* Academic Marksheets */}
            <Section
              title="Academic Marksheets"
              subtitle="Upload your marksheets and enter your scores. Changes require faculty verification."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <MarksheetField
                    label="10th (SSC) %"
                    field="sscPercentage"
                    urlField="sscMarksheetUrl"
                    marks={marks}
                    onUpdate={setMarks}
                  />
                  <MarksheetField
                    label="12th (HSC) %"
                    field="hscPercentage"
                    urlField="hscMarksheetUrl"
                    marks={marks}
                    onUpdate={setMarks}
                  />
                  <MarksheetField
                    label="Diploma %"
                    field="diplomaPercentage"
                    urlField="diplomaMarksheetUrl"
                    marks={marks}
                    onUpdate={setMarks}
                  />
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <MarksheetField
                      key={sem}
                      label={`Semester ${sem} CGPA`}
                      field={`sem${sem}` as keyof Marks}
                      urlField={`sem${sem}MarksheetUrl` as keyof Marks}
                      marks={marks}
                      onUpdate={setMarks}
                    />
                  ))}
                </div>
              </div>
            </Section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </StudentLayout>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <header className="mb-5">
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-700"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50 disabled:text-neutral-500"
      />
    </div>
  );
}

function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-700"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MarksheetField({
  label,
  field,
  urlField,
  marks,
  onUpdate,
}: {
  label: string;
  field: keyof Marks;
  urlField: keyof Marks;
  marks: Marks | null;
  onUpdate: (m: Marks) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState<string>(
    marks ? String(marks[field] ?? "") : ""
  );

  useEffect(() => {
    if (marks) {
      setValue(String(marks[field] ?? ""));
    }
  }, [marks, field]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFileSize(file)) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadMarksheet(file, urlField as string);
      if (marks) {
        onUpdate({ ...marks, [urlField]: url });
      }
      toast.success(`${label} marksheet uploaded.`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleBlur = async () => {
    if (!marks) return;
    const num = value.trim() === "" ? null : Number(value);
    if (num === marks[field]) return;
    const isSem = (field as string).startsWith("sem");
    const max = isSem ? 10 : 100;
    if (num !== null && (Number.isNaN(num) || num < 0 || num > max)) {
      toast.error(`Invalid score value (max ${max})`);
      setValue(String(marks[field] ?? ""));
      return;
    }

    setSaving(true);
    try {
      const res = await updateMarks({ [field]: num });
      onUpdate(res.marks);
      if (res.pendingFieldCount > 0) {
        toast.success("Score submitted for verification.");
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setValue(String(marks[field] ?? ""));
    } finally {
      setSaving(false);
    }
  };

  const currentUrl = marks ? (marks[urlField] as string | null) : null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </label>
      <div className="mt-1.5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            disabled={saving}
            placeholder="Score"
            className="h-8 w-full rounded border border-neutral-200 bg-white px-2 text-xs transition focus:border-neutral-900 focus:outline-none disabled:opacity-60"
          />
          {saving && <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded border border-neutral-200 bg-white text-[10px] font-medium text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            {currentUrl ? "Update File" : "Upload File"}
          </button>
          {currentUrl && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
              title="View Marksheet"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}


