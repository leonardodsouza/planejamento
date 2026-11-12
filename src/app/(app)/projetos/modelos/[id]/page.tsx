import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StepEditor } from "@/components/StepEditor";
import { TemplateHeader } from "@/components/TemplateHeader";
import { getTemplates, getTemplateSteps } from "@/lib/queries";

export default async function ModeloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = (await getTemplates()).find((t) => t.id === id);
  if (!template) notFound();
  const steps = await getTemplateSteps(id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/projetos" className="inline-flex items-center gap-0.5 text-sm text-slate-500 hover:underline"><ChevronLeft size={16} strokeWidth={1.75} /> Projetos</Link>
      <TemplateHeader template={template} />
      <p className="text-sm text-slate-500">
        Cada etapa vira uma tarefa. O prazo é contado em dias antes da data de entrega, e o
        checklist é copiado para dentro da tarefa.
      </p>
      <ul className="space-y-3">
        {steps.map((s) => (
          <StepEditor key={s.id} templateId={id} step={s} />
        ))}
      </ul>
      <StepEditor templateId={id} />
    </div>
  );
}
