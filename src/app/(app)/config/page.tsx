import { CalendarForm } from "@/components/CalendarForm";
import { requireUser } from "@/lib/server/auth";
import { getIcalUrl } from "@/lib/server/calendar";

export default async function ConfigPage() {
  const user = await requireUser();
  const connected = !!(await getIcalUrl(user.id));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Google Agenda</h2>
          <p className="mt-1 text-sm text-slate-500">
            Seus compromissos aparecem no Hoje e na Semana, junto com as tarefas. O planejador só lê a
            agenda, nunca altera nada nela.
          </p>
        </div>

        <CalendarForm connected={connected} />

        <details className="text-sm text-slate-600 dark:text-slate-300">
          <summary className="cursor-pointer font-medium">Onde encontro o endereço secreto?</summary>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Abra o Google Agenda no computador (calendar.google.com).</li>
            <li>Na lateral, em &quot;Minhas agendas&quot;, passe o mouse na sua agenda, clique nos ⋮ e em &quot;Configurações e compartilhamento&quot;.</li>
            <li>Role até &quot;Integrar agenda&quot; e copie o <b>Endereço secreto no formato iCal</b>.</li>
            <li>Cole aqui e clique em Salvar.</li>
          </ol>
          <p className="mt-2 text-xs text-slate-500">
            Não compartilhe esse endereço: quem tiver o link consegue ver sua agenda. Alterações no
            Google podem levar alguns minutos para aparecer.
          </p>
        </details>
      </section>
    </div>
  );
}
