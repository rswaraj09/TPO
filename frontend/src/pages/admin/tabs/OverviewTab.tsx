import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/api";
import {
  getStats,
  getPlacementReport,
  type AdminStats,
} from "@/lib/adminApi";
import {
  exportPlacementReportToExcel,
  exportPlacementReportToPdf,
} from "@/lib/placementReportExport";
import {
  FileSpreadsheet,
  FileText as FileTextIcon,
  Users as UsersIcon,
  GraduationCap,
  UserCog,
  UserPlus,
  ClipboardCheck,
  Briefcase,
  Award,
  ArrowRight,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { departmentLabel } from "@/lib/studentApi";
import type { AdminTab } from "@/components/shared/AdminSidebar";

export function OverviewTab({
  onNavigate,
}: {
  onNavigate: (
    tab: AdminTab,
    pendingEntity?: "PROFILE_OR_MARKS" | "INTERNSHIP" | "ACHIEVEMENT"
  ) => void;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportBusy, setReportBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setStats(await getStats());
      } catch (e) {
        toast.error(extractErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadPlacementReport = async (format: "pdf" | "excel") => {
    setReportBusy(true);
    try {
      const data = await getPlacementReport();
      if (data.items.length === 0) {
        toast.info("No placements recorded yet");
        return;
      }
      if (format === "pdf") {
        exportPlacementReportToPdf(data.items, data.generatedAt);
      } else {
        exportPlacementReportToExcel(data.items);
      }
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setReportBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg border border-neutral-200 bg-white animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-80 rounded-lg border border-neutral-200 bg-white animate-pulse lg:col-span-2" />
          <div className="h-80 rounded-lg border border-neutral-200 bg-white animate-pulse" />
        </div>
      </div>
    );
  }
  if (!stats) return <p className="text-sm text-muted-foreground">No stats available.</p>;

  type Metric = {
    label: string;
    value: number;
    icon: typeof UsersIcon;
    hint?: string;
  };

  type PendingCard = {
    label: string;
    value: number;
    icon: typeof UserPlus;
    target: AdminTab;
    pendingEntity?: "PROFILE_OR_MARKS" | "INTERNSHIP" | "ACHIEVEMENT";
  };
  const pendingCards: PendingCard[] = [
    {
      label: "Registrations",
      value: stats.pending.registrations,
      icon: UserPlus,
      target: "approvals",
    },
    {
      label: "Profile / Marks",
      value: stats.pending.profileOrMarksVerifications,
      icon: ClipboardCheck,
      target: "students",
      pendingEntity: "PROFILE_OR_MARKS",
    },
    {
      label: "Internships",
      value: stats.pending.internshipVerifications,
      icon: Briefcase,
      target: "students",
      pendingEntity: "INTERNSHIP",
    },
    {
      label: "Achievements",
      value: stats.pending.achievementVerifications,
      icon: Award,
      target: "students",
      pendingEntity: "ACHIEVEMENT",
    },
  ];

  const totalPending = pendingCards.reduce((sum, c) => sum + c.value, 0);

  const metrics: Metric[] = [
    { label: "Students", value: stats.totals.students, icon: UsersIcon, hint: "Active" },
    { label: "Alumni", value: stats.totals.alumni, icon: GraduationCap, hint: "Graduated" },
    { label: "Faculty", value: stats.totals.faculty, icon: UserCog, hint: "On staff" },
    {
      label: "Pending review",
      value: totalPending,
      icon: Inbox,
      hint: totalPending === 0 ? "All clear" : "Needs action",
    },
  ];

  const maxDept =
    stats.studentsByDepartment.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  const totalDeptStudents = stats.studentsByDepartment.reduce(
    (s, r) => s + r.count,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">
            Placement report
          </p>
          <p className="text-xs text-neutral-500">
            All selected applications across every drive.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadPlacementReport("excel")}
            disabled={reportBusy}
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadPlacementReport("pdf")}
            disabled={reportBusy}
          >
            <FileTextIcon className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* ===== Metric tiles ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          const isPending = m.label === "Pending review";
          const showDot = isPending && m.value > 0;
          const clickable = isPending && m.value > 0;
          const content = (
            <>
              <div className="flex items-center justify-between text-neutral-600">
                <p className="text-sm font-medium">{m.label}</p>
                <Icon className="h-4 w-4 text-neutral-400" strokeWidth={2} />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-neutral-900">
                {m.value.toLocaleString()}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
                {showDot && (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                )}
                <span>{m.hint}</span>
              </div>
            </>
          );
          return clickable ? (
            <button
              key={m.label}
              type="button"
              onClick={() => onNavigate("approvals")}
              className="rounded-lg border border-neutral-200 bg-white p-5 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              {content}
            </button>
          ) : (
            <div
              key={m.label}
              className="rounded-lg border border-neutral-200 bg-white p-5"
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* ===== Two-column: Pending queue + Department bars ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending queue */}
        <div className="rounded-lg border border-neutral-200 bg-white lg:col-span-2">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Pending review
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                {totalPending === 0
                  ? "Nothing waiting — you're all caught up."
                  : `${totalPending} item${totalPending === 1 ? "" : "s"} need your attention.`}
              </p>
            </div>
            {totalPending > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Needs action
              </span>
            )}
          </div>

          {totalPending === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
              </div>
              <p className="mt-3 text-sm font-medium text-neutral-900">
                All clear
              </p>
              <p className="mt-1 max-w-xs text-sm text-neutral-500">
                No registrations or verifications are waiting. New submissions
                will show up here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {pendingCards
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((c) => {
                  const Icon = c.icon;
                  const isUrgent = c.value > 0;
                  return (
                    <li key={c.label}>
                      <button
                        type="button"
                        onClick={() => onNavigate(c.target, c.pendingEntity)}
                        disabled={!isUrgent}
                        className={`group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                          isUrgent
                            ? "hover:bg-neutral-50"
                            : "cursor-default"
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-900">
                            {c.label}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {isUrgent ? "Waiting for review" : "Up to date"}
                          </p>
                        </div>
                        <span
                          className={`tabular-nums text-sm font-semibold ${
                            isUrgent ? "text-neutral-900" : "text-neutral-400"
                          }`}
                        >
                          {c.value}
                        </span>
                        <ArrowRight
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isUrgent
                              ? "text-neutral-300 group-hover:text-neutral-700"
                              : "text-transparent"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        {/* Department distribution */}
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h2 className="text-base font-semibold text-neutral-900">
              Students by department
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              {totalDeptStudents.toLocaleString()} students ·{" "}
              {stats.studentsByDepartment.length} department
              {stats.studentsByDepartment.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="px-5 py-4">
            {stats.studentsByDepartment.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                No department data.
              </p>
            ) : (
              <ul className="space-y-3.5">
                {stats.studentsByDepartment
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((row) => {
                    const label = row.department
                      ? departmentLabel(row.department)
                      : "Unknown";
                    const pct = totalDeptStudents
                      ? Math.round((row.count / totalDeptStudents) * 100)
                      : 0;
                    const widthPct = Math.max(
                      3,
                      Math.round((row.count / maxDept) * 100)
                    );
                    return (
                      <li key={row.department ?? "unknown"}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium text-neutral-800">
                            {label}
                          </span>
                          <span className="shrink-0 tabular-nums text-xs text-neutral-500">
                            <span className="font-semibold text-neutral-900">
                              {row.count}
                            </span>
                            <span className="ml-1.5">· {pct}%</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-neutral-900"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
