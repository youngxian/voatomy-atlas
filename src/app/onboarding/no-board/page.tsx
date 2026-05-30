import { redirect } from 'next/navigation';

/**
 * No-board guidance is handled by the unified Voatomy onboarding.
 * See: voatomy-landing/docs/onboarding/09-no-repo-scenarios.md
 */
export default function NoBoardPage() {
  redirect('/dashboard');
}
