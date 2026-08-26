import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileHeader } from "./ProfileHeader";

describe("ProfileHeader", () => {
  it("renders decorative banners with aria-hidden, user avatar, name, and AI Guide & Systems Builder headline", () => {
    const { container } = render(<ProfileHeader />);
    const bannerContainer = container.querySelector(".banner-container");
    expect(bannerContainer).toBeInTheDocument();
    expect(bannerContainer).toHaveAttribute("aria-hidden", "true");

    const images = bannerContainer?.querySelectorAll("img");
    expect(images).toHaveLength(2);
    images?.forEach((img) => {
      expect(img).toHaveAttribute("alt", "");
    });

    expect(screen.getByRole("heading", { level: 1, name: "Michael Angelo S Olimpo" })).toBeInTheDocument();
    expect(screen.getByText("AI Guide & Systems Builder")).toBeInTheDocument();
    expect(screen.getByAltText("Michael Angelo S Olimpo")).toBeInTheDocument();
    expect(screen.getByText(/Hi!/i)).toBeInTheDocument();
  });

  it("renders custom headline and name if provided", () => {
    render(<ProfileHeader name="Jane Doe" headline="Staff AI Engineer" />);
    expect(screen.getByRole("heading", { level: 1, name: "Jane Doe" })).toBeInTheDocument();
    expect(screen.getByText("Staff AI Engineer")).toBeInTheDocument();
  });
});
