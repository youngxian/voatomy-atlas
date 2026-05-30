'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Video,
  Clock,
  Users,
  FileText,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  LinkIcon,
  MessageSquare,
  ListChecks,
  AlertTriangle,
  Brain,
  RefreshCw,
  X,
  ExternalLink as ExternalLinkIcon,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import { ErrorBanner } from '@/components/ErrorBanner';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

const statusColors: Record<string, 'success' | 'info' | 'muted'> = {
  completed: 'success',
  scheduled: 'info',
  cancelled: 'muted',
};

type View = 'calendar' | 'list';

export default function MeetingsPage() {
  const { activeProjectId } = useProject();
  const [meetings, setMeetings] = useState<atlas.Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [view, setView] = useState<View>('list');
  const [selectedMeeting, setSelectedMeeting] = useState<atlas.Meeting | null>(null);
  const [calMonth, setCalMonth] = useState(() => new Date(2026, 1));
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (!activeProjectId) { setLoading(false); return; }
    setLoading(true);
    atlas.getMeetings(activeProjectId)
      .then(data => setMeetings(data))
      .catch(() => setErrorMsg('Failed to load data. Please try again.'))
      .finally(() => setLoading(false));
  }, [activeProjectId]);

  const calDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calMonth]);

  const meetingsOnDay = (day: number) => {
    const d = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
    return meetings.filter((m) => isSameDay(new Date(m.start_time), d));
  };

  const today = new Date();
  const analysis = selectedMeeting?.notes?.[0]?.ai_analysis;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-8">
        {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => window.location.reload()} onDismiss={() => setErrorMsg(null)} />}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Meetings
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track meetings, take notes, and get AI-powered insights.
              </p>
            </div>
          </div>
        </Reveal>
        <EmptyState
          icon={Calendar}
          title="No meetings yet"
          description="Connect your calendar to sync meetings, or create a new meeting to get started."
          actionLabel="New Meeting"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => window.location.reload()} onDismiss={() => setErrorMsg(null)} />}
      {/* Header */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Meetings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track meetings, take notes, and get AI-powered insights.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Calendar
            </Button>
            <Button variant="primary" size="sm">
              <Plus className="w-3.5 h-3.5" />
              New Meeting
            </Button>
          </div>
        </div>
      </Reveal>

      {/* Stats */}
      <Reveal delay={0.05}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">This Week</p>
                <p className="text-2xl font-bold text-foreground mt-1">{meetings.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Completed</p>
                <p className="text-2xl font-bold text-success mt-1">{meetings.filter((m) => m.status === 'completed').length}</p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">With Notes</p>
                <p className="text-2xl font-bold text-foreground mt-1">{meetings.filter((m) => m.notes && m.notes.length > 0).length}</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <FileText className="w-4 h-4 text-warning" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Linked Tickets</p>
                <p className="text-2xl font-bold text-foreground mt-1">{meetings.reduce((s, m) => s + (m.ticket_links?.length ?? 0), 0)}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <LinkIcon className="w-4 h-4 text-primary" />
              </div>
            </div>
          </Card>
        </div>
      </Reveal>

      {/* View toggle */}
      <Reveal delay={0.1}>
        <div className="flex gap-1 mb-6 bg-card rounded-xl border border-border/60 p-1 w-fit" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {([{ key: 'list', label: 'List', icon: ListChecks }, { key: 'calendar', label: 'Calendar', icon: Calendar }] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-secondary-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="flex gap-6">
        {/* Main content — hidden on mobile when a meeting is selected */}
        <div className={`flex-1 min-w-0 ${selectedMeeting ? 'hidden lg:block' : ''}`}>
          {view === 'list' && (
            <Reveal delay={0.15}>
              <div className="space-y-3">
                {meetings.map((m) => (
                  <Card
                    key={m.id}
                    className={`p-4 cursor-pointer transition-all ${selectedMeeting?.id === m.id ? 'ring-2 ring-primary/40' : ''}`}
                    onClick={() => setSelectedMeeting(m)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${m.status === 'completed' ? 'bg-success/10' : 'bg-primary/10'}`}>
                        <Video className={`w-4 h-4 ${m.status === 'completed' ? 'text-success' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">{m.title}</h3>
                          <Badge variant={statusColors[m.status] ?? 'muted'}>{m.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(m.start_time)} {formatTime(m.start_time)} – {formatTime(m.end_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {m.participants?.length ?? 0}
                          </span>
                          {m.ticket_links && m.ticket_links.length > 0 && (
                            <span className="flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" />
                              {m.ticket_links.length} tickets
                            </span>
                          )}
                          {m.notes && m.notes.length > 0 && (
                            <span className="flex items-center gap-1 text-warning">
                              <FileText className="w-3 h-3" />
                              Notes
                            </span>
                          )}
                          {m.notes?.[0]?.ai_analysis && (
                            <span className="flex items-center gap-1 text-primary">
                              <Sparkles className="w-3 h-3" />
                              AI Analysis
                            </span>
                          )}
                        </div>
                        {m.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{m.description}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Reveal>
          )}

          {view === 'calendar' && (
            <Reveal delay={0.15}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-px bg-border/60 rounded-xl overflow-hidden">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="bg-secondary text-center py-2 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                      {d}
                    </div>
                  ))}
                  {calDays.map((day, i) => {
                    const dayMeetings = day ? meetingsOnDay(day) : [];
                    const isToday = day ? isSameDay(new Date(calMonth.getFullYear(), calMonth.getMonth(), day), today) : false;
                    return (
                      <div
                        key={i}
                        className={`bg-card min-h-[80px] p-1.5 ${day ? 'cursor-pointer hover:bg-secondary/50' : ''} ${isToday ? 'ring-2 ring-inset ring-primary/30' : ''}`}
                      >
                        {day && (
                          <>
                            <span className={`text-[10px] font-medium ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{day}</span>
                            <div className="mt-0.5 space-y-0.5">
                              {dayMeetings.map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => setSelectedMeeting(m)}
                                  className={`w-full text-left px-1 py-0.5 rounded text-[9px] font-medium truncate transition-colors ${
                                    m.status === 'completed'
                                      ? 'bg-success/10 text-success hover:bg-success/20'
                                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                                  }`}
                                >
                                  {m.title}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Reveal>
          )}
        </div>

        {/* Meeting detail slide-over */}
        {selectedMeeting && (
          <Reveal delay={0.1}>
            <div className="w-full lg:w-[420px] shrink-0">
              <Card className="p-0 sticky top-6">
                {/* Mobile back button */}
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="flex items-center gap-1.5 px-4 pt-4 pb-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors lg:hidden"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to meetings
                </button>
                {/* Header */}
                <div className="p-5 border-b border-border/60">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground">{selectedMeeting.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={statusColors[selectedMeeting.status] ?? 'muted'}>{selectedMeeting.status}</Badge>
                        {selectedMeeting.calendar_provider && (
                          <span className="text-[9px] font-bold px-1.5 py-[1px] rounded bg-primary text-white uppercase">{selectedMeeting.calendar_provider}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setSelectedMeeting(null)} className="p-1 rounded-lg hover:bg-secondary text-secondary-foreground hover:text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(selectedMeeting.start_time)} {formatTime(selectedMeeting.start_time)} – {formatTime(selectedMeeting.end_time)}
                    </span>
                  </div>
                </div>

                {/* Participants */}
                {selectedMeeting.participants && selectedMeeting.participants.length > 0 && (
                  <div className="p-4 border-b border-border/60">
                    <h4 className="text-[10px] font-bold text-secondary-foreground uppercase tracking-wider mb-2">Participants</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMeeting.participants.map((p) => (
                        <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs text-secondary-foreground">
                          <Users className="w-3 h-3 text-secondary-foreground" />
                          {p.name}
                          {p.role === 'organizer' && <span className="text-[8px] font-bold text-primary">ORG</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked tickets */}
                {selectedMeeting.ticket_links && selectedMeeting.ticket_links.length > 0 && (
                  <div className="p-4 border-b border-border/60">
                    <h4 className="text-[10px] font-bold text-secondary-foreground uppercase tracking-wider mb-2">Linked Tickets</h4>
                    <div className="space-y-1.5">
                      {selectedMeeting.ticket_links.map((tl) => (
                        <div key={tl.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary text-xs">
                          <LinkIcon className="w-3 h-3 text-secondary-foreground" />
                          <span className="text-foreground font-medium">{tl.ticket_id}</span>
                          <Badge variant={tl.link_type === 'blocked' ? 'danger' : tl.link_type === 'created' ? 'success' : 'info'}>
                            {tl.link_type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="p-4 border-b border-border/60">
                  <h4 className="text-[10px] font-bold text-secondary-foreground uppercase tracking-wider mb-2">Notes</h4>
                  {selectedMeeting.notes && selectedMeeting.notes.length > 0 ? (
                    <div className="space-y-2">
                      {selectedMeeting.notes.map((note) => (
                        <div key={note.id} className="p-3 rounded-lg bg-secondary text-xs text-secondary-foreground leading-relaxed">
                          {note.content}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-secondary-foreground">No notes yet.</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note..."
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                    />
                    <Button variant="primary" size="sm" disabled={!noteText.trim()}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* AI Analysis panel */}
                {analysis && (
                  <div className="p-4">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Analysis
                    </h4>

                    {/* Summary */}
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mb-3">
                      <p className="text-xs text-secondary-foreground leading-relaxed">{analysis.summary}</p>
                    </div>

                    {/* Decisions */}
                    {analysis.decisions.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          Decisions ({analysis.decisions.length})
                        </h5>
                        <div className="space-y-1">
                          {analysis.decisions.map((d, i) => (
                            <p key={i} className="text-xs text-secondary-foreground pl-4 relative before:absolute before:left-1 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-success">
                              {d}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action items */}
                    {analysis.action_items.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
                          <ListChecks className="w-3 h-3 text-primary" />
                          Action Items ({analysis.action_items.length})
                        </h5>
                        <div className="space-y-1.5">
                          {analysis.action_items.map((ai, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary text-xs">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ai.status === 'done' ? 'bg-success' : 'bg-warning'}`} />
                              <span className="text-foreground flex-1">{ai.title}</span>
                              {ai.assignee && <span className="text-[10px] text-muted-foreground">{ai.assignee}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blockers */}
                    {analysis.blockers.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-[10px] font-semibold text-destructive mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Blockers ({analysis.blockers.length})
                        </h5>
                        {analysis.blockers.map((b, i) => (
                          <p key={i} className="text-xs text-secondary-foreground pl-4 relative before:absolute before:left-1 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-destructive">
                            {b}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Ticket recommendations */}
                    {analysis.ticket_recommendations.length > 0 && (
                      <div>
                        <h5 className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
                          <Brain className="w-3 h-3 text-primary" />
                          Recommended Tickets ({analysis.ticket_recommendations.length})
                        </h5>
                        <div className="space-y-2">
                          {analysis.ticket_recommendations.map((rec, i) => (
                            <div key={i} className="p-3 rounded-lg border border-primary/15 bg-primary/5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground">{rec.title}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{rec.description}</p>
                                  <p className="text-[10px] text-primary mt-1 italic">{rec.rationale}</p>
                                </div>
                                <Badge variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'}>
                                  {rec.priority}
                                </Badge>
                              </div>
                              <Button variant="secondary" size="sm" className="mt-2 w-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Accept & Create Ticket
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analyze button for meetings without analysis */}
                {selectedMeeting.notes && selectedMeeting.notes.length > 0 && !analysis && (
                  <div className="p-4">
                    <Button variant="primary" size="sm" className="w-full">
                      <Sparkles className="w-3.5 h-3.5" />
                      Analyze Notes with AI
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
