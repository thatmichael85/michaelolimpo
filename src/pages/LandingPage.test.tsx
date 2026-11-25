import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("renders all key landing page sections", () => {
    const { container } = render(<LandingPage />);
    expect(container.querySelector(".landing-wrapper")).toBeInTheDocument();
    expect(container.querySelector(".cartoon-card")).toBeInTheDocument();
    expect(container.querySelector(".identity-info")).toBeInTheDocument();
    expect(container.querySelector(".bio-block")).toBeInTheDocument();
    expect(container.querySelector(".linkedin-cta-wrap")).toBeInTheDocument();
    expect(container.querySelector(".tools-showcase")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Marquee/ })).toHaveAttribute("href", "/tools/marquee/");

    expect(screen.getByRole("heading", { level: 1, name: "Michael Angelo S Olimpo" })).toBeInTheDocument();
    expect(screen.getByText("AI Guide & Systems Builder")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Guiding AI at Meta to build internal tools—helping fellow humans create, code, and lead with AI."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Father of 3 kids, drowning in love and work.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Connect on LinkedIn (opens in a new tab)",
      })
    ).toBeInTheDocument();
  });
});
