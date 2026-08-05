// ============================================
// WHAT THIS FILE DOES (plain English):
// Loads a quiz plugin by slug from the registry and renders it. If the slug is
// unknown or the plugin crashes, we show a friendly fallback instead of taking
// down the whole app (error boundary).
// ============================================
import React, { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ButtonSecondary, Screen, ScreenBody, ScreenHeader } from '@bridger/ui';
import { findQuizPlugin } from '../registry';

type Props = {
  slug: string;
  onClose: () => void;
};

// --- ERROR BOUNDARY: one broken quiz must not crash Home ---

type BoundaryState = { error: Error | null };

class QuizErrorBoundary extends Component<
  { children: ReactNode; onClose: () => void },
  BoundaryState
> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep this quiet in production; useful while building plugins.
    if (__DEV__) {
      console.warn('Quiz plugin crashed', error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <Screen tone="canvas">
          <ScreenHeader title="Quiz" onBack={this.props.onClose} />
          <ScreenBody>
            <View
              accessibilityRole="text"
              accessibilityLabel="This quiz could not load"
              className="mt-8 items-center gap-3"
            >
              <Text className="font-pixel text-[22px] text-ink">Could not load this quiz</Text>
              <Text className="text-center font-sans-sb text-[14px] text-ink-mute">
                Something went wrong. Try again from Home.
              </Text>
              <ButtonSecondary onPress={this.props.onClose} accessibilityLabel="Go back">
                Go back
              </ButtonSecondary>
            </View>
          </ScreenBody>
        </Screen>
      );
    }
    return this.props.children;
  }
}

/** Dynamically load and mount a quiz plugin for the given slug. */
export function QuizHost({ slug, onClose }: Props) {
  const [Comp, setComp] = useState<React.ComponentType<{ slug: string }> | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const entry = findQuizPlugin(slug);
    if (!entry) {
      setMissing(true);
      return;
    }
    entry
      .load()
      .then((mod) => {
        if (!cancelled) setComp(() => mod.default);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (missing) {
    return (
      <Screen tone="canvas">
        <ScreenHeader title="Quiz" onBack={onClose} />
        <ScreenBody>
          <View className="mt-8 items-center gap-3">
            <Text
              accessibilityRole="text"
              className="font-pixel text-[22px] text-ink"
            >
              Quiz not found
            </Text>
            <ButtonSecondary onPress={onClose} accessibilityLabel="Go back">
              Go back
            </ButtonSecondary>
          </View>
        </ScreenBody>
      </Screen>
    );
  }

  if (!Comp) {
    return (
      <Screen tone="canvas">
        <ScreenHeader title="Quiz" onBack={onClose} />
        <ScreenBody>
          <Text
            accessibilityLabel="Loading quiz"
            className="mt-8 text-center font-sans-sb text-[14px] text-ink-mute"
          >
            Loading…
          </Text>
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <QuizErrorBoundary onClose={onClose}>
      <Comp slug={slug} />
    </QuizErrorBoundary>
  );
}
