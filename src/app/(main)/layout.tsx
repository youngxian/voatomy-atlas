import AppShell from '@/components/AppShell';
import TimezonePrompt from '@/components/TimezonePrompt';
import { AuthProvider } from '@/lib/auth';
import { ProjectProvider } from '@/lib/project-context';
import { QueryProvider } from '@/lib/query-provider';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ProjectProvider>
          <AppShell>{children}</AppShell>
        </ProjectProvider>
        <TimezonePrompt />
      </AuthProvider>
    </QueryProvider>
  );
}
