import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  IdCard,
  GraduationCap,
  Building2,
  FileText,
  ExternalLink,
  Loader2,
  BadgeCheck,
  Users,
  Github,
  Sparkles,
  FolderGit2,
  Download,
  ShieldCheck,
} from "lucide-react";
import { getStudentDetail, type StudentDetailResponse, listStudentNotes, addStudentNote, deleteStudentNote } from "@/lib/adminApi";
import { departmentLabel } from "@/lib/studentApi";
import { extractErrorMessage } from "@/lib/api";
import { AdminSidebar, type AdminTab } from "@/components/shared/AdminSidebar";
import { exportStudentProfileToPdf } from "@/lib/studentProfileExport";
import { StudentNotesPanel } from "@/components/shared/StudentNotesPanel";

export function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const n = Number(id);
    if (Number.isNaN(n)) {
      toast.error("Invalid student id");
      navigate("/admin");
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await getStudentDetail(n);
        setData(res);
      } catch (error) {
        toast.error(extractErrorMessage(error));
        navigate("/admin");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleSelectTab = (t: AdminTab) => {
    navigate(t === "overview" ? "/admin" : `/admin?tab=${t}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <AdminSidebar active="students" onSelect={handleSelectTab} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, marks, internships, achievements, projects, certificates } = data;
  const initials = user.fullName?.slice(0, 2).toUpperCase() || "ST";

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar active="students" onSelect={handleSelectTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
          <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 md:px-6">
            <Link
              to="/admin?tab=students"
              className="inline-flex flex-shrink-0 items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="hidden h-4 w-px bg-neutral-200 sm:block" />
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-900">
              Student details
            </h1>
            <button
              onClick={() => exportStudentProfileToPdf(data)}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm font-medium text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 sm:px-3"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 pb-24 sm:px-4 sm:py-6 md:space-y-6 md:px-6 md:py-8 md:pb-8">
        {/* Profile header */}
        <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:rounded-2xl sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:gap-5">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.fullName}
                className="h-16 w-16 rounded-full object-cover ring-1 ring-neutral-200 sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-base font-bold text-white sm:h-20 sm:w-20 sm:text-lg">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1 self-stretch">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="min-w-0 break-words text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                  {user.fullName}
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                    user.role === "ALUMNI"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user.role}
                </span>
                {user.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                    Unverified
                  </span>
                )}
                {!user.isActive && (
                  <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700">
                    Inactive
                  </span>
                )}
              </div>
              {user.legalName && (
                <p className="mt-0.5 text-sm text-neutral-500">
                  Legal name: {user.legalName}
                </p>
              )}

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={user.emailId}
                />
                <InfoRow
                  icon={Phone}
                  label="Contact"
                  value={user.contactNo ?? "—"}
                />
                <InfoRow
                  icon={Users}
                  label="Parent contact"
                  value={user.parentsContactNo ?? "—"}
                />
                <InfoRow
                  icon={IdCard}
                  label="Student ID"
                  value={user.studentId ?? "—"}
                />
                <InfoRow
                  icon={Building2}
                  label="Department"
                  value={departmentLabel(user.department) || "—"}
                />
                <InfoRow
                  icon={GraduationCap}
                  label="Academic year"
                  value={user.academicYear ?? "—"}
                />
              </dl>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {user.resumeUrl && (
                  <a
                    href={user.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 font-medium text-neutral-700 hover:border-neutral-900 hover:text-neutral-900"
                  >
                    <FileText className="h-4 w-4" />
                    Resume
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {user.socialProfile && (
                  <a
                    href={user.socialProfile}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 font-medium text-neutral-700 hover:border-neutral-900 hover:text-neutral-900"
                  >
                    LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {user.avgCgpa !== null && user.avgCgpa !== undefined && (
              <div className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-center sm:w-auto">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Avg CGPA
                </p>
                <p className="mt-1 text-2xl font-semibold text-neutral-900">
                  {user.avgCgpa.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Skills */}
        <Section title="Skills">
          {user.skills && user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-700"
                >
                  <Sparkles className="h-3 w-3 text-neutral-400" />
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <EmptyRow label="No skills listed yet." />
          )}
        </Section>

        <Section title="Student Ambassador Roles">
          {user.ambassadorAssignments && user.ambassadorAssignments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.ambassadorAssignments.map((assignment) => (
                <span
                  key={assignment.id}
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-700"
                >
                  {assignment.roleName} · {assignment.servedAcademicYear.replace("_", " ")}
                </span>
              ))}
            </div>
          ) : (
            <EmptyRow label="No ambassador or volunteer roles assigned." />
          )}
        </Section>

        {/* Projects */}
        <Section title={`Projects (${projects.length})`}>
          {projects.length === 0 ? (
            <EmptyRow label="No projects added yet." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                        <p className="truncate font-medium text-neutral-900">
                          {p.title}
                        </p>
                      </div>
                      {p.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-neutral-600">
                          {p.description}
                        </p>
                      )}
                    </div>
                    {p.isVerified ? (
                      <span className="flex-shrink-0 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="flex-shrink-0 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                  {p.techStack.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {p.techStack.map((t) => (
                        <span
                          key={t}
                          className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {(p.projectUrl || p.repoUrl) && (
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      {p.projectUrl && (
                        <a
                          href={p.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-neutral-900 underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Live
                        </a>
                      )}
                      {p.repoUrl && (
                        <a
                          href={p.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-neutral-900 underline"
                        >
                          <Github className="h-3 w-3" />
                          Code
                        </a>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Marks */}
        <Section title="Academic marks">
          {!marks ? (
            <EmptyRow label="No marks recorded yet." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Metric label="SSC %" value={marks.sscPercentage as number | null} suffix="%" />
              <Metric label="HSC %" value={marks.hscPercentage as number | null} suffix="%" />
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <Metric
                  key={n}
                  label={`Sem ${n}`}
                  value={(marks[`sem${n}` as keyof typeof marks] as number | null) ?? null}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Internships */}
        <Section title={`Internships (${internships.length})`}>
          {internships.length === 0 ? (
            <EmptyRow label="No internships added yet." />
          ) : (
            <ul className="divide-y divide-neutral-200">
              {internships.map((i) => {
                const it = i as Record<string, unknown>;
                return (
                  <li key={String(it.id)} className="py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900">
                          {String(it.role)} · {String(it.companyName)}
                        </p>
                        {it.duration ? (
                          <p className="text-xs text-neutral-500">
                            {String(it.duration)}
                          </p>
                        ) : null}
                      </div>
                      {(it as { isVerified?: boolean }).isVerified ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Pending
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* Achievements */}
        <Section title={`Achievements (${achievements.length})`}>
          {achievements.length === 0 ? (
            <EmptyRow label="No achievements added yet." />
          ) : (
            <ul className="divide-y divide-neutral-200">
              {achievements.map((a) => {
                const ac = a as Record<string, unknown>;
                return (
                  <li key={String(ac.id)} className="py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900">
                          {String(ac.title)}
                        </p>
                        {ac.category ? (
                          <p className="text-xs text-neutral-500">
                            {String(ac.category)}
                          </p>
                        ) : null}
                      </div>
                      {(ac as { isVerified?: boolean }).isVerified ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Pending
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* Certificates */}
        <Section title={`Certificates (${certificates?.length || 0})`}>
          {!certificates || certificates.length === 0 ? (
            <EmptyRow label="No certificates added yet." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {certificates.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                        <p className="truncate font-medium text-neutral-900">
                          {c.title}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-neutral-600">
                        {c.issuingOrg}
                      </p>
                    </div>
                    {c.isVerified ? (
                      <span className="flex-shrink-0 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="flex-shrink-0 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-neutral-500">
                    <div>
                      <span className="font-medium text-neutral-700">Issued:</span>{" "}
                      {c.issueDate ? new Date(c.issueDate).toLocaleDateString() : "—"}
                    </div>
                    {c.expiryDate && (
                      <div>
                        <span className="font-medium text-neutral-700">Expires:</span>{" "}
                        {new Date(c.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {c.certificateUrl && (
                    <div className="mt-3">
                      <a
                        href={c.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Document
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Internal notes */}
        <StudentNotesPanel
          studentId={user.id}
          fetchNotes={listStudentNotes}
          addNote={addStudentNote}
          deleteNote={deleteStudentNote}
        />
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:rounded-2xl sm:p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        <p className="truncate text-sm text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-neutral-900">
        {value !== null && value !== undefined ? `${value}${suffix ?? ""}` : "—"}
      </p>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-neutral-500">{label}</p>;
}
