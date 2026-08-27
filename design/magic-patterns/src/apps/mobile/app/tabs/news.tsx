// ============================================
// WHAT THIS FILE DOES (plain English):
// The News tab on the bottom pill. For now it is a coming-soon page so the
// tab has a real destination while the feed is still being built.
// ============================================
import { Screen, ScreenBody, ScreenHeader } from '../../../../packages/ui';

export function NewsScreen() {
  return (
    <Screen>
      <ScreenHeader title="News" />
      <ScreenBody>
        <div className="mt-10 flex flex-col items-center gap-2 px-6">
          <span aria-hidden="true" className="text-[40px]">
            🗞️
          </span>
          <p className="text-center text-[16px] font-bold text-ink">
            Gen Z & Local updates coming soon
          </p>
        </div>
      </ScreenBody>
    </Screen>
  );
}
