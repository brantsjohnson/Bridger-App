// ============================================
// WHAT THIS FILE DOES (plain English):
// The lasting home for quizzes you already took. Home may rotate the featured
// quiz, but Profile still shows your first J-name result so you can open it,
// share it, or retake it for fun a year later. Discover quizzes you finished
// also show here (Done) so you can find them again, even though their scores
// stay private for matching.
// ============================================
import React, { useCallback, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { PROFILE, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonSecondary,
  withAnalyticsPress
} from '@bridger/ui';
import { getCanonicalJnamePreview, listArchivedQuizzes } from '../../data/quiz';
import { listCompletedModules } from '../../data/discover';
import { fetchJnameMyResult, getJnameShareLink } from '../../lib/jname-api';
import { isDemoMode } from '../../lib/demo';
import { ShareInviteLink } from '../../quizzes/what-j-name/ShareInviteLink';
import { visibleShareUrl } from '../../quizzes/what-j-name/share';
import { DISCOVER_QUIZ_MANIFESTS } from '../../quizzes/discover';

type TakenJname = { jName: string; percent: number };

export function ProfileQuizzes() {
  const router = useRouter();
  const [taken, setTaken] = useState<TakenJname | null>(null);
  const [shareInvite, setShareInvite] = useState<{ token: string; url: string } | null>(
    null
  );
  const [untaken, setUntaken] = useState<
    Array<{ slug: string; title: string; friendsTakenCount: number }>
  >([]);
  const [discoverDone, setDiscoverDone] = useState<
    Array<{ id: string; title: string }>
  >([]);

  // THIS SECTION DOES: reload when you come back from the quiz so a new
  // first result shows up without leaving Profile.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const preview = getCanonicalJnamePreview();
        const saved = preview ? null : await fetchJnameMyResult();
        const next =
          preview ?? (saved?.jName ? { jName: saved.jName, percent: saved.percent } : null);
        if (!cancelled) setTaken(next);
        if (next) {
          const share = await getJnameShareLink();
          if (!cancelled && share?.token) {
            setShareInvite({
              token: share.token,
              url: visibleShareUrl(share.token, share.url)
            });
          }
        }
        try {
          const rows = await listArchivedQuizzes();
          if (!cancelled) {
            setUntaken(next ? rows.filter((q) => q.slug !== 'what-j-name') : rows);
          }
        } catch {
          if (!cancelled) setUntaken([]);
        }
        // Discover personality quizzes finished (private scores, visible Done list).
        try {
          const doneIds = await listCompletedModules();
          if (!cancelled) {
            setDiscoverDone(
              DISCOVER_QUIZ_MANIFESTS.filter((m) => doneIds.includes(m.id)).map((m) => ({
                id: m.id,
                title: m.title
              }))
            );
          }
        } catch {
          if (!cancelled) setDiscoverDone([]);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const openResult = () => {
    router.push('/quiz/what-j-name' as Href);
  };

  const openRetake = () => {
    router.push({ pathname: '/quiz/[slug]', params: { slug: 'what-j-name', retake: '1' } });
  };

  const shareResult = async () => {
    if (!taken) return;
    let url = shareInvite?.url;
    if (!isDemoMode()) {
      try {
        const share = await getJnameShareLink();
        if (share?.token) {
          url = visibleShareUrl(share.token, share.url);
          setShareInvite({ token: share.token, url });
        }
      } catch {
        // keep the URL we already have
      }
    }
    if (!url) return;
    const result = await Share.share({
      message: `I'm ${taken.jName} on Bridger. Which J are you? ${url}`
    });
    if (result.action === Share.sharedAction) {
      trackProduct('quiz_shared', {
        surface: 'profile',
        quiz_id: 'what-j-name',
        method: 'link'
      });
    }
  };

  if (!taken && untaken.length === 0 && discoverDone.length === 0) return null;

  return (
    <View className="mt-6 px-4">
      {taken || discoverDone.length > 0 ? (
        <View className="mb-5">
          <AnalyticsRegion
            analyticsId={PROFILE.quizzes.section_header}
            interactive={false}
            accessibilityRole="header"
          >
            <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
              Your quizzes
            </Text>
          </AnalyticsRegion>
          <View className="gap-2">
            {taken ? (
              <View className="rounded-card border border-ink-line bg-surface px-4 py-4">
                <AnalyticsRegion
                  analyticsId={PROFILE.quizzes.taken_row}
                  interactive={false}
                  accessibilityLabel={`Which J name are you. You got ${taken.jName}, ${taken.percent} percent.`}
                >
                  <Text className="font-sans-b text-[14px] text-ink">
                    Which &quot;J&quot; name are you?
                  </Text>
                  <Text className="mt-1 font-pixel text-[20px] text-ink">{taken.jName}</Text>
                  <Text className="mt-0.5 font-sans-sb text-[12px] text-ink-mute">
                    {taken.percent}% match
                  </Text>
                </AnalyticsRegion>
                <View className="mt-3 flex-row gap-2.5">
                  <View className="flex-1">
                    <ButtonSecondary
                      full
                      size="sm"
                      onPress={openResult}
                      analyticsId={PROFILE.quizzes.see_result}
                      accessibilityLabel="See your quiz result"
                    >
                      See your result
                    </ButtonSecondary>
                  </View>
                  <View className="flex-1">
                    <ButtonSecondary
                      full
                      size="sm"
                      onPress={() => void shareResult()}
                      analyticsId={PROFILE.quizzes.share}
                      accessibilityLabel="Share this quiz with a friend"
                    >
                      Share
                    </ButtonSecondary>
                  </View>
                </View>
                {shareInvite ? (
                  <ShareInviteLink
                    url={shareInvite.url}
                    token={shareInvite.token}
                    urlAnalyticsId={PROFILE.quizzes.share_url}
                    copyAnalyticsId={PROFILE.quizzes.copy_link}
                    previewAnalyticsId={PROFILE.quizzes.preview_link}
                    onCopied={() =>
                      trackProduct('quiz_shared', {
                        surface: 'profile',
                        quiz_id: 'what-j-name',
                        method: 'copy'
                      })
                    }
                  />
                ) : null}
                <Pressable
                  onPress={withAnalyticsPress(PROFILE.quizzes.retake, openRetake)}
                  accessibilityRole="button"
                  accessibilityLabel="Retake this quiz for fun"
                  className="mt-2 min-h-[44px] items-center justify-center"
                >
                  <Text className="font-sans-sb text-[12px] text-ink-mute underline">
                    Retake for fun
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {discoverDone.map((q) => (
              <Pressable
                key={q.id}
                onPress={withAnalyticsPress(PROFILE.quizzes.taken_row, () =>
                  // Discover quizzes live on the Discover tab (inline flows), not /quiz/.
                  router.push('/(tabs)/discover' as Href)
                )}
                accessibilityRole="button"
                accessibilityLabel={`${q.title}. Done. Open Discover to review.`}
                className="min-h-[52px] flex-row items-center justify-between rounded-card border border-ink-line bg-surface px-4 py-3 active:opacity-90"
              >
                <Text
                  className="min-w-0 flex-1 font-sans-b text-[14px] text-ink"
                  numberOfLines={1}
                >
                  {q.title}
                </Text>
                <Text className="ml-3 font-sans-sb text-[12px] text-ink-mute">Done</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {untaken.length > 0 ? (
        <View>
          <AnalyticsRegion
            analyticsId={PROFILE.quizzes.section_header}
            interactive={false}
            accessibilityRole="header"
          >
            <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
              Quizzes to catch up on
            </Text>
          </AnalyticsRegion>
          <View className="gap-2">
            {untaken.map((q) => (
              <Pressable
                key={q.slug}
                onPress={withAnalyticsPress(PROFILE.quizzes.untaken_row, () =>
                  router.push(`/quiz/${q.slug}` as Href)
                )}
                accessibilityRole="button"
                accessibilityLabel={`${q.title}. ${q.friendsTakenCount} friends took this`}
                className="min-h-[52px] flex-row items-center justify-between rounded-card border border-ink-line bg-surface px-4 py-3 active:opacity-90"
              >
                <Text
                  className="min-w-0 flex-1 font-sans-b text-[14px] text-ink"
                  numberOfLines={1}
                >
                  {q.title}
                </Text>
                <Text className="ml-3 font-sans-sb text-[12px] text-ink-mute">
                  {q.friendsTakenCount} friends
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
