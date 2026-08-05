// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake Home screen showing widget blocks in the order and sizes you set as
// the default layout for everyone.
// ============================================
import type { HomeWidgetDefault, HomeWidgetKey } from '@bridger/shared';

const LABELS: Record<HomeWidgetKey, string> = {
  event: 'This week',
  alerts: 'Notifications',
  ask: 'Ask the group',
  comingup: 'Coming up',
  activity: 'Activity',
  quiz: 'Quiz',
  coop: 'Co-op'
};

type Props = {
  layout: HomeWidgetDefault[];
};

export function HomeLayoutPreview({ layout }: Props) {
  return (
    <div className="flex h-full flex-col bg-canvas px-3 pb-4 pt-8">
      <p className="font-pixel text-xl">Home</p>
      <p className="mt-1 text-xs text-muted">Default layout</p>

      <div className="mt-3 flex flex-wrap gap-2 overflow-y-auto">
        {layout.map((row, i) => (
          <div
            key={`${row.key}-${i}`}
            className={[
              'rounded-xl border border-line bg-surface px-2 py-3 text-center',
              row.size === 'full' ? 'w-full' : 'w-[calc(50%-4px)]'
            ].join(' ')}
          >
            <p className="text-[10px] uppercase tracking-wide text-muted">
              {row.size}
            </p>
            <p className="text-sm font-medium">
              {LABELS[row.key] ?? row.key}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
