import { notFound } from "next/navigation";
import { Kanban } from "@/components/Kanban";
import { ProjectHeader } from "@/components/ProjectHeader";
import { QuickAdd } from "@/components/QuickAdd";
import { getProjects, getProjectTasks } from "@/lib/queries";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [projects, tasks] = await Promise.all([getProjects(), getProjectTasks(id)]);
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <ProjectHeader project={project} total={tasks.length} done={tasks.filter((t) => t.status === "done").length} />
      <div className="mb-6 max-w-xl">
        <QuickAdd defaults={{ project_id: id }} placeholder={`Nova tarefa em ${project.name}`} />
      </div>
      <Kanban key={id} tasks={tasks} projectId={id} />
    </div>
  );
}
