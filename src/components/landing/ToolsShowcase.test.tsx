import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ToolsShowcase } from "./ToolsShowcase";
import { TOOLS } from "./tools";

describe("ToolsShowcase", () => {
  it("renders a labelled Tools section with a heading", () => {
    render(<ToolsShowcase />);
    const section = screen.getByRole("region", { name: "Tools I've built" });
    expect(section).toBeInTheDocument();
    expect(within(section).getByRole("heading", { level: 2, name: "Tools I've built" })).toBeInTheDocument();
  });

  it("lists every tool as a same-tab link to its page", () => {
    render(<ToolsShowcase />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(TOOLS.length);

    const marquee = screen.getByRole("link", { name: /Marquee/ });
    expect(marquee).toHaveAttribute("href", "/tools/marquee/");
    expect(marquee).not.toHaveAttribute("target");

    const photos = screen.getByRole("link", { name: /ChildFirst Photo Export/ });
    expect(photos).toHaveAttribute("href", "/tools/downloadphotos/");
    expect(photos).not.toHaveAttribute("target");
  });

  it("shows a short description for each tool", () => {
    render(<ToolsShowcase />);
    for (const tool of TOOLS) {
      expect(screen.getByText(tool.description)).toBeInTheDocument();
    }
  });

  it("supports a custom tool list", () => {
    render(
      <ToolsShowcase
        tools={[{ name: "Test Tool", href: "/test/", description: "Does a thing.", emoji: "🧪" }]}
      />
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Test Tool/ })).toHaveAttribute("href", "/test/");
  });
});
