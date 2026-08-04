// ============================================
// WHAT THIS FILE DOES (plain English):
// The full "Connect Over" screen. Tapping "See more" on Discover lands here and
// shows every private module as a colored card. It reuses the same MatchModules
// component (with the header off, since the screen already titles itself), so
// the cards and the open-a-module flow behave exactly like the Discover preview.
// This is its own analytics screen ("connect_over").
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
        title="Connect Over"
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
