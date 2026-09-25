// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ExpirationDot, { worstExpirationFlag } from "./ExpirationDot";

describe("ExpirationDot", () => {
  it("renders nothing when flag is none", () => {
    const { container } = render(<ExpirationDot flag="none" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a red dot when flag is expired", () => {
    const { container } = render(<ExpirationDot flag="expired" />);
    const dot = container.querySelector("span");
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain("bg-red-500");
  });

  it("renders an amber dot when flag is expiring_soon", () => {
    const { container } = render(<ExpirationDot flag="expiring_soon" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("bg-amber-400");
  });
});

describe("worstExpirationFlag", () => {
  it("returns expired if any document is expired", () => {
    const docs = [{ expirationFlag: "none" as const }, { expirationFlag: "expired" as const }];
    expect(worstExpirationFlag(docs)).toBe("expired");
  });

  it("returns expiring_soon if no document is expired but one is expiring soon", () => {
    const docs = [
      { expirationFlag: "none" as const },
      { expirationFlag: "expiring_soon" as const },
    ];
    expect(worstExpirationFlag(docs)).toBe("expiring_soon");
  });

  it("returns none if no documents are flagged", () => {
    const docs = [{ expirationFlag: "none" as const }];
    expect(worstExpirationFlag(docs)).toBe("none");
  });
});
