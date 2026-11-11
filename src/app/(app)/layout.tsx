import { redirect } from "next/navigation";
import { AppProvider } from "@/components/AppContext";
import { Sidebar } from "@/components/Sidebar";
import { TzCookie } from "@/components/TzCookie";
import { getProjects } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { serverToday } from "@/lib/today";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [projects, today] = await Promise.all([getProjects(), serverToday()]);

  return (
    <AppProvider value={{ projects, today }}>
      <TzCookie />
      <div className="md:flex">
        <Sidebar projects={projects} email={user.email ?? ""} />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </AppProvider>
  );
}
