import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  getActiveApplications,
  getDocumentsForApplications,
  groupDocumentsByApplication,
} from "@/lib/db/queries";
import { computePipelineSummary } from "@/lib/domain/dashboard";
import { getExpiringDocuments, getAlertEligibleDocuments } from "@/lib/domain/expiration";
import { sendExpirationAlert } from "@/lib/notifications/sendExpirationAlert";

export async function GET() {
  console.log("[api/dashboard] GET request received");

  const session = await auth();
  if (!session?.user) {
    console.log("[api/dashboard] unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applications = getActiveApplications();
    const documents = getDocumentsForApplications(applications.map((a) => a.id));
    const documentsByAppId = groupDocumentsByApplication(documents);

    const summary = computePipelineSummary(applications, documentsByAppId);

    const applicationsById = new Map(applications.map((a) => [a.id, a]));
    const expiringDocs = getExpiringDocuments(documents)
      .map((doc) => ({
        ...doc,
        businessName: applicationsById.get(doc.application_id)?.business_name || "Unknown",
      }))
      .sort((a, b) => (a.expiration_date || "").localeCompare(b.expiration_date || ""));

    const eligibleForAlert = getAlertEligibleDocuments(documents).map((doc) => ({
      ...doc,
      businessName: applicationsById.get(doc.application_id)?.business_name || "Unknown",
    }));

    if (eligibleForAlert.length > 0) {
      console.log("[api/dashboard] triggering expiration alert for", eligibleForAlert.length, "documents");
      await sendExpirationAlert(eligibleForAlert);
    }

    console.log("[api/dashboard] summary computed", {
      complete: summary.complete,
      outstanding: summary.outstanding,
      stalled: summary.stalled,
      expiringCount: expiringDocs.length,
    });

    return NextResponse.json({ summary, expiringDocs });
  } catch (err) {
    console.error("[api/dashboard] error", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
