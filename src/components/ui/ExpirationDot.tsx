import type { ExpirationFlag } from "@/lib/domain/expiration";

const EXPIRATION_STYLES: Record<ExpirationFlag, string> = {
  expired: "bg-red-500",
  expiring_soon: "bg-amber-400",
  none: "bg-transparent",
};

const EXPIRATION_LABELS: Record<ExpirationFlag, string> = {
  expired: "Has expired document(s)",
  expiring_soon: "Document expiring soon",
  none: "",
};

export function worstExpirationFlag(
  documents: { expirationFlag: ExpirationFlag }[]
): ExpirationFlag {
  if (documents.some((d) => d.expirationFlag === "expired")) return "expired";
  if (documents.some((d) => d.expirationFlag === "expiring_soon")) return "expiring_soon";
  return "none";
}

export default function ExpirationDot({
  flag,
  size,
}: {
  flag: ExpirationFlag;
  size?: "sm" | "xs";
}) {
  if (flag === "none") return null;
  const dimension = size === "xs" ? "h-2 w-2" : "h-2.5 w-2.5";
  return (
    <span
      title={EXPIRATION_LABELS[flag]}
      className={"inline-block rounded-full " + dimension + " " + EXPIRATION_STYLES[flag]}
    />
  );
}
