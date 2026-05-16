import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/api";
import {
  listPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  listAdminPendingVerifications,
  adminReviewVerificationRequest,
  adminReviewInternship,
  adminReviewAchievement,
  adminReviewCertificate,
  type PendingRegistration,
  type AdminQueueItem,
  type AdminVerificationRequestItem,
  type AdminInternshipQueueItem,
  type AdminAchievementQueueItem,
  type AdminCertificateQueueItem,
} from "@/lib/adminApi";
import {
  UserPlus,
  ClipboardCheck,
  Briefcase,
  Award,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  ExternalLink,
} from "lucide-react";
import { departmentLabel, type AcademicYear } from "@/lib/studentApi";
import { YEAR_LABELS } from "./shared";

type ApprovalSubTab =
  | "registrations"
  | "profile"
  | "internship"
  | "achievement"
  | "certificate";

export function ApprovalsTab() {
  const [subTab, setSubTab] = useState<ApprovalSubTab>("registrations");

  // Registration state
  const [regItems, setRegItems] = useState<PendingRegistration[]>([]);
  const [regLoading, setRegLoading] = useState(true);
  const [regBusyId, setRegBusyId] = useState<number | null>(null);

  // Verification queue state
  const [queueItems, setQueueItems] = useState<AdminQueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueBusyId, setQueueBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refreshRegistrations = useCallback(async () => {
    setRegLoading(true);
    try {
      setRegItems(await listPendingRegistrations());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setRegLoading(false);
    }
  }, []);

  const refreshQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      setQueueItems(await listAdminPendingVerifications());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRegistrations();
    refreshQueue();
  }, [refreshRegistrations, refreshQueue]);

  const handleApproveReg = async (id: number) => {
    setRegBusyId(id);
    try {
      await approveRegistration(id);
      toast.success("Account approved");
      await refreshRegistrations();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setRegBusyId(null);
    }
  };

  const handleRejectReg = async (id: number) => {
    const reason = window.prompt("Reason for rejection (optional):") ?? undefined;
    setRegBusyId(id);
    try {
      await rejectRegistration(id, reason || undefined);
      toast.success("Account rejected");
      await refreshRegistrations();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setRegBusyId(null);
    }
  };

  const handleApproveQueue = async (item: AdminQueueItem) => {
    setQueueBusyId(item.id);
    try {
      if (item.kind === "VERIFICATION_REQUEST") {
        await adminReviewVerificationRequest(item.id, { status: "APPROVED" });
      } else if (item.kind === "INTERNSHIP") {
        await adminReviewInternship(item.id, { isVerified: true });
      } else if (item.kind === "ACHIEVEMENT") {
        await adminReviewAchievement(item.id, { isVerified: true });
      } else {
        await adminReviewCertificate(item.id, { isVerified: true });
      }
      toast.success("Approved");
      await refreshQueue();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setQueueBusyId(null);
    }
  };

  const handleRejectQueue = async (item: AdminQueueItem) => {
    const remarks = window.prompt("Reason for rejection (optional):") ?? undefined;
    setQueueBusyId(item.id);
    try {
      if (item.kind === "VERIFICATION_REQUEST") {
        await adminReviewVerificationRequest(item.id, {
          status: "REJECTED",
          remarks: remarks || undefined,
        });
      } else if (item.kind === "INTERNSHIP") {
        await adminReviewInternship(item.id, {
          isVerified: false,
          remarks: remarks || undefined,
        });
      } else if (item.kind === "ACHIEVEMENT") {
        await adminReviewAchievement(item.id, {
          isVerified: false,
          remarks: remarks || undefined,
        });
      } else {
        await adminReviewCertificate(item.id, {
          isVerified: false,
          remarks: remarks || undefined,
        });
      }
      toast.success("Rejected");
      await refreshQueue();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setQueueBusyId(null);
    }
  };

  const profileItems = queueItems.filter(
    (i) => i.kind === "VERIFICATION_REQUEST"
  ) as AdminVerificationRequestItem[];
  const internshipItems = queueItems.filter(
    (i) => i.kind === "INTERNSHIP"
  ) as AdminInternshipQueueItem[];
  const achievementItems = queueItems.filter(
    (i) => i.kind === "ACHIEVEMENT"
  ) as AdminAchievementQueueItem[];
  const certificateItems = queueItems.filter(
    (i) => i.kind === "CERTIFICATE"
  ) as AdminCertificateQueueItem[];

  const subTabs: { key: ApprovalSubTab; label: string; count: number }[] = [
    { key: "registrations", label: "Registrations", count: regItems.length },
    { key: "profile", label: "Profile / Marks", count: profileItems.length },
    { key: "internship", label: "Internships", count: internshipItems.length },
    { key: "achievement", label: "Achievements", count: achievementItems.length },
    { key: "certificate", label: "Certificates", count: certificateItems.length },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map((st) => (
          <button
            key={st.key}
            onClick={() => setSubTab(st.key)}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              subTab === st.key
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {st.label}
            {st.count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  subTab === st.key
                    ? "bg-white text-neutral-900"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {st.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {subTab === "registrations" && (
        <RegistrationsSection
          items={regItems}
          loading={regLoading}
          busyId={regBusyId}
          onApprove={handleApproveReg}
          onReject={handleRejectReg}
        />
      )}

      {subTab === "profile" && (
        <VerificationRequestSection
          items={profileItems}
          loading={queueLoading}
          busyId={queueBusyId}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          onApprove={handleApproveQueue}
          onReject={handleRejectQueue}
        />
      )}

      {subTab === "internship" && (
        <InternshipSection
          items={internshipItems}
          loading={queueLoading}
          busyId={queueBusyId}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          onApprove={handleApproveQueue}
          onReject={handleRejectQueue}
        />
      )}

      {subTab === "achievement" && (
        <AchievementSection
          items={achievementItems}
          loading={queueLoading}
          busyId={queueBusyId}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          onApprove={handleApproveQueue}
          onReject={handleRejectQueue}
        />
      )}

      {subTab === "certificate" && (
        <CertificateSection
          items={certificateItems}
          loading={queueLoading}
          busyId={queueBusyId}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          onApprove={handleApproveQueue}
          onReject={handleRejectQueue}
        />
      )}
    </div>
  );
}

// ---- Registrations Section ----
function RegistrationsSection({
  items,
  loading,
  busyId,
  onApprove,
  onReject,
}: {
  items: PendingRegistration[];
  loading: boolean;
  busyId: number | null;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  if (loading) return <QueueSkeleton />;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
        <UserPlus className="h-4 w-4 text-neutral-500" />
        <h2 className="text-base font-semibold text-neutral-900">
          Registration queue
        </h2>
        {items.length > 0 && <PendingBadge count={items.length} />}
        <p className="ml-auto text-sm text-neutral-500">
          New student sign-ups awaiting activation
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyQueue
          message="No pending registrations"
          sub="New student signups appear here for your review."
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((r) => {
            const initials = (r.fullName ?? "ST")
              .split(" ")
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const submittedRel = new Date(r.createdAt).toLocaleDateString(
              undefined,
              { day: "numeric", month: "short", year: "numeric" }
            );
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-start gap-4 px-5 py-4 hover:bg-neutral-50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {r.fullName}
                    </p>
                    <span className="text-xs text-neutral-400">·</span>
                    <a
                      href={`mailto:${r.emailId}`}
                      className="truncate text-sm text-neutral-600 hover:underline"
                    >
                      {r.emailId}
                    </a>
                  </div>
                  <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500">
                    <MetaCell label="ID" value={r.studentId ?? "—"} />
                    <MetaCell
                      label="Dept"
                      value={departmentLabel(r.department) || "—"}
                    />
                    <MetaCell
                      label="Year"
                      value={
                        YEAR_LABELS[r.academicYear as AcademicYear] ??
                        r.academicYear ??
                        "—"
                      }
                    />
                    <MetaCell label="Contact" value={r.contactNo ?? "—"} />
                    <MetaCell label="Submitted" value={submittedRel} />
                  </dl>
                </div>
                <ApproveRejectButtons
                  busy={busyId === r.id}
                  onApprove={() => onApprove(r.id)}
                  onReject={() => onReject(r.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- Profile / Marks Section ----
function VerificationRequestSection({
  items,
  loading,
  busyId,
  expandedId,
  onToggle,
  onApprove,
  onReject,
}: {
  items: AdminVerificationRequestItem[];
  loading: boolean;
  busyId: string | null;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onApprove: (item: AdminQueueItem) => void;
  onReject: (item: AdminQueueItem) => void;
}) {
  if (loading) return <QueueSkeleton />;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
        <ClipboardCheck className="h-4 w-4 text-neutral-500" />
        <h2 className="text-base font-semibold text-neutral-900">
          Profile &amp; Marks verifications
        </h2>
        {items.length > 0 && <PendingBadge count={items.length} />}
      </div>
      {items.length === 0 ? (
        <EmptyQueue
          message="No pending profile/marks updates"
          sub="Student profile and marks change requests appear here."
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <li key={item.id} className="px-5 py-4 hover:bg-neutral-50">
                <div className="flex flex-wrap items-center gap-4">
                  <StudentStub student={item.student} />
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                      {item.entityType}
                    </span>
                    <span className="ml-2 text-xs text-neutral-500">
                      {Object.keys(item.changes).length} field
                      {Object.keys(item.changes).length !== 1 ? "s" : ""} changed
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggle(item.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {isExpanded ? "Hide" : "View"} changes
                    </button>
                    <ApproveRejectButtons
                      busy={busyId === item.id}
                      onApprove={() => onApprove(item)}
                      onReject={() => onReject(item)}
                    />
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 rounded-md border border-neutral-100 bg-neutral-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Requested changes
                    </p>
                    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {Object.entries(item.changes).map(([field, diff]) => (
                        <div
                          key={field}
                          className="rounded-md bg-white p-2 ring-1 ring-neutral-200"
                        >
                          <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                            {field}
                          </dt>
                          <dd className="mt-1 flex items-center gap-2 text-xs">
                            <span className="line-through text-red-500">
                              {String(diff.oldValue ?? "—")}
                            </span>
                            <ArrowRight className="h-3 w-3 text-neutral-400 flex-shrink-0" />
                            <span className="font-medium text-emerald-700">
                              {String(diff.newValue ?? "—")}
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- Internship Section ----
function InternshipSection({
  items,
  loading,
  busyId,
  expandedId,
  onToggle,
  onApprove,
  onReject,
}: {
  items: AdminInternshipQueueItem[];
  loading: boolean;
  busyId: string | null;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onApprove: (item: AdminQueueItem) => void;
  onReject: (item: AdminQueueItem) => void;
}) {
  if (loading) return <QueueSkeleton />;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
        <Briefcase className="h-4 w-4 text-neutral-500" />
        <h2 className="text-base font-semibold text-neutral-900">
          Internship verifications
        </h2>
        {items.length > 0 && <PendingBadge count={items.length} />}
      </div>
      {items.length === 0 ? (
        <EmptyQueue
          message="No pending internships"
          sub="Student internship submissions appear here for verification."
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const d = item.data;
            return (
              <li key={item.id} className="px-5 py-4 hover:bg-neutral-50">
                <div className="flex flex-wrap items-center gap-4">
                  <StudentStub student={item.student} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900">
                      {d.companyName}
                    </p>
                    <p className="text-xs text-neutral-500">{d.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggle(item.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {isExpanded ? "Hide" : "View"} details
                    </button>
                    <ApproveRejectButtons
                      busy={busyId === item.id}
                      onApprove={() => onApprove(item)}
                      onReject={() => onReject(item)}
                    />
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 rounded-md border border-neutral-100 bg-neutral-50 p-3 space-y-2">
                    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <InfoCell label="Company" value={d.companyName} />
                      <InfoCell label="Role" value={d.role} />
                      {d.duration && <InfoCell label="Duration" value={d.duration} />}
                      {d.startDate && (
                        <InfoCell
                          label="Start"
                          value={new Date(d.startDate).toLocaleDateString()}
                        />
                      )}
                      {d.endDate && (
                        <InfoCell
                          label="End"
                          value={new Date(d.endDate).toLocaleDateString()}
                        />
                      )}
                      {d.hrName && <InfoCell label="HR Name" value={d.hrName} />}
                      {d.hrEmail && <InfoCell label="HR Email" value={d.hrEmail} />}
                      {d.hrPhone && <InfoCell label="HR Phone" value={d.hrPhone} />}
                    </dl>
                    {d.roleDescription && (
                      <div className="rounded-md bg-white p-2 ring-1 ring-neutral-200">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                          Description
                        </p>
                        <p className="mt-1 text-xs text-neutral-700">
                          {d.roleDescription}
                        </p>
                      </div>
                    )}
                    {d.certificateUrl && (
                      <a
                        href={d.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-blue-600 ring-1 ring-neutral-200 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Certificate
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- Achievement Section ----
function AchievementSection({
  items,
  loading,
  busyId,
  expandedId,
  onToggle,
  onApprove,
  onReject,
}: {
  items: AdminAchievementQueueItem[];
  loading: boolean;
  busyId: string | null;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onApprove: (item: AdminQueueItem) => void;
  onReject: (item: AdminQueueItem) => void;
}) {
  if (loading) return <QueueSkeleton />;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
        <Award className="h-4 w-4 text-neutral-500" />
        <h2 className="text-base font-semibold text-neutral-900">
          Achievement verifications
        </h2>
        {items.length > 0 && <PendingBadge count={items.length} />}
      </div>
      {items.length === 0 ? (
        <EmptyQueue
          message="No pending achievements"
          sub="Student achievement submissions appear here for verification."
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const d = item.data;
            return (
              <li key={item.id} className="px-5 py-4 hover:bg-neutral-50">
                <div className="flex flex-wrap items-center gap-4">
                  <StudentStub student={item.student} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900">
                      {d.title}
                    </p>
                    {d.category && (
                      <p className="text-xs text-neutral-500 capitalize">
                        {d.category}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggle(item.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {isExpanded ? "Hide" : "View"} details
                    </button>
                    <ApproveRejectButtons
                      busy={busyId === item.id}
                      onApprove={() => onApprove(item)}
                      onReject={() => onReject(item)}
                    />
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 rounded-md border border-neutral-100 bg-neutral-50 p-3 space-y-2">
                    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <InfoCell label="Title" value={d.title} />
                      {d.category && (
                        <InfoCell label="Category" value={d.category} />
                      )}
                      {d.achievementDate && (
                        <InfoCell
                          label="Date"
                          value={new Date(d.achievementDate).toLocaleDateString()}
                        />
                      )}
                    </dl>
                    {d.description && (
                      <div className="rounded-md bg-white p-2 ring-1 ring-neutral-200">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                          Description
                        </p>
                        <p className="mt-1 text-xs text-neutral-700">
                          {d.description}
                        </p>
                      </div>
                    )}
                    {d.certificateUrl && (
                      <a
                        href={d.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-blue-600 ring-1 ring-neutral-200 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Certificate
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- Certificate Section ----
function CertificateSection({
  items,
  loading,
  busyId,
  expandedId,
  onToggle,
  onApprove,
  onReject,
}: {
  items: AdminCertificateQueueItem[];
  loading: boolean;
  busyId: string | null;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onApprove: (item: AdminQueueItem) => void;
  onReject: (item: AdminQueueItem) => void;
}) {
  if (loading) return <QueueSkeleton />;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
        <ShieldCheck className="h-4 w-4 text-neutral-500" />
        <h2 className="text-base font-semibold text-neutral-900">
          Certificate verifications
        </h2>
        {items.length > 0 && <PendingBadge count={items.length} />}
      </div>
      {items.length === 0 ? (
        <EmptyQueue
          message="No pending certificates"
          sub="Student certificate submissions appear here for verification."
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const d = item.data;
            return (
              <li key={item.id} className="px-5 py-4 hover:bg-neutral-50">
                <div className="flex flex-wrap items-center gap-4">
                  <StudentStub student={item.student} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900">
                      {d.title}
                    </p>
                    <p className="text-xs text-neutral-500">{d.issuingOrg}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggle(item.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {isExpanded ? "Hide" : "View"} details
                    </button>
                    <ApproveRejectButtons
                      busy={busyId === item.id}
                      onApprove={() => onApprove(item)}
                      onReject={() => onReject(item)}
                    />
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 rounded-md border border-neutral-100 bg-neutral-50 p-3 space-y-2">
                    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <InfoCell label="Title" value={d.title} />
                      <InfoCell label="Issuing Org" value={d.issuingOrg} />
                      {d.issueDate && (
                        <InfoCell
                          label="Issued"
                          value={new Date(d.issueDate).toLocaleDateString()}
                        />
                      )}
                      {d.expiryDate && (
                        <InfoCell
                          label="Expires"
                          value={new Date(d.expiryDate).toLocaleDateString()}
                        />
                      )}
                      {d.credentialId && (
                        <InfoCell label="Credential ID" value={d.credentialId} />
                      )}
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      {d.credentialUrl && (
                        <a
                          href={d.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-blue-600 ring-1 ring-neutral-200 hover:bg-blue-50"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Verify Credential
                        </a>
                      )}
                      {d.certificateUrl && (
                        <a
                          href={d.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-blue-600 ring-1 ring-neutral-200 hover:bg-blue-50"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Certificate
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- Shared sub-components ----

function StudentStub({
  student,
}: {
  student: {
    fullName: string;
    emailId: string;
    studentId: string | null;
    department: string | null;
    academicYear: string | null;
    profilePic: string | null;
  };
}) {
  const initials =
    student.fullName
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST";
  return (
    <div className="flex items-center gap-2 min-w-0 w-48 flex-shrink-0">
      {student.profilePic ? (
        <img
          src={student.profilePic}
          alt=""
          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-900">
          {student.fullName}
        </p>
        <p className="truncate text-xs text-neutral-500">
          {student.studentId ?? student.emailId}
        </p>
      </div>
    </div>
  );
}

function ApproveRejectButtons({
  busy,
  onApprove,
  onReject,
}: {
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onReject}
        disabled={busy}
        className="border-neutral-300 text-neutral-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
      >
        <X className="h-3 w-3 mr-1" />
        Reject
      </Button>
      <Button
        size="sm"
        onClick={onApprove}
        disabled={busy}
        className="bg-neutral-900 text-white hover:bg-neutral-800"
      >
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Approve
      </Button>
    </div>
  );
}

function PendingBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {count} pending
    </span>
  );
}

function EmptyQueue({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="mt-3 text-sm font-medium text-neutral-900">{message}</p>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{sub}</p>
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-4">
        <div className="h-5 w-48 animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="space-y-3 p-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-md bg-neutral-50" />
        ))}
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-2 ring-1 ring-neutral-200">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium text-neutral-800">{value}</p>
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </span>
      <span className="text-neutral-700">{value}</span>
    </span>
  );
}
