// ============================================
// WHAT THIS FILE DOES (plain English):
// One place that lists the five Discover quizzes (Connect Over). Titles are
// what people see; ids are what matching and analytics use.
// ============================================

import { MANIFEST as disclosure } from './disclosure/manifest';
import { MANIFEST as humor } from './humor/manifest';
import { MANIFEST as values } from './values/manifest';
import { MANIFEST as personality } from './personality/manifest';
import { MANIFEST as attachment } from './attachment/manifest';

export { DisclosureFlow } from './disclosure/DisclosureFlow';
export { DISCLOSURE_ADAPTATION_POLICY } from './disclosure/moderator';
export { PersonalityFlow } from './personality/PersonalityFlow';
export { scorePersonality } from './personality/score';
export { PERSONALITY_ADAPTATION_POLICY } from './personality/moderator';
export { AttachmentFlow } from './attachment/AttachmentFlow';
export { scoreAttachment } from './attachment/score';
export { ATTACHMENT_ADAPTATION_POLICY } from './attachment/moderator';
export { attachmentMatchScore } from './attachment/dimensions';
export { ValuesFlow } from './values/ValuesFlow';
export { scoreValues } from './values/score';
export { VALUES_ADAPTATION_POLICY } from './values/moderator';
export { DISCOVER_ADAPT_BELOW, adaptationPolicyFor } from './_shared/thresholds';

/** The live Discover set: pre-quiz + four measurement quizzes. */
export const DISCOVER_QUIZ_MANIFESTS = [
  disclosure,
  humor,
  values,
  personality,
  attachment
] as const;

export type DiscoverQuizManifest = (typeof DISCOVER_QUIZ_MANIFESTS)[number];

export {
  disclosure as DISCLOSURE_MANIFEST,
  humor as HUMOR_MANIFEST,
  values as VALUES_MANIFEST,
  personality as PERSONALITY_MANIFEST,
  attachment as ATTACHMENT_MANIFEST
};
