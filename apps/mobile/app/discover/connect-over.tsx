// ============================================
// WHAT THIS FILE DOES (plain English):
// The full Personality quizzes screen. Tapping "See more" on Discover lands
// here. Analytics screen stays "connect_over" so old events still resolve.
// ============================================
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { CONNECT_OVER, openSurface } from '@bridger/shared';
import { Screen, ScreenBody, ScreenHeader } from '@bridger/ui';
import { MatchModules } from '../../components/discover/MatchModules';
import { useDiscover } from '../../hooks/useDiscover';

export default function ConnectOverScreen() {
  const router = useRouter();
  const { modules, completedModuleIds, onCompleteModule } = useDiscover();

  // Mark this as its own analytics screen (came from Discover).
  useEffect(() => {
    openSurface('connect_over', 'discover');
  }, []);

  return (
    <Screen tone="synth">
      <ScreenHeader
        title="Personality quizzes"
        onBack={() => router.back()}
        hideProfile
        titleAnalyticsId={CONNECT_OVER.list.page_title}
        backAnalyticsId={CONNECT_OVER.list.back}
      />

      <ScreenBody>
        <MatchModules
          modules={modules}
          completedIds={completedModuleIds}
          onComplete={onCompleteModule}
          showHeader={false}
          tileAnalyticsId={CONNECT_OVER.list.module_tile}
        />
      </ScreenBody>
    </Screen>
  );
}
