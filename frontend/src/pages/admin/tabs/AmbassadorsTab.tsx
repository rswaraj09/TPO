import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { extractErrorMessage } from "@/lib/api";
import {
  listAmbassadors,
  createAmbassadorAssignment,
  deleteAmbassadorAssignment,
  listStudents,
  AMBASSADOR_ROLE_OPTIONS,
  type AmbassadorAssignment,
  type AmbassadorRole,
  type StudentListItem,
} from "@/lib/adminApi";
import { ShieldCheck, Plus, Search, Trash2 } from "lucide-react";
import { departmentLabel } from "@/lib/studentApi";
import { YEAR_LABELS } from "./shared";

export function AmbassadorsTab() {
  const [assignments, setAssignments] = useState<AmbassadorAssignment[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [roleName, setRoleName] = useState<AmbassadorRole>("TPO Head");
  const [servedAcademicYear, setServedAcademicYear] = useState<string>(() => {
    const y = new Date().getFullYear();
    return `${y}-${String(y + 1).slice(-2)}`;
  });
  const [yearFilter, setYearFilter] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentData, studentData, alumniData] = await Promise.all([
        listAmbassadors(),
        listStudents({ page: 1, limit: 100, role: "STUDENT" }),
        listStudents({ page: 1, limit: 100, role: "ALUMNI" }),
      ]);
      setAssignments(assignmentData);
      setStudents([...studentData.items, ...alumniData.items]);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredStudents = students.filter((student) => {
    const haystack =
      `${student.fullName} ${student.emailId} ${student.studentId ?? ""}`.toLowerCase();
    return haystack.includes(studentSearch.toLowerCase());
  });

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    try {
      await deleteAmbassadorAssignment(id);
      toast.success("Assignment removed");
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const servedYearOptions = (() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => {
      const start = currentYear - 3 + i;
      return `${start}-${String(start + 1).slice(-2)}`;
    });
  })();

  const filteredAssignments = yearFilter
    ? assignments.filter((a) => a.servedAcademicYear === yearFilter)
    : assignments;

  const grouped = filteredAssignments.reduce<Record<string, AmbassadorAssignment[]>>(
    (acc, item) => {
      const key = item.roleName;
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    },
    {}
  );

  const filledRoles = AMBASSADOR_ROLE_OPTIONS.filter(
    (role) => (grouped[role] ?? []).length > 0
  ).length;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Student Ambassador Control
            </div>
            <h2 className="mt-3 text-xl font-semibold text-neutral-900">
              TPO volunteer list
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Manage leadership and support-team assignments, and keep each
              student&apos;s served academic year visible for the admin team.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Filter by served year</label>
              <select
                className="h-9 w-40 rounded-md border bg-background px-3 text-sm"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All years</option>
                {servedYearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => setShowAdd((v) => !v)}>
              <Plus className="mr-1.5 h-4 w-4" />
              {showAdd ? "Close Panel" : "Add Student Ambassador"}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Active Assignments
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {filteredAssignments.length}
              {yearFilter ? ` / ${assignments.length}` : ""}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Roles Filled
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {filledRoles}/{AMBASSADOR_ROLE_OPTIONS.length}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Student Pool
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">{students.length}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Team Coverage
            </p>
            <p className="mt-2 text-sm font-medium text-neutral-800">
              {filledRoles === AMBASSADOR_ROLE_OPTIONS.length
                ? "Every team has at least one assignment"
                : `${AMBASSADOR_ROLE_OPTIONS.length - filledRoles} teams still need volunteers`}
            </p>
          </div>
        </div>
      </section>

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add volunteer assignment</CardTitle>
            <CardDescription>
              Select the student, confirm the role, and capture the year they served.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel>Role</FieldLabel>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value as AmbassadorRole)}
                >
                  {AMBASSADOR_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel>Served academic year</FieldLabel>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={servedAcademicYear}
                  onChange={(e) => setServedAcademicYear(e.target.value)}
                >
                  {servedYearOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel>Search students</FieldLabel>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Name, email, or ID"
                    className="pl-9"
                  />
                </div>
              </Field>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border border-neutral-200">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-sm text-neutral-500">No students found.</div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {filteredStudents.map((student) => (
                    <li key={student.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(student.id)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                          selectedStudentId === student.id
                            ? "bg-neutral-900 text-white"
                            : "hover:bg-neutral-50"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">{student.fullName}</p>
                          <p
                            className={`text-xs ${
                              selectedStudentId === student.id
                                ? "text-neutral-300"
                                : "text-neutral-500"
                            }`}
                          >
                            {student.emailId}{" "}
                            {student.studentId ? `· ${student.studentId}` : ""}
                          </p>
                        </div>
                        <span
                          className={`text-xs ${
                            selectedStudentId === student.id
                              ? "text-neutral-300"
                              : "text-neutral-500"
                          }`}
                        >
                          {student.academicYear ? YEAR_LABELS[student.academicYear] : "Alumni"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAdd(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedStudentId) {
                    toast.error("Choose a student first");
                    return;
                  }
                  setSaving(true);
                  try {
                    await createAmbassadorAssignment({
                      studentId: selectedStudentId,
                      roleName,
                      servedAcademicYear,
                    });
                    toast.success("Volunteer assignment added");
                    setShowAdd(false);
                    setSelectedStudentId(null);
                    setStudentSearch("");
                    await load();
                  } catch (e) {
                    toast.error(extractErrorMessage(e));
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? "Adding..." : "Add Assignment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-muted-foreground">
          Loading volunteer roster...
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 text-sm font-medium text-neutral-900">
              No volunteer assignments yet
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Add students to TPO head, media, drive, LinkedIn, coding club, and other teams
              here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {AMBASSADOR_ROLE_OPTIONS.map((role) => {
            const roleItems = grouped[role] ?? [];
            return (
              <Card key={role} className="overflow-hidden">
                <CardHeader className="border-b border-neutral-100 bg-neutral-50/80">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{role}</CardTitle>
                      <CardDescription>
                        {roleItems.length} assignment{roleItems.length === 1 ? "" : "s"}
                      </CardDescription>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        roleItems.length > 0
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {roleItems.length > 0 ? "Covered" : "Open"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {roleItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-sm text-neutral-500">
                      No students assigned.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {roleItems.map((assignment) => (
                        <li
                          key={assignment.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-900">
                              {assignment.student.fullName}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                              <span>
                                {assignment.student.studentId ?? assignment.student.emailId}
                              </span>
                              <span>
                                {departmentLabel(assignment.student.department) ||
                                  "No department"}
                              </span>
                            </div>
                            <p className="mt-2 text-xs font-medium text-neutral-700">
                              Served in {assignment.servedAcademicYear}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemove(assignment.id)}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
