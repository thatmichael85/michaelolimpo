import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("renders computer icon (🖥️) and formatted label when on system mode (dark)", () => {
    const handleToggle = vi.fn();
    render(
      <ThemeToggle
        preference="system"
        resolvedTheme="dark"
        onToggleTheme={handleToggle}
      />
    );

    const btn = screen.getByRole("button", {
      name: "Current theme: System (dark). Switch to light mode.",
    });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute(
      "title",
      "Current theme: System (dark). Switch to light mode."
    );
    expect(screen.getByText("🖥️")).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("renders computer icon (🖥️) and formatted label when on system mode (light)", () => {
    const handleToggle = vi.fn();
    render(
      <ThemeToggle
        preference="system"
        resolvedTheme="light"
        onToggleTheme={handleToggle}
      />
    );

    const btn = screen.getByRole("button", {
      name: "Current theme: System (light). Switch to light mode.",
    });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute(
      "title",
      "Current theme: System (light). Switch to light mode."
    );
    expect(screen.getByText("🖥️")).toBeInTheDocument();
  });

  it("renders sun icon (☀️) and formatted label when on light mode", () => {
    const handleToggle = vi.fn();
    render(
      <ThemeToggle
        preference="light"
        resolvedTheme="light"
        onToggleTheme={handleToggle}
      />
    );

    const btn = screen.getByRole("button", {
      name: "Current theme: Light. Switch to dark mode.",
    });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute(
      "title",
      "Current theme: Light. Switch to dark mode."
    );
    expect(screen.getByText("☀️")).toBeInTheDocument();
  });

  it("renders moon icon (🌙) and formatted label when on dark mode", () => {
    const handleToggle = vi.fn();
    render(
      <ThemeToggle
        preference="dark"
        resolvedTheme="dark"
        onToggleTheme={handleToggle}
      />
    );

    const btn = screen.getByRole("button", {
      name: "Current theme: Dark. Switch to system mode.",
    });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute(
      "title",
      "Current theme: Dark. Switch to system mode."
    );
    expect(screen.getByText("🌙")).toBeInTheDocument();
  });
});
