'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { getProject, getProjectAccess } from '@/lib/api';

function InvitedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');

  const [projectName, setProjectName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setError('Missing project');
      setLoading(false);
      return;
    }

    Promise.all([
      getProject(projectId).then((p) => p.name),
      getProjectAccess(projectId).then((r) => r.role),
    ])
      .then(([name, r]) => {
        setProjectName(name);
        setRole(r.charAt(0).toUpperCase() + r.slice(1).toLowerCase());
      })
      .catch(() => setError('Failed to load project details'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleContinue = () => {
    if (projectId) {
      router.push(`/dashboard?project=${projectId}&from=invite`);
    } else {
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#f16e2c]/10 border border-[#f16e2c]/20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#f16e2c] animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !projectId) {
    return (
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-[#ef4444] text-sm mb-4">{error ?? 'Invalid invitation link'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 rounded-xl bg-[#f16e2c] text-white font-semibold hover:bg-[#c85a22] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-[#22c55e]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          You&apos;ve been added to the team
        </h1>
        <p className="text-[#8b8ba0] text-base mb-8">
          Welcome! You now have access to <span className="font-semibold text-[#e8e8ed]">{projectName ?? 'the project'}</span> as a <span className="font-semibold text-[#e8e8ed]">{role ?? 'Member'}</span>.
        </p>
        <p className="text-sm text-[#6b6b80] mb-8 max-w-sm">
          Jump into the project dashboard to view sprints, tickets, and start collaborating with your team.
        </p>
        <button
          onClick={handleContinue}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#f16e2c] text-white font-semibold hover:bg-[#c85a22] transition-colors shadow-lg shadow-[#f16e2c]/20"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function InvitedWelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-4">
          <div className="w-16 h-16 rounded-2xl bg-[#f16e2c]/10 border border-[#f16e2c]/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#f16e2c] animate-spin" />
          </div>
        </div>
      }
    >
      <InvitedContent />
    </Suspense>
  );
}
