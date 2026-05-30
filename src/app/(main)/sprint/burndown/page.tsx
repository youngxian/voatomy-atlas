'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { type ChartConfig } from '@/components/ui/chart';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth';
import {
  type SprintTicket,
  sprintTickets,
  burndownData,
  totalPoints,
  completedPoints,
  todayIndex,
  mapTicketStatus,
  AVATAR_COLORS,
  buildDayData,
} from '@/lib/burndown-mock';
import { BurndownHeader } from '@/components/burndown/BurndownHeader';
import { BurndownKPIs } from '@/components/burndown/BurndownKPIs';
import { BurndownChart } from '@/components/burndown/BurndownChart';
import { DailyProgressTable } from '@/components/burndown/DailyProgressTable';
import { SprintScopeSection } from '@/components/burndown/SprintScopeSection';
import { VelocityCard } from '@/components/burndown/VelocityCard';
import { RiskIndicators } from '@/components/burndown/RiskIndicators';
import { AtlasPrediction } from '@/components/burndown/AtlasPrediction';

export default function SprintBurndownPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProjectId, activeSprint: ctxSprint } = useProject();
  const { isDemo: authDemo } = useAuth();
  const [enrichedData, setEnrichedData] = useState<atlas.EnrichedBurndownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [sprints, setSprints] = useState<atlas.Sprint[]>([]);

  // Resolve sprint: URL param > context active sprint
  const urlSprintId = searchParams.get('sprint');
  const sprintId = urlSprintId || ctxSprint?.id;

  const fetchBurndown = useCallback(async (projectId: string, sid: string) => {
    try {
      let data = await atlas.getEnrichedBurndown(projectId, sid);
      if (data?.tickets?.length && (!data.snapshots || data.snapshots.length === 0)) {
        await atlas.recordBurndownSnapshot(projectId, sid);
        data = await atlas.getEnrichedBurndown(projectId, sid);
      }
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (authDemo) {
      setIsDemo(true);
      setLoading(false);
      return;
    }
    if (!activeProjectId) {
      setIsDemo(true);
      setLoading(false);
      return;
    }
    atlas.getSprints(activeProjectId).then(setSprints).catch((err) => console.error('Failed to load sprints', err));
  }, [activeProjectId, authDemo]);

  useEffect(() => {
    if (authDemo || !activeProjectId) return;
    if (!sprintId) {
      setIsDemo(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setIsDemo(false);
    setEnrichedData(null);

    fetchBurndown(activeProjectId, sprintId)
      .then((data) => {
        if (data) {
          setEnrichedData(data);
          setIsDemo(false);
        } else {
          setIsDemo(true);
        }
      })
      .catch(() => setIsDemo(true))
      .finally(() => setLoading(false));
  }, [activeProjectId, sprintId, authDemo, fetchBurndown]);

  const handleSprintChange = useCallback(
    (sprintId: string) => {
      if (sprintId) {
        const url = new URL(window.location.href);
        url.searchParams.set('sprint', sprintId);
        router.push(url.pathname + url.search);
      } else {
        const url = new URL(window.location.href);
        url.searchParams.delete('sprint');
        router.push(url.pathname + (url.search || ''));
      }
    },
    [router]
  );

  const apiTickets: SprintTicket[] = enrichedData
    ? enrichedData.tickets.map((t, i) => {
        const status = mapTicketStatus(t.ticket_status);
        const assignee = t.assignee_name && !/^[0-9a-f-]{36}$/i.test(t.assignee_name)
          ? t.assignee_name
          : 'Unassigned';
        const assigneeInitials = assignee === 'Unassigned' ? '—' : assignee.slice(0, 2).toUpperCase();
        return {
          id: t.external_id || t.ticket_id,
          title: t.title || 'Untitled',
          points: t.planned_points ?? 0,
          assignee,
          assigneeInitials,
          avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
          status,
          confidence: status === 'done' ? 100 : status === 'in_progress' ? 75 : 50,
          module: t.module || t.labels?.[0] || '',
        };
      })
    : [];

  const activeTickets = isDemo ? sprintTickets : apiTickets;
  const { days: activeBurndownData, todayIdx: activeTodayIndex } = enrichedData
    ? buildDayData(enrichedData.snapshots, {
        start_date: enrichedData.start_date,
        end_date: enrichedData.end_date,
        total_points: enrichedData.total_points,
        completed_points: enrichedData.completed_points,
      })
    : { days: burndownData, todayIdx: todayIndex };

  const activeTotalPoints = isDemo ? totalPoints : (enrichedData?.total_points ?? totalPoints);
  const activeCompletedPoints = isDemo ? completedPoints : (enrichedData?.completed_points ?? completedPoints);
  const sprintName = enrichedData?.sprint_name ?? (isDemo ? 'Sprint 25' : 'Sprint');
  const sprintStartDate = enrichedData?.start_date ?? (isDemo ? '2025-02-17' : undefined);
  const sprintEndDate = enrichedData?.end_date ?? (isDemo ? '2025-02-28' : undefined);
  const sprintTotalDays = activeBurndownData.length || 10;

  const completionPct = activeTotalPoints > 0 ? Math.round((activeCompletedPoints / activeTotalPoints) * 100) : 0;

  const rechartsData = activeBurndownData.map((d, i) => {
    const ideal = activeTotalPoints - (activeTotalPoints / Math.max(sprintTotalDays - 1, 1)) * i;
    const isActual = d.isPast || d.isToday;
    const isProjected = !d.isPast;
    return {
      date: d.date,
      day: d.day,
      ideal: Math.round(ideal),
      actual: isActual ? d.remaining : undefined,
      projected: isProjected ? d.remaining : undefined,
      isToday: d.isToday,
    };
  });

  const chartConfig: ChartConfig = {
    actual: { label: 'Actual', color: 'var(--primary)' },
    projected: { label: 'Projected', color: 'var(--success)' },
    ideal: { label: 'Ideal', color: 'var(--muted-foreground)' },
  };

  const doneTickets = activeTickets.filter(t => t.status === 'done');
  const ipTickets = activeTickets.filter(t => t.status === 'in_progress');
  const todoTickets = activeTickets.filter(t => t.status === 'todo');
  const blockedTickets = activeTickets.filter(t => t.status === 'blocked');

  const safeTodayIndex = Math.max(activeTodayIndex, 1);
  const actualVelocity = activeCompletedPoints / safeTodayIndex;
  const plannedVelocity = activeTotalPoints / Math.max(sprintTotalDays, 1);
  const forecastPts = Math.round(actualVelocity * sprintTotalDays);
  const daysLeft = sprintTotalDays - activeTodayIndex;

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {isDemo && (
        <div className="px-3 py-1.5 bg-warning/10 border border-warning/20 rounded-lg text-xs text-warning flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> Demo mode — showing sample data. Connect a sprint to see real burndown.
        </div>
      )}

      {!isDemo && sprints.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="burndown-sprint" className="text-xs font-medium text-muted-foreground">
            Sprint
          </label>
          <select
            id="burndown-sprint"
            value={sprintId ?? ''}
            onChange={(e) => handleSprintChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {(() => {
              const inList = sprintId && sprints.some((s) => s.id === sprintId);
              const options =
                !inList && sprintId && enrichedData?.sprint_name
                  ? [{ id: sprintId, name: enrichedData.sprint_name }, ...sprints]
                  : sprints;
              return options.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ));
            })()}
          </select>
        </div>
      )}

      <BurndownHeader
        sprintName={sprintName}
        completionPct={completionPct}
        activeCompletedPoints={activeCompletedPoints}
        activeTotalPoints={activeTotalPoints}
        activeTodayIndex={activeTodayIndex}
        sprintTotalDays={sprintTotalDays}
        sprintStartDate={sprintStartDate}
        sprintEndDate={sprintEndDate}
        activeTickets={activeTickets}
        blockedTickets={blockedTickets}
        isDemo={isDemo}
        formatDate={formatDate}
      />

      <BurndownKPIs
        completionPct={completionPct}
        activeCompletedPoints={activeCompletedPoints}
        activeTotalPoints={activeTotalPoints}
        actualVelocity={actualVelocity}
        plannedVelocity={plannedVelocity}
        forecastPts={forecastPts}
        daysLeft={daysLeft}
      />

      <BurndownChart
        rechartsData={rechartsData}
        chartConfig={chartConfig}
        activeBurndownData={activeBurndownData}
        activeTodayIndex={activeTodayIndex}
        activeTotalPoints={activeTotalPoints}
        activeCompletedPoints={activeCompletedPoints}
        forecastPts={forecastPts}
        actualVelocity={actualVelocity}
      />

      <DailyProgressTable activeBurndownData={activeBurndownData} />

      <SprintScopeSection
        activeTickets={activeTickets}
        activeCompletedPoints={activeCompletedPoints}
        activeTotalPoints={activeTotalPoints}
        completionPct={completionPct}
        doneTickets={doneTickets}
        ipTickets={ipTickets}
        todoTickets={todoTickets}
        blockedTickets={blockedTickets}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VelocityCard
          plannedVelocity={plannedVelocity}
          actualVelocity={actualVelocity}
          activeTotalPoints={activeTotalPoints}
          activeCompletedPoints={activeCompletedPoints}
          sprintTotalDays={sprintTotalDays}
          safeTodayIndex={safeTodayIndex}
          forecastPts={forecastPts}
        />

        <RiskIndicators
          activeTickets={activeTickets}
          blockedTickets={blockedTickets}
          actualVelocity={actualVelocity}
          plannedVelocity={plannedVelocity}
        />
      </div>

      <AtlasPrediction
        activeTickets={activeTickets}
        forecastPts={forecastPts}
        activeTotalPoints={activeTotalPoints}
        completionPct={completionPct}
      />
    </div>
  );
}
