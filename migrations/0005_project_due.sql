-- Data de entrega do projeto (destacada no calendário)
ALTER TABLE projects ADD COLUMN due_date TEXT;

-- Projetos antigos: usa a etapa "do dia da entrega" (0 dias antes em algum modelo) ou a última tarefa.
UPDATE projects SET due_date = COALESCE(
  (SELECT MAX(t.due_date) FROM tasks t
    WHERE t.project_id = projects.id
      AND t.title IN (SELECT s.title FROM template_steps s WHERE s.user_id = projects.user_id AND s.days_before = 0)),
  (SELECT MAX(t.due_date) FROM tasks t WHERE t.project_id = projects.id)
);
