// ============================================
// WHAT THIS FILE DOES (plain English):
// Catches a crash inside one delight animation so a bad plugin cannot take
// down the whole app. On error we skip that delight and call onSkip.
// ============================================
import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Called when the delight threw; host marks it played / moves on. */
  onSkip: () => void;
};

type State = { crashed: boolean };

export class DelightErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.warn('Delight plugin crashed', error, info.componentStack);
    }
    // Skip so the queue can continue.
    this.props.onSkip();
  }

  componentDidUpdate(_prev: Props, prevState: State) {
    // Reset if parent swaps to a new delight child.
    if (this.state.crashed && !prevState.crashed) {
      // already notified via componentDidCatch
    }
  }

  render() {
    if (this.state.crashed) return null;
    return this.props.children;
  }
}
