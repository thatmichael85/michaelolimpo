import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LandingPage } from "./LandingPage";
import { installFakeLanguageModel, uninstallFakeLanguageModel } from "../test/fakeLanguageModel";

// Simulates the lazy chat chunk failing to load (flaky network, or a stale hash after a deploy).
vi.mock("../components/chat/ChatPanel", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

describe("LandingPage when the chat chunk fails to load", () => {
  afterEach(uninstallFakeLanguageModel);

  it("keeps the homepage and re-centres the card", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    installFakeLanguageModel({ availability: "available" });
    const { container } = render(<LandingPage />);
    // React reports the error the boundary caught; only then has the failure actually happened.
    await waitFor(() => expect(consoleError).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() =>
      expect(container.querySelector(".landing-wrapper")).not.toHaveClass("landing-wrapper--with-chat"),
    );
    expect(screen.getByRole("heading", { level: 1, name: "Michael Angelo S Olimpo" })).toBeInTheDocument();
    expect(container.querySelector(".landing-wrapper")).not.toHaveClass("landing-wrapper--with-chat");
    expect(container.querySelector(".chat-column")).not.toBeInTheDocument();
  });
});
