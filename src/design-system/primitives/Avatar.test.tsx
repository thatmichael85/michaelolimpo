import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "./Avatar";

describe("Avatar primitive", () => {
  it("renders avatar image with alt text and default handwritten badge", () => {
    render(<Avatar src="/assets/avatar.png" alt="Profile avatar" />);
    const img = screen.getByRole("img", { name: "Profile avatar" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/assets/avatar.png");

    const badge = screen.getByText(/Hi!/i).closest('.pop-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("pop-badge", "badge--handwritten");
  });

  it("renders custom badge text when provided", () => {
    render(<Avatar src="/assets/avatar.png" alt="User" badgeText="🚀 Founder" />);
    expect(screen.getByText("🚀 Founder")).toBeInTheDocument();
  });

  it("does not render badge when badgeText is empty", () => {
    render(<Avatar src="/assets/avatar.png" alt="User" badgeText="" />);
    expect(screen.queryByText("👋 Hi!")).not.toBeInTheDocument();
  });

  it("respects custom size prop", () => {
    const { container } = render(<Avatar src="/assets/avatar.png" alt="User" size={120} />);
    const wrapper = container.querySelector(".avatar-wrapper");
    expect(wrapper).toHaveStyle({ width: "120px", height: "120px" });
  });
});
