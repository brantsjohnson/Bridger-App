// ============================================
// WHAT THIS FILE DOES (plain English):
// Paints one New-onboarding screen from the copy deck. Field screens and the
// join / invite surfaces reuse the existing step components. Everything else
// uses the explainer / story / choice / privacy-picker archetypes.
// ============================================
import React from 'react';
import { ONBOARDING, type Tier } from '@bridger/shared';
import type { useOnboarding } from '../../hooks/useOnboarding';
import { NEW_ONBOARDING_BY_KEY, type NewOnboardingStepKey } from './onboarding-new-copy';
import { OnboardingExplainerStep } from './OnboardingExplainerStep';
import { OnboardingStoryCard } from './OnboardingStoryCard';
import { OnboardingChoiceStep } from './OnboardingChoiceStep';
import { OnboardingPrivacyPickerStep } from './OnboardingPrivacyPickerStep';
import { NameFieldStep } from './NameFieldStep';
import { ConfirmProfileStep } from './ConfirmProfileStep';
import { BirthdayStep } from './BirthdayStep';
import { ContactsStep } from './ContactsStep';
import { CoopStep } from './CoopStep';
import type { PhotoSource } from '../../data/onboarding';

type Flow = ReturnType<typeof useOnboarding>;

export function NewOnboardingDispatcher({
  flow,
  onPickPhoto,
  onJoin,
  onRedeem
}: {
  flow: Flow;
  onPickPhoto: (s: PhotoSource) => void;
  onJoin: (
    method: 'apple' | 'google' | 'card',
    plan: 'monthly' | 'yearly'
  ) => void | Promise<void>;
  onRedeem: (code: string) => Promise<void>;
}) {
  const spec = NEW_ONBOARDING_BY_KEY[flow.step as NewOnboardingStepKey];
  const back = flow.index > 0 ? flow.goBack : undefined;
  const { draft, patch, formStep, formTotal, act } = flow;

  if (!spec) return null;

  // THIS SECTION DOES: first name / last name as their own required screens.
  if (spec.key === 'first-name') {
    return (
      <NameFieldStep
        step={formStep}
        total={formTotal}
        which="first"
        header={spec.header}
        subheader={spec.subheader ?? ''}
        value={draft.firstName}
        ctaLabel={spec.primaryCta.label}
        continueAnalyticsId={spec.primaryCta.analyticsId}
        onChange={(v) => patch({ firstName: v })}
        onNext={() => act(spec.primaryCta.action)}
        onBack={back}
      />
    );
  }

  if (spec.key === 'last-name') {
    return (
      <NameFieldStep
        step={formStep}
        total={formTotal}
        which="last"
        header={spec.header}
        subheader={spec.subheader ?? ''}
        value={draft.lastName}
        ctaLabel={spec.primaryCta.label}
        continueAnalyticsId={spec.primaryCta.analyticsId}
        onChange={(v) => patch({ lastName: v })}
        onNext={() => act(spec.primaryCta.action)}
        onBack={back}
      />
    );
  }

  // THIS SECTION DOES: photo square + looks. Skip is allowed in New.
  if (spec.key === 'photo') {
    return (
      <ConfirmProfileStep
        layout="photo"
        step={formStep}
        total={formTotal}
        first={draft.firstName}
        last={draft.lastName}
        photoSource={draft.photoSource}
        photoUri={draft.photoUri}
        photoEmoji={draft.photoEmoji}
        photoFilter={draft.photoFilter}
        onChangePhotoFilter={(f) => patch({ photoFilter: f })}
        onFilteredBakeChange={(bake) =>
          patch({
            filteredMediaId: bake?.mediaId ?? null,
            originalMediaId: bake?.originalMediaId ?? null,
            bakedPhotoUri: bake?.previewUrl ?? null
          })
        }
        onChangeFirst={(v) => patch({ firstName: v })}
        onChangeLast={(v) => patch({ lastName: v })}
        onPickPhoto={onPickPhoto}
        ask={spec.header}
        blurb={spec.subheader}
        cta={spec.primaryCta.label}
        skipLabel={spec.secondaryCta?.label}
        onSkip={() => spec.secondaryCta && act(spec.secondaryCta.action)}
        onNext={() => act(spec.primaryCta.action)}
        onBack={back ?? (() => {})}
      />
    );
  }

  if (spec.key === 'birthday') {
    return (
      <BirthdayStep
        step={formStep}
        total={formTotal}
        value={draft.birthday}
        onChange={(v) => patch({ birthday: v })}
        onNext={() => act(spec.primaryCta.action)}
        onBack={back ?? (() => {})}
        ask={spec.header}
        blurb={spec.subheader}
        cta={spec.primaryCta.label}
        continueAnalyticsId={spec.primaryCta.analyticsId}
      />
    );
  }

  // THIS SECTION DOES: optional membership join. Paying finishes. Free skip
  // keeps walking the product tour.
  if (spec.key === 'coop-join') {
    return (
      <CoopStep
        step={formStep}
        total={formTotal}
        inviteMode="hidden"
        invitesSent={draft.inviteSlots.filter((s) => s.sent).length}
        onInviteRecorded={() => undefined}
        onJoin={onJoin}
        onInvitesComplete={() => flow.goto('product-1')}
        onContinueFree={() => flow.goto('product-1')}
        onRedeem={onRedeem}
        onBack={back ?? (() => {})}
      />
    );
  }

  // THIS SECTION DOES: invite 3 friends, then continue into the product tour.
  if (spec.key === 'free-1') {
    return (
      <ContactsStep
        step={formStep}
        total={formTotal}
        synced={draft.contactsSynced}
        slots={draft.inviteSlots}
        ask={spec.header}
        purpose="Invite people you actually want on Bridger."
        blurb={spec.subheader}
        onSynced={() => patch({ contactsSynced: true })}
        onFillSlot={(index, slot) => {
          const next = draft.inviteSlots.map((s, i) => (i === index ? slot : s));
          patch({
            inviteSlots: next,
            invited: next.some((s) => s.sent)
          });
        }}
        onNext={() => flow.goto('product-1')}
        onSkip={() => flow.goto('product-1')}
        onBack={back ?? (() => {})}
      />
    );
  }

  const visualCaption =
    spec.key === 'privacy-4' && draft.birthdayTier
      ? draft.birthdayTier === 'close'
        ? 'Visible to Close Friends'
        : draft.birthdayTier === 'acquaintance'
          ? 'Visible to Acquaintances (and closer groups)'
          : 'Visible to Friends (and Close Friends)'
      : undefined;

  if (spec.archetype === 'privacy-picker') {
    return (
      <OnboardingPrivacyPickerStep
        step={formStep}
        total={formTotal}
        chip={spec.chip}
        header={spec.header}
        subheader={spec.subheader}
        visualId={spec.visualId}
        options={spec.options ?? []}
        value={draft.birthdayTier}
        primaryCta={spec.primaryCta}
        onChange={(tier: Tier) => patch({ birthdayTier: tier })}
        onPrimary={() => act(spec.primaryCta.action)}
        onBack={back}
      />
    );
  }

  if (spec.archetype === 'choice') {
    const selected =
      spec.saveId === 'membership-interests'
        ? draft.membershipInterests
        : spec.saveId === 'help-interests'
          ? draft.helpInterests
          : spec.saveId === 'page-authoring'
            ? draft.pageAuthoring
              ? [draft.pageAuthoring]
              : []
            : [];
    const optionId =
      spec.saveId === 'membership-interests'
        ? ONBOARDING.coop.interest_option
        : spec.saveId === 'help-interests'
          ? ONBOARDING.product.option
          : ONBOARDING.memories.option;

    const onToggle = (id: string) => {
      if (spec.saveId === 'page-authoring') {
        patch({ pageAuthoring: id as 'auto' | 'manual' | 'assist' });
        return;
      }
      if (!spec.multiSelect) {
        if (spec.saveId === 'membership-interests') patch({ membershipInterests: [id] });
        else if (spec.saveId === 'help-interests') patch({ helpInterests: [id] });
        return;
      }
      const list =
        spec.saveId === 'membership-interests'
          ? draft.membershipInterests
          : draft.helpInterests;
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      if (spec.saveId === 'membership-interests') patch({ membershipInterests: next });
      else patch({ helpInterests: next });
    };

    return (
      <OnboardingChoiceStep
        step={formStep}
        total={formTotal}
        chip={spec.chip}
        header={spec.header}
        subheader={spec.subheader}
        kicker={spec.kicker}
        visualId={spec.visualId}
        options={spec.options ?? []}
        selectedIds={selected}
        multiSelect={spec.multiSelect}
        allowEmpty={spec.allowEmpty}
        optionAnalyticsId={optionId}
        primaryCta={spec.primaryCta}
        secondaryCta={spec.secondaryCta}
        onToggle={onToggle}
        onPrimary={() => act(spec.primaryCta.action)}
        onSecondary={
          spec.secondaryCta ? () => act(spec.secondaryCta!.action) : undefined
        }
        onBack={back}
      />
    );
  }

  if (spec.archetype === 'story') {
    return (
      <OnboardingStoryCard
        step={formStep}
        total={formTotal}
        chip={spec.chip}
        header={spec.header}
        subheader={spec.subheader}
        visualId={spec.visualId}
        visualCaption={visualCaption}
        autoAdvanceMs={spec.autoAdvanceMs}
        primaryCta={spec.primaryCta}
        onPrimary={() => act(spec.primaryCta.action)}
        onBack={back}
      />
    );
  }

  return (
    <OnboardingExplainerStep
      step={formStep}
      total={formTotal}
      chip={spec.chip}
      header={spec.header}
      subheader={spec.subheader}
      kicker={spec.kicker}
      visualId={spec.visualId}
      visualCaption={visualCaption}
      primaryCta={spec.primaryCta}
      secondaryCta={spec.secondaryCta}
      onPrimary={() => act(spec.primaryCta.action)}
      onSecondary={
        spec.secondaryCta ? () => act(spec.secondaryCta!.action) : undefined
      }
      onBack={back}
    />
  );
}
