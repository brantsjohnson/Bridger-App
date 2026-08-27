// ============================================
// WHAT THIS FILE DOES (plain English):
// Loads a quiz by slug: prefer a branded plugin from the registry; otherwise
// fall back to GenericQuizTake (any admin-published quiz from the API). If the
// plugin crashes, we show a friendly fallback instead of taking down the app.
// ============================================
import React, { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ButtonSecondary, Screen, ScreenBody, ScreenHeader } from '@bridger/ui';
import { findQuizPlugin, quizTitleForSlug } from '../registry';
import GenericQuizTake from '../_generic/GenericQuizTake';

type Props = {
  slug: string;
  onClose: () => void;
};

type BoundaryState = { error: Error | null };

class QuizErrorBoundary extends Component<
  { children: ReactNode; onClose: () => void; title?: string },
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
          <ScreenHeader title={this.props.title ?? 'Quiz'} onBack={this.props.onClose} />
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

function LoadFailed({
  onClose,
  detail,
  title
}: {
  onClose: () => void;
  detail?: string;
  title: string;
}) {
  return (
    <Screen tone="canvas">
      <ScreenHeader title={title} onBack={onClose} />
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
          {__DEV__ && detail ? (
            <Text className="mt-2 text-center font-sans text-[11px] text-ink-mute">{detail}</Text>
          ) : null}
          <ButtonSecondary onPress={onClose} accessibilityLabel="Go back">
            Go back
          </ButtonSecondary>
        </View>
      </ScreenBody>
    </Screen>
  );
}

/** Dynamically load a plugin, or fall back to the generic API take UI. */
export function QuizHost({ slug, onClose }: Props) {
  const [Comp, setComp] = useState<React.ComponentType<{ slug: string }> | null>(
    null
  );
  const [useGeneric, setUseGeneric] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setComp(null);
    setUseGeneric(false);

    const entry = findQuizPlugin(slug);
    if (!entry) {
      // No branded plugin: use the API-driven generic take.
      setUseGeneric(true);
      setLoading(false);
      return;
    }

    entry
      .load()
      .then((mod) => {
        if (cancelled) return;
        const ScreenComp = mod.default;
        if (!ScreenComp) {
          throw new Error(`Quiz "${slug}" has no default export`);
        }
        // Wrap in a function so React does not treat the component as a setState updater.
        setComp(() => ScreenComp);
        setLoading(false);
      })
      .catch((err: unknown) => {
        // A registered plugin failed. Do NOT fall back to Generic (that shows a
        // misleading "Quiz not found" when the API has no row for this slug).
        if (__DEV__) {
          console.warn('Quiz plugin failed to load', slug, err);
        }
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const title = quizTitleForSlug(slug);

  if (loading) {
    return (
      <Screen tone="canvas">
        <ScreenHeader title={title} onBack={onClose} />
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

  if (loadError) {
    return <LoadFailed onClose={onClose} detail={loadError} title={title} />;
  }

  if (useGeneric || !Comp) {
    return (
      <QuizErrorBoundary onClose={onClose} title={title}>
        <GenericQuizTake slug={slug} />
      </QuizErrorBoundary>
    );
  }

  return (
    <QuizErrorBoundary onClose={onClose} title={title}>
      <Comp slug={slug} />
    </QuizErrorBoundary>
  );
}
