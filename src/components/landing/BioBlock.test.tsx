import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BioBlock } from "./BioBlock";

describe("BioBlock", () => {
  it("renders streamlined guiding AI statement and father quote", () => {
    render(<BioBlock />);
    expect(
      screen.getByText(
        "Guiding AI at Meta to build internal tools—helping fellow humans create, code, and lead with AI."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Father of 3 kids, drowning in love and work.")
    ).toBeInTheDocument();
    expect(screen.getByText("❤️")).toHaveAttribute("aria-hidden", "true");
  });
});
