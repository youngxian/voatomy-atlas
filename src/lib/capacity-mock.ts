/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AvailabilityStatus = 'available' | 'partial' | 'ooo';
export type SkillLevel = 'expert' | 'proficient' | 'learning' | 'none';

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatarColor: string;
  capacityPercent: number;
  sprintAllocation: number;
  status: AvailabilityStatus;
  leaveNote?: string;
  skills: {
    backend: SkillLevel;
    frontend: SkillLevel;
    devops: SkillLevel;
    qa: SkillLevel;
  };
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

export const teamMembers: TeamMember[] = [
  {
    id: 'm1', name: 'Alex Chen', initials: 'AC', role: 'Senior Backend Engineer',
    avatarColor: '#f16e2c', capacityPercent: 100, sprintAllocation: 13, status: 'available',
    skills: { backend: 'expert', frontend: 'proficient', devops: 'learning', qa: 'proficient' },
  },
  {
    id: 'm2', name: 'Sarah Kim', initials: 'SK', role: 'Full-Stack Developer',
    avatarColor: '#8b5cf6', capacityPercent: 50, sprintAllocation: 6, status: 'partial',
    leaveNote: 'PTO Feb 24-26',
    skills: { backend: 'proficient', frontend: 'expert', devops: 'none', qa: 'learning' },
  },
  {
    id: 'm3', name: 'Jordan Rivera', initials: 'JR', role: 'DevOps Lead',
    avatarColor: '#06b6d4', capacityPercent: 75, sprintAllocation: 10, status: 'partial',
    leaveNote: 'On-call Week 2',
    skills: { backend: 'proficient', frontend: 'none', devops: 'expert', qa: 'proficient' },
  },
  {
    id: 'm4', name: 'Priya Patel', initials: 'PP', role: 'Frontend Engineer',
    avatarColor: '#ec4899', capacityPercent: 100, sprintAllocation: 13, status: 'available',
    skills: { backend: 'learning', frontend: 'expert', devops: 'learning', qa: 'proficient' },
  },
  {
    id: 'm5', name: 'Marcus Johnson', initials: 'MJ', role: 'QA Engineer',
    avatarColor: '#10b981', capacityPercent: 100, sprintAllocation: 8, status: 'available',
    skills: { backend: 'learning', frontend: 'learning', devops: 'none', qa: 'expert' },
  },
  {
    id: 'm6', name: 'Elena Volkov', initials: 'EV', role: 'Backend Engineer',
    avatarColor: '#f59e0b', capacityPercent: 0, sprintAllocation: 0, status: 'ooo',
    leaveNote: 'Vacation Mar 1-14',
    skills: { backend: 'expert', frontend: 'proficient', devops: 'proficient', qa: 'learning' },
  },
  {
    id: 'm7', name: 'David Park', initials: 'DP', role: 'Full-Stack Developer',
    avatarColor: '#3b82f6', capacityPercent: 50, sprintAllocation: 4, status: 'partial',
    leaveNote: '0.5x FTE',
    skills: { backend: 'proficient', frontend: 'proficient', devops: 'learning', qa: 'none' },
  },
];
