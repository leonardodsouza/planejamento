-- Modelos de projeto (ex.: "Vídeo") e checklist dentro das tarefas

ALTER TABLE users ADD COLUMN templates_seeded INTEGER NOT NULL DEFAULT 0;

CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX templates_user_idx ON templates(user_id);

CREATE TABLE template_steps (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  days_before INTEGER NOT NULL DEFAULT 0,  -- dias antes da data de entrega
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  checklist TEXT NOT NULL DEFAULT '[]',    -- JSON: lista de textos
  position REAL NOT NULL
);
CREATE INDEX template_steps_template_idx ON template_steps(template_id, position);

CREATE TABLE checklist_items (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  position REAL NOT NULL
);
CREATE INDEX checklist_task_idx ON checklist_items(task_id, position);
