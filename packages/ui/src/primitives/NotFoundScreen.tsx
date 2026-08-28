// ============================================
// WHAT THIS FILE DOES (plain English):
// The 404 popup from Magic Patterns: an old-Windows dialog that says
// "Error 404" / "You're invited to suffer" with an OK button and the
// classic yellow warning triangle. Shown when a route is missing or
// something went wrong on the way (e.g. a broken connection path).
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { AnalyticsRegion } from '../lib/analytics';
import { NOT_FOUND } from '@bridger/shared';
import { Screen } from '../layout/Screen';
import { WindowsButton, WindowsDialog } from './WindowsDialog';

// THIS SECTION DOES: draw the classic Windows warning mark (yellow
// triangle with a black !) so we do not use a cake emoji stand-in.
function WindowsWarningIcon() {
  return (
    <View
      accessible={false}
      style={{ width: 40, height: 36, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Black outline triangle (slightly larger, sits underneath). */}
      <View
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          borderLeftWidth: 20,
          borderRightWidth: 20,
          borderBottomWidth: 35,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: '#1C1B16'
        }}
      />
      {/* Yellow fill triangle on top of the outline. */}
      <View
        style={{
          position: 'absolute',
          top: 2,
          width: 0,
          height: 0,
          borderLeftWidth: 17,
          borderRightWidth: 17,
          borderBottomWidth: 30,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: '#F5C518'
        }}
      />
      <Text
        accessible={false}
        style={{
          position: 'absolute',
          top: 11,
          fontSize: 16,
          fontWeight: '900',
          color: '#1C1B16',
          lineHeight: 18
        }}
      >
        !
      </Text>
    </View>
  );
}

export function NotFoundScreen({
  onDismiss,
  title = 'Error 404'
}: {
  onDismiss?: () => void;
  /** Title bar text (default "Error 404"). */
  title?: string;
}) {
  return (
    <Screen tone="canvas">
      <View className="flex-1 items-center justify-center px-6">
        <WindowsDialog
          title={title}
          onClose={onDismiss}
          closeAnalyticsId={NOT_FOUND.chrome.dismiss}
        >
          <AnalyticsRegion
            analyticsId={NOT_FOUND.dialog.body}
            interactive={false}
            accessibilityLabel="You're invited to suffer"
          >
            <View className="flex-row items-center gap-3.5">
              <WindowsWarningIcon />
              <Text className="min-w-0 flex-1 font-pixel text-[17px] leading-tight text-[#1C1B16]">
                You're invited to suffer
              </Text>
            </View>
          </AnalyticsRegion>
          <View className="mt-6 flex-row justify-center">
            <WindowsButton
              autoFocusRing
              onPress={onDismiss}
              analyticsId={NOT_FOUND.dialog.ok}
              accessibilityLabel="OK"
            >
              OK
            </WindowsButton>
          </View>
        </WindowsDialog>
      </View>
    </Screen>
  );
}
