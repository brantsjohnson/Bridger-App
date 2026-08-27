import { useState } from 'react';
import { Card, ColorCard } from '../../../../packages/ui';
import { OnboardingStep } from '../../components/OnboardingStep';

/**
 * Join screen: two honest tiers (Join the co-op / Free Lite).
 * Connecting is always free. "Limited" on Free Lite is expression/scale only.
 * Soft join today; price display matches COOP.md ($72/year, about $6/mo).
 */
export function CoopScreen({
  onJoin,
  onFreeLite
}: {
  onJoin?: () => void;
  onFreeLite?: () => void;
}) {
  const [tier, setTier] = useState<'coop' | 'free_lite' | null>(null);

  return (
    <OnboardingStep
      step={9}
      total={10}
      purpose="It promised free, then made us the product. Here's how Bridger actually stays alive."
      ask="How do you want to join?"
      cta={tier === 'free_lite' ? 'Continue with Free Lite' : 'Join the co-op · about $6/mo'}
      ctaDisabled={!tier}
      accent="coral"
      onContinue={() => {
        if (tier === 'coop') onJoin?.();
        else if (tier === 'free_lite') onFreeLite?.();
      }}>
      <div className="space-y-3">
        <ColorCard accent="teal">
          <p className="text-[15px] font-bold leading-snug">
            Connecting is always free. This is just how Bridger stays alive.
          </p>
        </ColorCard>

        <button
          type="button"
          onClick={() => setTier('coop')}
          className="w-full text-left"
          aria-pressed={tier === 'coop'}>
          <Card className={tier === 'coop' ? 'ring-2 ring-ink' : undefined}>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-mute">
              Join the co-op · $72/year
            </p>
            <ul className="space-y-1.5 text-[14px] font-semibold text-ink">
              <li>Everything unlocked</li>
              <li>Video, bigger circles, keep everything</li>
              <li>Daily recaps</li>
              <li>No ads. You fund it, you own a piece of it.</li>
            </ul>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setTier('free_lite')}
          className="w-full text-left"
          aria-pressed={tier === 'free_lite'}>
          <Card className={tier === 'free_lite' ? 'ring-2 ring-ink' : undefined}>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-mute">
              Free Lite
            </p>
            <p className="text-[14px] font-semibold text-ink">
              Limited use of Bridger, but all the essentials to stay connected are still here. No ads.
              Photos and text, with 30 days of rolling history.
            </p>
          </Card>
        </button>
      </div>
    </OnboardingStep>
  );
}
