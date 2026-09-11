// ============================================
// WHAT THIS FILE DOES (plain English):
// Paints one New-onboarding screen from the copy deck. Field screens reuse
// the real name / photo / birthday components (photo filters stay ours).
// Teaching screens use the Magic Patterns layouts. Feature tours are pictures
// only. They do not open live sheets. The last join / invite screen is
// CoopStep, rendered by the onboarding room, not here.
// ============================================
import React from 'react';
import { ONBOARDING } from '@bridger/shared';
import type { Tier } from '@bridger/shared';
import type { useOnboarding } from '../../hooks/useOnboarding';
import type { PhotoSource } from '../../data/onboarding';
import { FEATURES, featureById } from './onboarding-new-flow';
import {
  NEW_ONBOARDING_BY_KEY,
  STEP_BRANCH,
  type NewOnboardingStepKey
} from './onboarding-new-copy';
import { NameBothStep } from './NameBothStep';
import { ConfirmProfileStep } from './ConfirmProfileStep';
import { BirthdayStep } from './BirthdayStep';
import { OnboardingExplainerStep } from './OnboardingExplainerStep';
import { OnboardingChoiceStep } from './OnboardingChoiceStep';
import { OnboardingPrivacyPickerStep } from './OnboardingPrivacyPickerStep';
import { ProductPicksStep } from './ProductPicksStep';
import { CoopBenefitsStep } from './CoopBenefitsStep';
import { CONCEPT } from './onboarding-new-flow';
import { newShellFromSpec } from './new-shell';

type Flow = ReturnType<typeof useOnboarding>;

export function NewOnboardingDispatcher({
  flow,
  onPickPhoto
}: {
  flow: Flow;
  onPickPhoto: (s: PhotoSource) => void;
}) {
  const spec = NEW_ONBOARDING_BY_KEY[flow.step as NewOnboardingStepKey];
  const back = flow.index > 0 ? flow.goBack : undefined;
  const { draft, patch, formStep, formTotal, act } = flow;

  if (!spec) return null;

  // THIS SECTION DOES: first + last name on one required screen.
  if (spec.key === 'name') {
    return (
      <NameBothStep
        spec={spec}
        formStep={formStep}
        formTotal={formTotal}
        first={draft.firstName}
        last={draft.lastName}
        onChangeFirst={(v) => patch({ firstName: v })}
        onChangeLast={(v) => patch({ lastName: v })}
        onNext={() => act(spec.primaryCta.action)}
        onBack={back}
      />
    );
  }

  // THIS SECTION DOES: photo square + real looks. Skip is allowed in New.
  if (spec.key === 'photo') {
    const shell = newShellFromSpec(spec, formStep, formTotal);
    return (
      <ConfirmProfileStep
        layout="photo"
        step={shell.step}
        total={shell.total}
        first={draft.firstName}
        last={draft.lastName}
        photoSource={draft.photoSource}
        photoUri={draft.photoUri}
        photoEmoji={draft.photoEmoji}
        photoFilter={draft.photoFilter}
        onChangePhotoFilter={(f) =>
          patch({
            photoFilter: f,
            // Clear any prior bake so Continue re-bakes the newly picked look.
            filteredMediaId: null,
            originalMediaId: null,
            bakedPhotoUri: null
          })
        }
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
        tone={spec.tone}
        accent={CONCEPT[spec.concept].accent}
        conceptLabel={CONCEPT[spec.concept].label}
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
        purpose={spec.chip}
        tone={spec.tone}
        accent={CONCEPT[spec.concept].accent}
        conceptLabel={CONCEPT[spec.concept].label}
      />
    );
  }

  if (spec.key === 'product-picks') {
    return (
      <ProductPicksStep
        spec={spec}
        formStep={formStep}
        formTotal={formTotal}
        selectedIds={draft.helpInterests}
        onToggle={(id) => {
          const list = draft.helpInterests;
          const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
          patch({ helpInterests: next });
        }}
        onNext={() => act(spec.primaryCta.action)}
        onBack={back}
      />
    );
  }

  if (spec.key === 'coop-benefits') {
    return (
      <CoopBenefitsStep
        spec={spec}
        formStep={formStep}
        formTotal={formTotal}
        onNext={() => act(spec.primaryCta.action)}
        onBack={back}
        onDetail={(step) => flow.goto(step)}
      />
    );
  }

  if (spec.archetype === 'privacy-picker') {
    return (
      <OnboardingPrivacyPickerStep
        spec={spec}
        formStep={formStep}
        formTotal={formTotal}
        value={draft.birthdayTier}
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
        : draft.helpInterests;
    const optionId =
      spec.saveId === 'membership-interests'
        ? ONBOARDING.coop.interest_option
        : ONBOARDING.product.option;

    return (
      <OnboardingChoiceStep
        spec={spec}
        formStep={formStep}
        formTotal={formTotal}
        selectedIds={selected}
        optionAnalyticsId={optionId}
        onToggle={(id) => {
          const list =
            spec.saveId === 'membership-interests'
              ? draft.membershipInterests
              : draft.helpInterests;
          const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
          if (spec.saveId === 'membership-interests') patch({ membershipInterests: next });
          else patch({ helpInterests: next });
        }}
        onPrimary={() => act(spec.primaryCta.action)}
        onSecondary={
          spec.secondaryCta ? () => act(spec.secondaryCta!.action) : undefined
        }
        onBack={back}
      />
    );
  }

  const branch = STEP_BRANCH[spec.key];
  const feature = branch ? featureById(branch) : undefined;
  const picked = FEATURES.filter((f) => draft.helpInterests.includes(f.id));
  const lastInTour = Boolean(
    feature && picked.length > 0 && picked[picked.length - 1]!.id === feature.id
  );

  return (
    <OnboardingExplainerStep
      spec={spec}
      formStep={formStep}
      formTotal={formTotal}
      lastInTour={lastInTour}
      onPrimary={() => act(spec.primaryCta.action)}
      onSecondary={
        spec.secondaryCta ? () => act(spec.secondaryCta!.action) : undefined
      }
      onBack={back}
    />
  );
}
