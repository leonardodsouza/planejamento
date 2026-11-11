import { TemplateCard } from "@/components/TemplateCard";
import { createTemplate } from "@/lib/template-actions";
import { getTemplates, getTemplateSteps } from "@/lib/queries";

export default async function ProjetosPage() {
  const templates = await getTemplates();
  const steps = await Promise.all(templates.map((t) => getTemplateSteps(t.id)));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Projetos</h1>
        <p className="text-sm text-slate-500">
          Cada projeto nasce de um modelo com suas etapas. Você informa a data de entrega e os
          prazos de cada etapa são calculados de trás para frente.
        </p>
      </div>

      <ul className="space-y-3">
        {templates.map((t, i) => (
          <TemplateCard key={t.id} template={t} steps={steps[i]} />
        ))}
      </ul>

      <form action={createTemplate} className="card flex gap-2 p-3">
        <input className="input" name="name" placeholder="Nome do novo modelo (ex.: Post, Live)" required />
        <button className="btn-primary shrink-0">Criar modelo</button>
      </form>

      {templates.length === 0 && (
        <p className="text-sm text-slate-400">
          Nenhum modelo ainda. Crie o primeiro acima.
        </p>
      )}
    </div>
  );
}
