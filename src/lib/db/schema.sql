CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  borrower_name TEXT,
  loan_amount INTEGER,
  application_date TEXT,
  assigned_processor TEXT,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id TEXT NOT NULL REFERENCES applications(id),
  document_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  date_received TEXT,
  expiration_date TEXT,
  notes TEXT,
  updated_at TEXT,
  updated_by TEXT,
  alert_sent_at TEXT,
  UNIQUE(application_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  alert_recipient_email TEXT
);
INSERT OR IGNORE INTO settings (id, alert_recipient_email) VALUES (1, NULL);

CREATE TABLE IF NOT EXISTS users (
  name TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'processor'
);
