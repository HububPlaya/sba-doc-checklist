type AlertDocument = {
  document_type: string;
  expiration_date: string | null;
  businessName: string;
};

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export function renderAlertEmail(documents: AlertDocument[]): string {
  const rows = documents
    .map((d) => {
      const expired = isExpired(d.expiration_date);
      const badgeColor = expired ? "#dc2626" : "#d97706";
      const badgeBg = expired ? "#fef2f2" : "#fffbeb";
      const badgeLabel = expired ? "Expired" : "Expiring soon";
      return (
        "<tr>" +
        "<td style=\"padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;\">" +
        d.businessName +
        "</td>" +
        "<td style=\"padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;\">" +
        d.document_type +
        "</td>" +
        "<td style=\"padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;\">" +
        (d.expiration_date || "unknown") +
        "</td>" +
        "<td style=\"padding:10px 12px;border-bottom:1px solid #e2e8f0;\">" +
        "<span style=\"display:inline-block;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600;color:" +
        badgeColor +
        ";background:" +
        badgeBg +
        ";\">" +
        badgeLabel +
        "</span>" +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  return (
    "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;\">" +
    "<h2 style=\"color:#0f172a;font-size:18px;margin-bottom:4px;\">Documents expiring soon</h2>" +
    "<p style=\"color:#64748b;font-size:14px;margin-top:0;margin-bottom:20px;\">" +
    documents.length +
    " document" +
    (documents.length === 1 ? "" : "s") +
    " need attention. A CSV with the full list is attached.</p>" +
    "<table style=\"width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;\">" +
    "<thead><tr style=\"background:#f8fafc;\">" +
    "<th style=\"text-align:left;padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase;\">Business</th>" +
    "<th style=\"text-align:left;padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase;\">Document</th>" +
    "<th style=\"text-align:left;padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase;\">Expiration</th>" +
    "<th style=\"text-align:left;padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase;\">Status</th>" +
    "</tr></thead>" +
    "<tbody>" +
    rows +
    "</tbody>" +
    "</table>" +
    "<p style=\"color:#94a3b8;font-size:12px;margin-top:20px;\">Sent automatically by the SBA Document Checklist tool.</p>" +
    "</div>"
  );
}

export function renderAlertCsv(documents: AlertDocument[]): string {
  const header = "Business,Document Type,Expiration Date\n";
  const rows = documents
    .map((d) => {
      const escapedBusiness = "\"" + d.businessName.replace(/"/g, "\"\"") + "\"";
      const escapedType = "\"" + d.document_type.replace(/"/g, "\"\"") + "\"";
      return escapedBusiness + "," + escapedType + "," + (d.expiration_date || "");
    })
    .join("\n");
  return header + rows;
}