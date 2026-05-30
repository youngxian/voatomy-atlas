/**
 * Onboarding layout — retained as a pass-through.
 * All onboarding is now handled by the unified Voatomy onboarding at /onboard.
 * Individual sub-pages redirect to /dashboard.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
