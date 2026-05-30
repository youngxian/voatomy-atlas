'use client';

import { usePathname } from 'next/navigation';
import { SprintPlanStepper, type SprintPlanStep } from '@/components/SprintPlanStepper';

function pathToStep(pathname: string): SprintPlanStep {
  if (pathname.endsWith('/pushed')) return 'push';
  if (pathname.endsWith('/review')) return 'review';
  if (pathname.endsWith('/processing')) return 'generate';
  return 'configure';
}

export default function SprintPlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = pathToStep(pathname ?? '');

  return (
    <div className="space-y-0">
      <SprintPlanStepper currentStep={currentStep} />
      {children}
    </div>
  );
}
