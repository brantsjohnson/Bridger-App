// ============================================
// WHAT THIS FILE DOES (plain English):
// Reads and saves the small presentation-only profile style. It stores only
// approved color/background token names, never custom CSS, URLs, profile facts,
// or widget order. Passing null restores the original accessible presentation.
// ============================================
import type { Accent } from "@bridger/shared";
import { apiFetch } from "../lib/api";
import { isDemoMode } from "../lib/demo";

export type ProfileBackground = "default" | "eggshell" | "ink" | "grid";

export type ProfilePresentation = {
  accent: Accent;
  background: ProfileBackground;
};

let demoPresentation: ProfilePresentation | null = null;

export async function getProfilePresentation(): Promise<ProfilePresentation | null> {
  if (isDemoMode()) return demoPresentation ? { ...demoPresentation } : null;
  const settings = await apiFetch<{
    profilePresentation?: ProfilePresentation | null;
  }>("/me/settings");
  return settings.profilePresentation ?? null;
}

export async function saveProfilePresentation(
  presentation: ProfilePresentation | null,
): Promise<ProfilePresentation | null> {
  if (isDemoMode()) {
    demoPresentation = presentation ? { ...presentation } : null;
    return getProfilePresentation();
  }

  const result = await apiFetch<{
    profilePresentation: ProfilePresentation | null;
  }>("/me/settings/presentation", {
    method: "PATCH",
    body: JSON.stringify({ presentation }),
  });
  return result.profilePresentation;
}
