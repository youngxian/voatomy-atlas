import { redirect } from 'next/navigation';

/**
 * Repo connection is handled by the unified Voatomy onboarding.
 * See: voatomy-landing/docs/onboarding/02-connect-repo.md
 */
export default function RepoConnectionPage() {
  redirect('/dashboard');
}
