import { NextResponse } from "next/server";
import { getActiveApplications, getDocumentsForApplications, groupDocumentsByApplication } from "@/lib/db/queries";
import { getApplicationStatus } from "@/lib/domain/applicationStatus";
import { getExpirationFlag } from "@/lib/domain/expiration";

export async function GET() {
  console.log("[api/applications] GET request received");

  try {
    const applications = getActiveApplications();
    const documents = getDocumentsForApplications(applications.map((a) => a.id));
    const documentsByAppId = groupDocumentsByApplication(documents);

    const result = applications.map((app) => {
      const docs = documentsByAppId.get(app.id) || [];
      return {
        ...app,
        status: getApplicationStatus(docs),
        documents: docs.map((d) => ({
          ...d,
          expirationFlag: getExpirationFlag(d),
        })),
      };
    });

    console.log(`[api/applications] returning ${result.length} applications`);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/applications] error", err);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}
