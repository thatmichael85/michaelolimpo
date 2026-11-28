import { Component, type ReactNode } from 'react';

/** The chat is optional: if its chunk fails to load or it throws, render nothing and tell the page. */
export class ChatErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
