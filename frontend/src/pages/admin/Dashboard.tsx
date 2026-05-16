import { useSearchParams } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { AdminSidebar, type AdminTab } from "@/components/shared/AdminSidebar";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { OverviewTab } from "./tabs/OverviewTab";
import { ApprovalsTab } from "./tabs/ApprovalsTab";
import { StudentsTab } from "./tabs/StudentsTab";
import { FacultyTab } from "./tabs/FacultyTab";
import { JobsTab } from "./tabs/JobsTab";
import { EventsTab } from "./tabs/EventsTab";
import { StartupsTab } from "./tabs/StartupsTab";
import { AmbassadorsTab } from "./tabs/AmbassadorsTab";

const TAB_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: {
    title: "Overview",
    subtitle: "Key metrics across the placement portal.",
  },
  approvals: {
    title: "Pending Approvals",
    subtitle:
      "Review registrations, profile/marks changes, internships, achievements, and certificates.",
  },
  students: {
    title: "Students",
    subtitle: "Browse, filter, and manage student accounts.",
  },
  faculty: {
    title: "Faculty",
    subtitle: "Create and manage faculty accounts.",
  },
  jobs: {
    title: "Jobs",
    subtitle: "Post and monitor placement opportunities.",
  },
  events: {
    title: "Events",
    subtitle: "Schedule drives, workshops, and seminars.",
  },
  startups: {
    title: "Startups",
    subtitle: "Manage startup partners, contacts, and details.",
  },
  ambassadors: {
    title: "Student Ambassador",
    subtitle: "Manage TPO volunteer assignments and served academic years.",
  },
};

const ADMIN_TABS: AdminTab[] = [
  "overview",
  "approvals",
  "students",
  "faculty",
  "jobs",
  "events",
  "startups",
  "ambassadors",
];

export function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: AdminTab = (ADMIN_TABS as string[]).includes(tabParam ?? "")
    ? (tabParam as AdminTab)
    : "overview";

  const setTab = (
    t: AdminTab,
    pendingEntity?: "PROFILE_OR_MARKS" | "INTERNSHIP" | "ACHIEVEMENT"
  ) => {
    const next = new URLSearchParams(searchParams);
    if (t === "overview") next.delete("tab");
    else next.set("tab", t);
    if (pendingEntity) next.set("pendingEntity", pendingEntity);
    else next.delete("pendingEntity");
    setSearchParams(next, { replace: true });
  };

  const { title, subtitle } = TAB_TITLES[tab];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar active={tab} onSelect={setTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
            <p className="text-xs text-neutral-500">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {user && <NotificationBell />}
            <div className="hidden items-center gap-2 sm:flex">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                  {user?.fullName?.slice(0, 2).toUpperCase() || "AD"}
                </div>
              )}
              <div className="hidden text-right lg:block">
                <p className="text-sm font-medium text-neutral-900">{user?.fullName}</p>
                <p className="text-[11px] text-neutral-500">{user?.emailId}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {tab === "overview" && <OverviewTab onNavigate={setTab} />}
            {tab === "approvals" && <ApprovalsTab />}
            {tab === "students" && <StudentsTab />}
            {tab === "faculty" && <FacultyTab />}
            {tab === "jobs" && <JobsTab />}
            {tab === "events" && <EventsTab />}
            {tab === "startups" && <StartupsTab />}
            {tab === "ambassadors" && <AmbassadorsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
