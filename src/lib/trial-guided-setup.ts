/** Persisted when the user finishes the Pro trial guided setup (wizard or checklist). */
export const TRIAL_GUIDED_COMPLETE_KEY = 'atlas_trial_guided_complete_v1';

export const TRIAL_GUIDED_UPDATED_EVENT = 'atlas-trial-guided-updated';

export function readTrialGuidedComplete(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(TRIAL_GUIDED_COMPLETE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Alias for call sites that read completion as a predicate. */
export const isTrialGuidedComplete = readTrialGuidedComplete;

export function setTrialGuidedComplete() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRIAL_GUIDED_COMPLETE_KEY, 'true');
    window.dispatchEvent(new CustomEvent(TRIAL_GUIDED_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}
