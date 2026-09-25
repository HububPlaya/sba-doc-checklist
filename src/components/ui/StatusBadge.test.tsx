// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the Complete label with green styling", () => {
    render(<StatusBadge status="Complete" />);
    const badge = screen.getByText("Complete");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-green-50");
  });

  it("renders the Outstanding label with slate styling", () => {
    render(<StatusBadge status="Outstanding" />);
    const badge = screen.getByText("Outstanding");
    expect(badge.className).toContain("bg-slate-50");
  });

  it("renders the Stalled label with red styling", () => {
    render(<StatusBadge status="Stalled" />);
    const badge = screen.getByText("Stalled");
    expect(badge.className).toContain("bg-red-50");
  });
});
