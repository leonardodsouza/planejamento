-- Endereço secreto iCal (Google Agenda etc.) para mostrar compromissos no planejador
ALTER TABLE users ADD COLUMN ical_url TEXT;
