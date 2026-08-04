import React from 'react';
import { CheckIcon, SendIcon } from 'lucide-react';
import {
  ACCENTS,
  Breathe,
  ButtonSecondary,
  Card,
  ColorCard,
  ListRow,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  cn } from
'../../../../packages/ui';
import { MEMBERSHIP, PROPOSALS, SHIPPED, SPEND } from '../../state/coop';

/**
 * The member portal. Members only, and the only thing membership buys that
 * isn't cosmetic: a say in what gets built and a look at the books.
 */
export function CoopPortalScreen({
  onBack,
  onBenefits



}: {onBack?: () => void;onBenefits?: () => void;}) {
  const [proposals, setProposals] = React.useState(PROPOSALS);
  const [feedback, setFeedback] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const toggleVote = (id: string) =>
  setProposals((p) =>
  p.map((x) =>
  x.id === id ?
  { ...x, myVote: !x.myVote, votes: x.votes + (x.myVote ? -1 : 1) } :
  x
  )
  );

  const topVotes = Math.max(...proposals.map((p) => p.votes));

  return (
    <Screen>
      <ScreenHeader title="Member portal" onBack={onBack} hideMessages />
      <ScreenBody>
        <Breathe>
          <ColorCard accent="teal">
            <p className="font-pixel text-[17px] leading-tight text-onaccent">
              You're a member.
            </p>
            <p className="mt-1.5 text-[14px] font-semibold text-onaccent/80">
              Since {MEMBERSHIP.since} · renews {MEMBERSHIP.renews} · {MEMBERSHIP.dues}
            </p>
            <p className="mt-3 border-t border-white/20 pt-3 text-[13px] font-semibold text-onaccent/80">
              {MEMBERSHIP.members.toLocaleString()} members keep this running. One member, one
              vote.
            </p>
          </ColorCard>
        </Breathe>

        {/* the actual say */}
        <Breathe>
          <section>
            <PixelHeading size="md">What we build next</PixelHeading>
            <p className="mb-3 mt-0.5 text-[13px] font-semibold text-ink-mute">
              {proposals[0]?.closes}. The top one goes into the next quarter.
            </p>

            <ul className="space-y-2.5">
              {proposals.map((p, i) => {
                const token = ACCENTS[(['purple', 'teal', 'amber'] as const)[i % 3]];
                const pct = Math.round(p.votes / topVotes * 100);
                return (
                  <li
                    key={p.id}
                    className="rounded-card border border-ink-line bg-white px-4 py-3.5">
                    
                    <p className="text-[15px] font-bold leading-snug text-ink">{p.title}</p>
                    <p className="mt-0.5 text-[13px] font-semibold leading-snug text-ink-mute">
                      {p.line}
                    </p>

                    <span className="mt-2.5 block h-2.5 overflow-hidden rounded-full bg-ink/8">
                      <span
                        className={cn('block h-full rounded-full', token.bg)}
                        style={{ width: `${Math.max(6, pct)}%` }} />
                      
                    </span>

                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <span className="text-[12px] font-bold text-ink-mute">
                        {p.votes.toLocaleString()} votes
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleVote(p.id)}
                        aria-pressed={p.myVote}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors',
                          p.myVote ?
                          cn(token.bg, token.text) :
                          'border border-ink-line bg-surface text-ink hover:bg-[#F1ECFF]'
                        )}>
                        
                        {p.myVote && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3.4} />}
                        {p.myVote ? 'Voted' : 'Vote'}
                      </button>
                    </div>
                  </li>);

              })}
            </ul>
          </section>
        </Breathe>

        {/* open books */}
        <Breathe>
          <section>
            <PixelHeading size="md">Where the money goes</PixelHeading>
            <p className="mb-3 mt-0.5 text-[13px] font-semibold text-ink-mute">
              Every quarter, in full. No advertisers to answer to.
            </p>
            <Card>
              <div
                aria-hidden="true"
                className="mb-4 flex h-3 overflow-hidden rounded-full">
                
                {SPEND.map((s) =>
                <span
                  key={s.label}
                  className={ACCENTS[s.accent].bg}
                  style={{ width: `${s.pct}%` }} />

                )}
              </div>
              <dl className="space-y-2">
                {SPEND.map((s) =>
                <div key={s.label} className="flex items-center gap-2.5">
                    <span
                    aria-hidden="true"
                    className={cn('h-3 w-3 shrink-0 rounded-full', ACCENTS[s.accent].bg)} />
                  
                    <dt className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
                      {s.label}
                    </dt>
                    <dd className="shrink-0 text-[14px] font-bold text-ink-soft">{s.pct}%</dd>
                  </div>
                )}
              </dl>
            </Card>
          </section>
        </Breathe>

        <Breathe>
          <section>
            <PixelHeading size="md">You voted, we built it</PixelHeading>
            <p className="mb-3 mt-0.5 text-[13px] font-semibold text-ink-mute">
              Proof the vote is real.
            </p>
            <ul className="space-y-2">
              {SHIPPED.map((s) =>
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-card border border-ink-line bg-white px-3.5 py-3">
                
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <CheckIcon className="h-4 w-4" strokeWidth={3.4} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold text-ink">
                      {s.title}
                    </span>
                    <span className="block truncate text-[12px] font-semibold text-ink-mute">
                      {s.line}
                    </span>
                  </span>
                </li>
              )}
            </ul>
          </section>
        </Breathe>

        <Breathe>
          <section>
            <PixelHeading size="md">Tell us something</PixelHeading>
            <p className="mb-3 mt-0.5 text-[13px] font-semibold text-ink-mute">
              It goes straight to the people building it.
            </p>
            <Card>
              {sent ?
              <p className="text-[14px] font-semibold text-ink">
                  Sent. Someone will read this, not a bot.
                </p> :

              <>
                  <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What would make Bridger better?"
                  aria-label="Your feedback"
                  className="w-full resize-none rounded-card border border-ink-line bg-surface px-3.5 py-2.5 text-[14px] font-semibold text-ink outline-none placeholder:text-ink-mute" />
                
                  <div className="mt-2.5">
                    <ButtonSecondary
                    full
                    tone="solid"
                    disabled={feedback.trim().length === 0}
                    icon={<SendIcon className="h-4 w-4" strokeWidth={2.5} />}
                    onClick={() => setSent(true)}>
                    
                      Send it
                    </ButtonSecondary>
                  </div>
                </>
              }
            </Card>
          </section>
        </Breathe>

        <Breathe>
          <div className="mt-5 space-y-2.5">
            <ListRow
              label="What membership includes"
              sublabel="Benefits, circles, always-free list"
              trailing="chevron"
              onClick={onBenefits} />
            
            <ListRow
              label="Manage membership"
              sublabel={`Renews ${MEMBERSHIP.renews}`}
              trailing="chevron"
              onClick={() => undefined} />
            
          </div>
        </Breathe>
      </ScreenBody>
    </Screen>);

}