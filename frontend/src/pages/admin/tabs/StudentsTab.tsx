import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/api";
import {
  listStudents,
  graduateStudent,
  setUserStatus,
  type StudentListItem,
  type StudentListFilters,
  type StudentListResponse,
} from "@/lib/adminApi";
import {
  exportStudentsToExcel,
  exportStudentsToPdf,
  summarizeFilters,
} from "@/lib/studentsExport";
import { FileSpreadsheet, FileText as FileTextIcon, Columns3 } from "lucide-react";
import {
  DEPARTMENT_LABELS,
  departmentLabel,
  type Department,
} from "@/lib/studentApi";
import { DEPARTMENTS, YEARS, FilterSelect } from "./shared";

type StudentColKey =
  | "email"
  | "studentId"
  | "department"
  | "year"
  | "cgpa"
  | "role"
  | "status";

const STUDENT_COLS: { key: StudentColKey; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "studentId", label: "ID" },
  { key: "department", label: "Department" },
  { key: "year", label: "Year" },
  { key: "cgpa", label: "CGPA" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
];

const DEFAULT_STUDENT_COLS: Record<StudentColKey, boolean> = {
  email: true,
  studentId: true,
  department: true,
  year: true,
  cgpa: true,
  role: true,
  status: true,
};

const STUDENT_COLS_STORAGE_KEY = "admin.students.visibleCols.v1";

export function StudentsTab() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pendingEntityParam = searchParams.get("pendingEntity");
  const pendingEntity =
    pendingEntityParam === "PROFILE_OR_MARKS" ||
    pendingEntityParam === "INTERNSHIP" ||
    pendingEntityParam === "ACHIEVEMENT"
      ? pendingEntityParam
      : undefined;
  const [data, setData] = useState<StudentListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<StudentListFilters>({
    page: 1,
    limit: 20,
    pendingEntity,
  });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  const [visibleCols, setVisibleCols] = useState<Record<StudentColKey, boolean>>(
    () => {
      try {
        const raw = localStorage.getItem(STUDENT_COLS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Record<StudentColKey, boolean>>;
          return { ...DEFAULT_STUDENT_COLS, ...parsed };
        }
      } catch {
        /* ignore */
      }
      return DEFAULT_STUDENT_COLS;
    }
  );
  const [colsOpen, setColsOpen] = useState(false);
  const colsBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_COLS_STORAGE_KEY, JSON.stringify(visibleCols));
    } catch {
      /* ignore */
    }
  }, [visibleCols]);

  useEffect(() => {
    if (!colsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (colsBtnRef.current && !colsBtnRef.current.contains(e.target as Node)) {
        setColsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [colsOpen]);

  const visibleColCount = useMemo(
    () => Object.values(visibleCols).filter(Boolean).length,
    [visibleCols]
  );

  const toggleCol = (key: StudentColKey) =>
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  const showAll = () =>
    setVisibleCols(
      STUDENT_COLS.reduce(
        (acc, c) => ({ ...acc, [c.key]: true }),
        {} as Record<StudentColKey, boolean>
      )
    );
  const resetCols = () => setVisibleCols(DEFAULT_STUDENT_COLS);

  const fetchAllMatching = async (): Promise<StudentListItem[]> => {
    const all: StudentListItem[] = [];
    const pageLimit = 100;
    let page = 1;
    while (true) {
      const res = await listStudents({ ...filters, page, limit: pageLimit });
      all.push(...res.items);
      if (all.length >= res.total || res.items.length === 0) break;
      page += 1;
      if (page > 1000) break;
    }
    return all;
  };

  const handleExport = async (kind: "xlsx" | "pdf") => {
    if (exporting) return;
    setExporting(kind);
    try {
      const rows = await fetchAllMatching();
      if (rows.length === 0) {
        toast.error("No students match these filters.");
        return;
      }
      const summary = summarizeFilters(filters as unknown as Record<string, unknown>);
      if (kind === "xlsx") {
        exportStudentsToExcel(rows, summary);
      } else {
        exportStudentsToPdf(rows, summary);
      }
      toast.success(`Exported ${rows.length} student(s) to ${kind.toUpperCase()}.`);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setExporting(null);
    }
  };

  const load = useCallback(async (f: StudentListFilters) => {
    setLoading(true);
    try {
      setData(await listStudents(f));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setFilters((prev) => {
      if (prev.pendingEntity === pendingEntity) return prev;
      return { ...prev, page: 1, pendingEntity };
    });
  }, [pendingEntity]);

  useEffect(() => {
    load(filters);
  }, [load, filters]);

  const updateFilter = <K extends keyof StudentListFilters>(
    key: K,
    value: StudentListFilters[K] | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearPendingFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("pendingEntity");
    setSearchParams(next, { replace: true });
  };

  const pendingFilterLabel =
    pendingEntity === "PROFILE_OR_MARKS"
      ? "Profile / Marks pending review"
      : pendingEntity === "INTERNSHIP"
        ? "Internships pending review"
        : pendingEntity === "ACHIEVEMENT"
          ? "Achievements pending review"
          : null;

  const handleGraduate = async (id: number) => {
    if (!window.confirm("Move this student to ALUMNI? They will receive an invite email."))
      return;
    setBusyId(id);
    try {
      await graduateStudent(id);
      toast.success("Student graduated to alumni");
      await load(filters);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (item: StudentListItem) => {
    const next = !item.isActive;
    if (
      !window.confirm(
        next ? "Activate this account?" : "Deactivate this account? User will lose access."
      )
    ) {
      return;
    }
    setBusyId(item.id);
    try {
      await setUserStatus(item.id, next);
      toast.success(`Account ${next ? "activated" : "deactivated"}`);
      await load(filters);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {pendingFilterLabel && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-medium text-neutral-900">{pendingFilterLabel}</p>
              <p className="text-xs text-muted-foreground">
                This list is filtered from the overview pending-review queue.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearPendingFilter}>
              Clear pending filter
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FilterSelect
              label="Department"
              value={filters.department ?? ""}
              options={DEPARTMENTS}
              getLabel={(o) => DEPARTMENT_LABELS[o as Department] ?? o}
              onChange={(v) =>
                updateFilter(
                  "department",
                  v ? (v as StudentListFilters["department"]) : undefined
                )
              }
            />
            <FilterSelect
              label="Academic Year"
              value={filters.academicYear ?? ""}
              options={YEARS}
              onChange={(v) =>
                updateFilter(
                  "academicYear",
                  v ? (v as StudentListFilters["academicYear"]) : undefined
                )
              }
            />
            <FilterSelect
              label="Role"
              value={filters.role ?? ""}
              options={["STUDENT", "ALUMNI"]}
              onChange={(v) =>
                updateFilter("role", v ? (v as StudentListFilters["role"]) : undefined)
              }
            />
            <div>
              <label className="text-xs text-muted-foreground">Min CGPA</label>
              <Input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={filters.minCgpa ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "minCgpa",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-muted-foreground">
                Search (name / email / ID)
              </label>
              <Input
                value={filters.search ?? ""}
                onChange={(e) => updateFilter("search", e.target.value || undefined)}
                placeholder="Type to search..."
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ page: 1, limit: 20, pendingEntity: filters.pendingEntity })
                }
                className="w-full"
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
            <p className="text-xs text-muted-foreground">
              {data?.total != null
                ? `${data.total} student${data.total === 1 ? "" : "s"} match these filters.`
                : "Apply filters above, then export the full matching set."}
            </p>
            <div className="flex gap-2">
              <div className="relative" ref={colsBtnRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setColsOpen((v) => !v)}
                  aria-expanded={colsOpen}
                >
                  <Columns3 className="h-4 w-4 mr-1.5" />
                  Columns
                  <span className="ml-1.5 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
                    {visibleColCount}/{STUDENT_COLS.length}
                  </span>
                </Button>
                {colsOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-neutral-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Columns
                      </p>
                      <div className="flex gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={showAll}
                          className="text-neutral-600 hover:text-neutral-900 hover:underline"
                        >
                          All
                        </button>
                        <span className="text-neutral-300">·</span>
                        <button
                          type="button"
                          onClick={resetCols}
                          className="text-neutral-600 hover:text-neutral-900 hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    <ul className="max-h-72 overflow-y-auto p-1">
                      {STUDENT_COLS.map((c) => (
                        <li key={c.key}>
                          <label className="flex cursor-pointer items-center gap-2.5 rounded px-2.5 py-2 text-sm hover:bg-neutral-50">
                            <input
                              type="checkbox"
                              checked={visibleCols[c.key]}
                              onChange={() => toggleCol(c.key)}
                              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                            />
                            <span className="text-neutral-800">{c.label}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                    <p className="border-t border-neutral-100 px-3 py-2 text-[11px] text-neutral-500">
                      Name and Actions are always shown.
                    </p>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("xlsx")}
                disabled={!!exporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                {exporting === "xlsx" ? "Exporting…" : "Export Excel"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("pdf")}
                disabled={!!exporting}
              >
                <FileTextIcon className="h-4 w-4 mr-1.5" />
                {exporting === "pdf" ? "Exporting…" : "Export PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-2">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : !data || data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No students match these filters.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      {visibleCols.email && <th className="py-2 pr-4">Email</th>}
                      {visibleCols.studentId && <th className="py-2 pr-4">ID</th>}
                      {visibleCols.department && <th className="py-2 pr-4">Dept</th>}
                      {visibleCols.year && <th className="py-2 pr-4">Year</th>}
                      {visibleCols.cgpa && <th className="py-2 pr-4">CGPA</th>}
                      {visibleCols.role && <th className="py-2 pr-4">Role</th>}
                      {visibleCols.status && <th className="py-2 pr-4">Status</th>}
                      <th className="py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((s) => (
                      <tr key={s.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4 font-medium">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/students/${s.id}`)}
                            className="text-left text-neutral-900 hover:text-neutral-600 hover:underline underline-offset-4"
                          >
                            {s.fullName}
                          </button>
                        </td>
                        {visibleCols.email && (
                          <td className="py-3 pr-4">{s.emailId}</td>
                        )}
                        {visibleCols.studentId && (
                          <td className="py-3 pr-4">{s.studentId ?? "—"}</td>
                        )}
                        {visibleCols.department && (
                          <td className="py-3 pr-4">
                            {departmentLabel(s.department) || "—"}
                          </td>
                        )}
                        {visibleCols.year && (
                          <td className="py-3 pr-4">{s.academicYear ?? "—"}</td>
                        )}
                        {visibleCols.cgpa && (
                          <td className="py-3 pr-4">
                            {s.avgCgpa?.toFixed(2) ?? "—"}
                          </td>
                        )}
                        {visibleCols.role && (
                          <td className="py-3 pr-4">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                s.role === "ALUMNI"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {s.role}
                            </span>
                          </td>
                        )}
                        {visibleCols.status && (
                          <td className="py-3 pr-4">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                s.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {s.isActive ? "Active" : "Inactive"}
                            </span>
                            {!s.isVerified && (
                              <span className="ml-1 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                                Unverified
                              </span>
                            )}
                          </td>
                        )}
                        <td className="py-3 pr-4 text-right space-x-2">
                          {s.role === "STUDENT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGraduate(s.id)}
                              disabled={busyId === s.id}
                            >
                              Graduate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(s)}
                            disabled={busyId === s.id}
                          >
                            {s.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-muted-foreground">
                  Page {data.page} of {data.totalPages} · {data.total} total
                </span>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.page <= 1}
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        page: Math.max(1, (f.page ?? 1) - 1),
                      }))
                    }
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.page >= data.totalPages}
                    onClick={() =>
                      setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
