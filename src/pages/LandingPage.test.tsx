import { describe, it, expect, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { LandingPage } from "./LandingPage";
import { installFakeLanguageModel, uninstallFakeLanguageModel } from "../test/fakeLanguageModel";

describe("LandingPage chat gate", () => {
  afterEach(uninstallFakeLanguageModel);

  const expectNoChat = (container: HTMLElement) => {
    expect(container.querySelector(".chat-panel")).not.toBeInTheDocument();
    expect(container.querySelector(".landing-wrapper")).not.toHaveClass("landing-wrapper--with-chat");
  };

  it("shows no chat and keeps the single-column layout when Chrome reports Nano unavailable", async () => {
    const fake = installFakeLanguageModel({ availability: "unavailable" });
    const { container } = render(<LandingPage />);
    await waitFor(() => expect(fake.availability).toHaveBeenCalled());
    await act(async () => {});
    expectNoChat(container);
  });

  it("shows no chat without the Prompt API", async () => {
    const { container } = render(<LandingPage />);
    await act(async () => {});
    expectNoChat(container);
  });

  it("shows the chat to the right when Nano is available", async () => {
    installFakeLanguageModel({ availability: "available" });
    const { container } = render(<LandingPage />);
    expect(await screen.findByRole("heading", { name: /Ask about Michael/ })).toBeInTheDocument();
    expect(container.querySelector(".landing-wrapper")).toHaveClass("landing-wrapper--with-chat");
    expect(container.querySelector(".chat-column .chat-panel")).toBeInTheDocument();
  });
});

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
