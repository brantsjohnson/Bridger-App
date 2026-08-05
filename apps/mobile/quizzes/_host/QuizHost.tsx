// ============================================
// WHAT THIS FILE DOES (plain English):
// Loads a quiz by slug: prefer a branded plugin from the registry; otherwise
// fall back to GenericQuizTake (any admin-published quiz from the API). If the
// plugin crashes, we show a friendly fallback instead of taking down the app.
// ============================================
import React, { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ButtonSecondary, Screen, ScreenBody, ScreenHeader } from '@bridger/ui';
import { findQuizPlugin } from '../registry';
import GenericQuizTake from '../_generic/GenericQuizTake';

type Props = {
  slug: string;
  onClose: () => void;
};

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

/** Dynamically load a plugin, or fall back to the generic API take UI. */
export function QuizHost({ slug, onClose }: Props) {
  const [Comp, setComp] = useState<React.ComponentType<{ slug: string }> | null>(
    null
  );
  const [useGeneric, setUseGeneric] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const entry = findQuizPlugin(slug);
    if (!entry) {
      setUseGeneric(true);
      setLoading(false);
      return;
    }
    entry
      .load()
      .then((mod) => {
        if (!cancelled) {
          setComp(() => mod.default);
          setLoading(false);
        }
      })
      .catch(() => {
        // Plugin failed to load — still try the generic API take.
        if (!cancelled) {
          setUseGeneric(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
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

  if (useGeneric || !Comp) {
    return (
      <QuizErrorBoundary onClose={onClose}>
        <GenericQuizTake slug={slug} />
      </QuizErrorBoundary>
    );
  }

  return (
    <QuizErrorBoundary onClose={onClose}>
      <Comp slug={slug} />
    </QuizErrorBoundary>
  );
}
