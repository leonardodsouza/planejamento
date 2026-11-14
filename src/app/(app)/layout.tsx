import { AppProvider } from "@/components/AppContext";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/Sidebar";
import { SIDEBAR_COOKIE } from "@/lib/sidebar";
import { TzCookie } from "@/components/TzCookie";
import { getProjects, getTemplates } from "@/lib/queries";
import { ensureDefaultTemplates } from "@/lib/server/default-templates";
import { requireUser } from "@/lib/server/auth";
import { serverToday } from "@/lib/today";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  await ensureDefaultTemplates(user.id);
  const [projects, templates, today, cookieStore] = await Promise.all([getProjects(), getTemplates(), serverToday(), cookies()]);
  const sidebarCollapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed";

  return (
    <AppProvider value={{ projects, templates, today }}>
      <TzCookie />
      <div className="md:flex">
        <Sidebar projects={projects} email={user.email} initialCollapsed={sidebarCollapsed} />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-6">{children}</main>
      </div>
    </AppProvider>
  );
}
