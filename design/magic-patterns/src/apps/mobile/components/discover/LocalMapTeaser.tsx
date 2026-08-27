// ============================================
// WHAT THIS FILE DOES (plain English):
// Magic Patterns version of the Discover "Local map · Coming soon" teaser.
// Tiny friend-radar preview under People to meet. Not live yet.
// ============================================
import { Badge, PixelHeading, cn } from '../../../../packages/ui';

const PINS: Array<{
  id: string;
  label: string;
  left: string;
  top: string;
  color: string;
  you?: boolean;
}> = [
  { id: 'you', label: 'You', left: '46%', top: '42%', color: '#F5C518', you: true },
  { id: 'a', label: 'K', left: '22%', top: '28%', color: '#7C6CFF' },
  { id: 'b', label: 'J', left: '68%', top: '24%', color: '#00A676' },
  { id: 'c', label: 'N', left: '74%', top: '58%', color: '#FF6B4A' },
  { id: 'd', label: 'M', left: '18%', top: '62%', color: '#3B82F6' }
];

export function LocalMapTeaser() {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-2">
        <PixelHeading size="md" className="min-w-0 flex-1">
          Local map
        </PixelHeading>
        <Badge tone="nearby">Coming soon</Badge>
      </div>

      <div
        aria-label="Local map coming soon. See friends nearby when they opt in."
        className="overflow-hidden rounded-card border border-ink-line bg-white"
      >
        <div
          className="relative h-[168px] bg-[#E8F0FF]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(28,27,22,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,27,22,0.15) 1px, transparent 1px)',
            backgroundSize: '44px 24px'
          }}
        >
          <div
            aria-hidden
            className="absolute left-6 top-5 h-12 w-16 rounded-2xl bg-[#B8E0C8]/70"
          />
          <div
            aria-hidden
            className="absolute bottom-6 right-8 h-10 w-20 rounded-2xl bg-[#C9D4FF]/80"
          />

          {PINS.map((pin) => (
            <div
              key={pin.id}
              aria-hidden
              className="absolute flex flex-col items-center"
              style={{ left: pin.left, top: pin.top }}
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-full border-2 border-white font-bold text-white',
                  pin.you ? 'h-11 w-11 text-[11px]' : 'h-8 w-8 text-[12px]'
                )}
                style={{ backgroundColor: pin.color }}
              >
                {pin.you ? '★' : pin.label}
              </div>
              {pin.you ? (
                <span className="mt-0.5 text-[10px] font-bold text-ink">You</span>
              ) : null}
            </div>
          ))}

          <div aria-hidden className="absolute inset-0 bg-white/25" />
        </div>

        <div className="border-t border-ink-line px-4 py-3">
          <p className="text-[15px] font-bold tracking-tight text-ink">
            Friend radar for your city
          </p>
          <p className="mt-0.5 text-[13px] font-semibold leading-snug text-ink-soft">
            See friends nearby when they choose to share. Coming soon.
          </p>
        </div>
      </div>
    </section>
  );
}
