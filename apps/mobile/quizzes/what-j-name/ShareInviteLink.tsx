// ============================================
// WHAT THIS FILE DOES (plain English):
// Shows the quiz invite URL on the result (and Profile) so you can actually
// see it, copy it, or open the same page a friend would land on. Share-sheet
// alone hid the link, which made it hard to test "friend opens this."
// Analytics: never logs the URL or token, only that copy / preview happened.
// ============================================

import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import { copyShareUrl } from './share';

type Props = {
  url: string;
  token: string;
  urlAnalyticsId: string;
  copyAnalyticsId: string;
  previewAnalyticsId: string;
  onCopied: () => void;
};

export function ShareInviteLink({
  url,
  token,
  urlAnalyticsId,
  copyAnalyticsId,
  previewAnalyticsId,
  onCopied
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const ok = await copyShareUrl(url);
    if (ok) {
      setCopied(true);
      onCopied();
    }
  }

  function onPreview() {
    router.push(`/q/${encodeURIComponent(token)}` as Href);
  }

  return (
    <View className="mt-4 rounded-card border border-ink-line bg-surface px-4 py-3">
      <Text className="font-sans-b text-[13px] text-ink">Your invite link</Text>
      <Text className="mt-1 font-sans-sb text-[12px] text-ink-mute">
        A friend can open this, take the quiz with no account, then make an
        account to add you and see how you two line up.
      </Text>
      <AnalyticsRegion
        analyticsId={urlAnalyticsId}
        interactive={false}
        accessibilityLabel="Quiz invite link"
      >
        <Text
          selectable
          className="mt-2 font-sans-sb text-[12px] text-ink"
        >
          {url}
        </Text>
      </AnalyticsRegion>
      <View className="mt-3 flex-row gap-2.5">
        {Platform.OS === 'web' ? (
          <Pressable
            onPress={withAnalyticsPress(copyAnalyticsId, () => void onCopy())}
            accessibilityRole="button"
            accessibilityLabel={copied ? 'Link copied' : 'Copy invite link'}
            className="min-h-[44px] flex-1 items-center justify-center rounded-card border border-ink-line active:opacity-90"
          >
            <Text className="font-sans-sb text-[13px] text-ink">
              {copied ? 'Copied' : 'Copy link'}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={withAnalyticsPress(previewAnalyticsId, onPreview)}
          accessibilityRole="button"
          accessibilityLabel="See the page a friend would see"
          className="min-h-[44px] flex-1 items-center justify-center rounded-card border border-ink-line active:opacity-90"
        >
          <Text className="font-sans-sb text-[13px] text-ink">Preview</Text>
        </Pressable>
      </View>
    </View>
  );
}
