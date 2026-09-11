// ============================================
// WHAT THIS FILE DOES (plain English):
// A safety net around the collage camera. If any part of the camera or editor
// throws while drawing (a "render error"), this catches it so the whole app
// does not go to a blank crash screen. Instead we show a small "something went
// wrong" card with a Close button, plus the real error text so we can see what
// actually broke. Without this, one bad render bubbles up to the navigator and
// shows the confusing "Couldn't find a navigation context" screen.
//
// (Technically this is a React "error boundary" class component, which is the
// only kind of component React lets you catch render errors with.)
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// THIS SECTION DOES: what the safety net needs (its children + a way to leave).
type Props = {
  children: React.ReactNode;
  onLeave?: () => void;
};

// THIS SECTION DOES: remember whether we caught an error and what it said.
type State = { error: Error | null };

export class CollageErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  // THIS SECTION DOES: React calls this when a child throws while drawing.
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  // THIS SECTION DOES: log the real error so it shows up in the dev console.
  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[collage] render crash:', error?.message, error?.stack);
  }

  render() {
    const { error } = this.state;
    // No error: draw the camera / editor as normal.
    if (!error) return this.props.children;

    // Error: draw a calm fallback instead of a hard crash.
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E0E',
          padding: 24,
          justifyContent: 'center'
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
          Something went wrong
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16 }}>
          The camera hit a snag. You can close and try again.
        </Text>
        <ScrollView style={{ maxHeight: 180, marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            {error.message}
          </Text>
        </ScrollView>
        <Pressable
          onPress={() => {
            this.setState({ error: null });
            this.props.onLeave?.();
          }}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 999,
            paddingVertical: 14,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#1C1B16', fontWeight: '700' }}>Close</Text>
        </Pressable>
      </View>
    );
  }
}
