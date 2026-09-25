export type DocumentStatus = "Pending" | "Received" | "Under Review" | "Approved" | "Rejected";
export type ApplicationStatus = "Complete" | "Outstanding" | "Stalled";
export type UserRole = "processor" | "team_lead";

export interface Application {
  id: string;
  business_name: string;
  borrower_name: string;
  loan_amount: number;
  application_date: string;
  assigned_processor: string;
  archived_at: string | null;
}

export interface DocumentRecord {
  id: number;
  application_id: string;
  document_type: string;
  status: DocumentStatus;
  date_received: string | null;
  expiration_date: string | null;
  notes: string | null;
  updated_at: string | null;
  updated_by: string | null;
  alert_sent_at: string | null;
}

export interface ImportRow {
  application_id: string;
  business_name: string;
  borrower_name: string;
  loan_amount: string;
  application_date: string;
  assigned_processor: string;
  document_type: string;
  document_status: string;
  date_received: string;
  expiration_date: string;
  notes: string;
}

export interface ImportSummary {
  inserted: number;
  updated: number;
  skipped: number;
  skippedRows: { row: number; reason: string }[];
  flaggedUnknownTypes: string[];
}
