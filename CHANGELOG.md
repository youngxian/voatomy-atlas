# Changelog

All notable changes to the ATLAS app are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.4.0] - 2025-02-22

### Added

- **Daily Standups** (`/standups`) - Team standup meeting minutes with AI summaries, action item tracking, standup metrics, and expandable team member updates
- **Sprint Planning Notes** (`/sprint/planning-notes`) - Sprint planning meeting minutes with agenda tracking, decisions log, ATLAS vs team estimate comparison, and parking lot items
- **ATLAS AI Chat** (`/chat`) - AI chat assistant interface with mock conversation demonstrating sprint risk analysis, capacity breakdowns, and ticket prioritization. Features context panel, typing indicators, and quick suggestion chips
- **Sprint Retrospective** (`/retro`) - Three-column retro board (went well / could improve / action items) with team sentiment tracking, mood trends, and AI-generated insights
- **Team Analytics** (`/analytics`) - Comprehensive team performance analytics with velocity trends, individual performance cards, estimation accuracy matrix, sprint health trends, and collaboration metrics
- **Sprint Burndown** (`/sprint/burndown`) - Visual burndown chart with ideal/actual/projected lines, daily progress table, scope tracker, velocity comparison, and ATLAS prediction card
- **Team Directory** (`/team`) - Team profiles with skills matrix, availability calendar, contribution heatmaps, org chart, and detailed member cards
- **Sidebar navigation** - Added "Meetings" section (Daily Standups, Planning Notes), moved ATLAS AI to prominent position, added Burndown, Retrospective, Analytics, and Team links
- **README.md** - Comprehensive project documentation with architecture overview, design system reference, full page catalog, and tech stack details
- **CONTRIBUTING.md** - Contributor guidelines with code standards, component guidelines, page creation template, and PR process
- **CHANGELOG.md** - Project changelog

## [0.3.0] - 2025-02-21

### Added

- **Sprint History** (`/history`) - Timeline view of past sprints with expandable details, accuracy badges, and summary statistics
- **Repository Integrations** (`/repos`) - Repository health dashboard with commit activity charts, language badges, and PR merge stats
- **Revenue Impact** (`/revenue`) - Revenue tracking with $2.4M total impact, ROI gauge, monthly chart, and feature attribution table

### Enhanced

- **Dashboard** (`/dashboard`) - Complete rewrite with glassmorphic cards, SVG gauges (circular + semi-circle), 3-tab interface, velocity chart, live activity feed, team load overview, and quick actions
- **Sprint Plan Review** (`/sprint/plan/review`) - 6 stat cards, confidence gauge, risk factors, sprint simulation, estimation breakdown
- **Complexity** (`/insights/complexity`) - Distribution chart, scatter plot, module heatmap, complexity trends, hotspot files
- **Tech Debt** (`/insights/debt`) - SVG health gauge (68/100), debt by category, timeline, retirement plan, refactoring ROI
- **Backlog** (`/backlog`) - 16 rich items with drag handles, priority distribution, search, 4 filter dropdowns
- **Capacity** (`/capacity`) - Team grid with 7 members, skills matrix, capacity forecast, import availability
- **NEXUS Feed** (`/nexus`) - 12 signal items, scanning indicator, 7 filter pills, severity indicators
- **Notifications** (`/notifications`) - 12 notifications grouped by time, animated unread badge, preferences panel
- **Stakeholder** (`/stakeholder`) - KPI row, feature progress, risk register, milestones timeline
- **Projects** (`/projects`) - 4 project cards, summary bar, Create New CTA
- **Settings** (`/settings`) - 5-tab interface (General, Integrations, Team, Notifications, Billing), danger zone
- **Integrations** (`/integrations`) - 6 tool cards, sync activity feed, data flow visualization
- **Accuracy** (`/accuracy`) - SVG semi-circle gauge, accuracy breakdown, sprint comparison, AI insights, story-level table

### Fixed

- Fixed 8 broken navigation links in Sidebar.tsx
- Removed `max-w-*` constraints from all 21 main pages for full-width layouts
- Fixed `style` prop on `Card` component in sprint/plan/review page (wrapped in div)

## [0.2.0] - 2025-02-20

### Added

- Core application pages: Dashboard, Sprint Plan, Plan Review, Processing, Pushed, Accuracy, Backlog, Capacity, Integrations, Settings, Notifications, Projects, Stakeholder, NEXUS Feed, Complexity, Tech Debt
- Dynamic routes: Sprint Deck, Sprint Report, Integration Tool Detail, Sprint Accuracy Detail
- Multi-sprint capacity view
- Onboarding flow (6 steps): Board, Repository, Analyzing, Ready, No Board, Mid Sprint
- Component library: AppShell, Sidebar, TopBar, Reveal, SlideOver, TabBar, UI primitives
- Mock data layer with comprehensive type definitions
- Animation presets with Framer Motion
- Dark theme with ATLAS brand colors

## [0.1.0] - 2025-02-19

### Added

- Initial project setup with Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4 with inline theme configuration
- Project scaffolding and directory structure
- Base layout with route groups
