import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { extractErrorMessage } from "@/lib/api";
import {
  adminListJobs,
  adminCreateJob,
  adminUpdateJob,
  adminSetJobStatus,
  adminDeleteJob,
  adminListApplications,
  adminUpdateApplicationStatus,
  type Job,
  type JobStatus,
  type JobType,
  type LocationType,
  type ApplicationStatus,
  type JobApplication,
  type CreateJobPayload,
} from "@/lib/jobsApi";
import {
  exportApplicantsToExcel,
  exportApplicantsToPdf,
} from "@/lib/applicantsExport";
import { FileSpreadsheet, FileText as FileTextIcon } from "lucide-react";
import { DEPARTMENT_LABELS, departmentLabel, type Department } from "@/lib/studentApi";
import { DEPARTMENTS, YEARS, Badge } from "./shared";

const JOB_TYPES: JobType[] = ["FULL_TIME", "INTERNSHIP", "PPO"];
const APP_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
];

const emptyJobForm = {
  companyName: "",
  jobTitle: "",
  description: "",
  package: "",
  location: "",
  locationType: "ON_SITE" as LocationType,
  jobType: "FULL_TIME" as JobType,
  eligibleDepartments: [] as string[],
  eligibleYears: [] as string[],
  minCgpa: "",
  deadline: "",
  rounds: "",
};

function jobToForm(job: Job): typeof emptyJobForm {
  const deadlineLocal = (() => {
    const d = new Date(job.deadline);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  })();
  return {
    companyName: job.companyName,
    jobTitle: job.jobTitle,
    description: job.description,
    package: job.package,
    location: job.location,
    locationType: job.locationType,
    jobType: job.jobType,
    eligibleDepartments: [...job.eligibleDepartments] as string[],
    eligibleYears: [...job.eligibleYears] as string[],
    minCgpa: job.minCgpa != null ? String(job.minCgpa) : "",
    deadline: deadlineLocal,
    rounds: job.rounds.join(", "),
  };
}

function JobFormDialog({
  job,
  onClose,
  onSaved,
}: {
  job?: Job;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!job;
  const [form, setForm] = useState(() => (job ? jobToForm(job) : emptyJobForm));
  const [saving, setSaving] = useState(false);

  const toggleArr = (key: "eligibleDepartments" | "eligibleYears", val: string) => {
    setForm((s) => {
      const arr = s[key];
      return {
        ...s,
        [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  };

  const handleSubmit = async () => {
    if (
      !form.companyName ||
      !form.jobTitle ||
      !form.description ||
      !form.package ||
      !form.location ||
      !form.deadline ||
      form.eligibleDepartments.length === 0 ||
      form.eligibleYears.length === 0
    ) {
      toast.error("Fill required fields and select eligibility");
      return;
    }
    setSaving(true);
    try {
      const payload: CreateJobPayload = {
        companyName: form.companyName,
        jobTitle: form.jobTitle,
        description: form.description,
        package: form.package,
        location: form.location,
        locationType: form.locationType,
        jobType: form.jobType,
        eligibleDepartments: form.eligibleDepartments as CreateJobPayload["eligibleDepartments"],
        eligibleYears: form.eligibleYears as CreateJobPayload["eligibleYears"],
        deadline: new Date(form.deadline).toISOString(),
        ...(form.minCgpa ? { minCgpa: Number(form.minCgpa) } : {}),
        ...(form.rounds
          ? {
              rounds: form.rounds
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            }
          : {}),
      };
      if (isEdit && job) {
        await adminUpdateJob(job.id, payload);
        toast.success("Job updated");
      } else {
        const { eligibleCount } = await adminCreateJob(payload);
        toast.success(`Job posted. ${eligibleCount} eligible students notified.`);
      }
      onSaved();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isEdit ? "Edit Job" : "Post a New Job"}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <FieldGroup className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Company Name *</FieldLabel>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Job Title *</FieldLabel>
              <Input
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel>Description *</FieldLabel>
            <textarea
              className="w-full min-h-[90px] rounded-md border bg-background px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field>
              <FieldLabel>Package *</FieldLabel>
              <Input
                placeholder="e.g. 8 LPA"
                value={form.package}
                onChange={(e) => setForm({ ...form, package: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Location *</FieldLabel>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Job Type</FieldLabel>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.jobType}
                onChange={(e) =>
                  setForm({ ...form, jobType: e.target.value as JobType })
                }
              >
                {JOB_TYPES.map((j) => (
                  <option key={j}>{j}</option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel>Min CGPA</FieldLabel>
              <Input
                type="number"
                step="0.01"
                value={form.minCgpa}
                onChange={(e) => setForm({ ...form, minCgpa: e.target.value })}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel>Eligible Departments *</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((d) => {
                const active = form.eligibleDepartments.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleArr("eligibleDepartments", d)}
                    className={`text-xs px-3 py-1 rounded-full border ${
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    {DEPARTMENT_LABELS[d as Department] ?? d}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field>
            <FieldLabel>Eligible Years *</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {YEARS.map((y) => {
                const active = form.eligibleYears.includes(y);
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => toggleArr("eligibleYears", y)}
                    className={`text-xs px-3 py-1 rounded-full border ${
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    {y.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Deadline *</FieldLabel>
              <Input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Rounds (comma-separated)</FieldLabel>
              <Input
                placeholder="Aptitude, Technical, HR"
                value={form.rounds}
                onChange={(e) => setForm({ ...form, rounds: e.target.value })}
              />
            </Field>
          </div>
        </FieldGroup>
        <div className="flex gap-2 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? isEdit
                ? "Saving…"
                : "Posting…"
              : isEdit
              ? "Save changes"
              : "Post Job"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function JobApplicantsView({
  job,
  onBack,
}: {
  job: Job;
  onBack: () => void;
}) {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | "">("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setApps(await adminListApplications(job.id, filter || undefined));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [job.id, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    try {
      await adminUpdateApplicationStatus(id, status);
      toast.success(`Updated to ${status}`);
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <div>
          <Button size="sm" variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <h2 className="text-lg font-semibold mt-2">
            {job.companyName} · {job.jobTitle}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={apps.length === 0}
            onClick={() => exportApplicantsToExcel(job, apps, filter)}
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={apps.length === 0}
            onClick={() => exportApplicantsToPdf(job, apps, filter)}
          >
            <FileTextIcon className="h-4 w-4" /> PDF
          </Button>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as ApplicationStatus | "")}
          >
            <option value="">All statuses</option>
            {APP_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No applications {filter ? `with status ${filter}` : "yet"}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {apps.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {a.student.profilePic ? (
                    <img
                      src={a.student.profilePic}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                      {a.student.fullName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{a.student.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.student.emailId} · {a.student.studentId} ·{" "}
                      {departmentLabel(a.student.department)} · CGPA:{" "}
                      {a.student.avgCgpa?.toFixed(2) ?? "N/A"}
                    </div>
                    <div className="flex gap-2 mt-1">
                      {a.student.resumeUrl && (
                        <a
                          className="text-xs text-blue-600 underline"
                          href={a.student.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Resume
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      a.status === "SELECTED"
                        ? "green"
                        : a.status === "REJECTED"
                        ? "red"
                        : "yellow"
                    }
                  >
                    {a.status}
                  </Badge>
                  <select
                    className="h-8 rounded border text-xs px-2"
                    value={a.status}
                    onChange={(e) =>
                      updateStatus(a.id, e.target.value as ApplicationStatus)
                    }
                  >
                    {APP_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selected, setSelected] = useState<Job | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { items } = await adminListJobs({ limit: 100 });
      setJobs(items);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleStatus = async (job: Job) => {
    try {
      const next: JobStatus = job.status === "OPEN" ? "CLOSED" : "OPEN";
      await adminSetJobStatus(job.id, next);
      toast.success(`Job ${next.toLowerCase()}`);
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const handleDelete = async (job: Job) => {
    if (!confirm(`Delete "${job.jobTitle}" at ${job.companyName}? This cannot be undone.`))
      return;
    try {
      await adminDeleteJob(job.id);
      toast.success("Job deleted");
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  if (selected) {
    return (
      <JobApplicantsView
        job={selected}
        onBack={() => {
          setSelected(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Jobs</h2>
        <Button onClick={() => setShowCreate(true)}>Post a Job</Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No jobs yet. Post the first one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {jobs.map((j) => (
            <Card key={j.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-sm font-semibold">
                    {j.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{j.jobTitle}</div>
                    <div className="text-sm text-muted-foreground">
                      {j.companyName} · {j.location} · {j.package}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Deadline: {new Date(j.deadline).toLocaleDateString()} ·{" "}
                      {j._count?.applications ?? 0} applicants
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Badge>{j.jobType}</Badge>
                      <Badge>{j.locationType}</Badge>
                      <Badge variant={j.status === "OPEN" ? "green" : "gray"}>
                        {j.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(j)}>
                    Applicants
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingJob(j)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(j)}
                  >
                    {j.status === "OPEN" ? "Close" : "Reopen"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                    onClick={() => handleDelete(j)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <JobFormDialog
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {editingJob && (
        <JobFormDialog
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSaved={() => {
            setEditingJob(null);
            load();
          }}
        />
      )}
    </div>
  );
}
