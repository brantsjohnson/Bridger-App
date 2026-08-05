// ============================================
// WHAT THIS FILE DOES (plain English):
// The "Fucks not found." 404 popup from Magic Patterns — an old-Windows dialog
// with a black X circle and an OK button. Shown when a route is missing or
// something went wrong on the way (e.g. a broken connection path).
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { XIcon } from 'lucide-react-native';
import { AnalyticsRegion } from '../lib/analytics';
import { NOT_FOUND } from '@bridger/shared';
import { Screen } from '../layout/Screen';
import { WindowsButton, WindowsDialog } from './WindowsDialog';

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
          >
            <View className="flex-row items-center gap-3.5">
              <View
                accessible={false}
                className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1C1B16]"
              >
                <XIcon size={20} color="#FFFFFF" strokeWidth={4} />
              </View>
              <Text className="min-w-0 flex-1 font-pixel text-[19px] leading-tight text-[#1C1B16]">
                Fucks not found.
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
