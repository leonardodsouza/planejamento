import { AppProvider } from "@/components/AppContext";
import { Sidebar } from "@/components/Sidebar";
import { TzCookie } from "@/components/TzCookie";
import { getProjects, getTemplates } from "@/lib/queries";
import { ensureDefaultTemplates } from "@/lib/server/default-templates";
import { requireUser } from "@/lib/server/auth";
import { serverToday } from "@/lib/today";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  await ensureDefaultTemplates(user.id);
  const [projects, templates, today] = await Promise.all([getProjects(), getTemplates(), serverToday()]);

  return (
    <AppProvider value={{ projects, templates, today }}>
      <TzCookie />
      <div className="md:flex">
        <Sidebar projects={projects} email={user.email} />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </AppProvider>
  );
}
