<p align="center">
  <img src="https://img.shields.io/badge/ATLAS-Sprint%20Intelligence-f16e2c?style=for-the-badge&logo=hexagon&logoColor=white" alt="ATLAS" />
</p>

<h1 align="center">ATLAS - AI Sprint Intelligence Layer</h1>

<p align="center">
  <strong>AI-powered sprint planning, estimation calibration, and delivery intelligence for engineering teams.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Framer_Motion-11-ff69b4?style=flat-square" alt="Framer Motion" />
</p>

---

## What is ATLAS?

ATLAS (AI-Tuned Logical Analysis System) is an AI sprint intelligence platform that transforms how engineering teams plan, estimate, and deliver software. By analyzing signals from your code repositories, project management tools, capacity data, customer support tickets, and revenue pipelines, ATLAS provides calibrated sprint plans with higher accuracy than traditional estimation methods.

### Key Capabilities

- **AI Sprint Planning** - Generates data-driven sprint plans using 6+ signal sources
- **Estimation Calibration** - Adjusts story point estimates using tech debt multipliers, module complexity, and historical accuracy
- **Signal Intelligence (NEXUS)** - Real-time feed of anomalies, patterns, and recommendations from connected data sources
- **Revenue Impact Tracking** - Links sprint deliverables to pipeline revenue and customer deals
- **Team Capacity Management** - Factors in PTO, on-call rotations, FTE allocation, and meeting load
- **Sprint Retrospectives** - AI-enhanced retro analysis with sentiment tracking and action items
- **ATLAS AI Chat** - Natural language interface to query sprint data, risks, and forecasts
- **Meeting Minutes** - Automated standup and planning session notes with AI summaries

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev) with Server & Client Components |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) (inline theme) |
| Animations | [Framer Motion 11](https://www.framer.com/motion/) + CSS @keyframes |
| Icons | [Lucide React](https://lucide.dev) (575+) |
| Font | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) |

---

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/atlas-app.git
cd atlas-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see ATLAS in action.

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
atlas-app/
├── src/
│   ├── app/
│   │   ├── (main)/                    # Protected app routes (with sidebar)
│   │   │   ├── dashboard/             # Sprint dashboard with KPIs & gauges
│   │   │   ├── sprint/
│   │   │   │   ├── plan/              # Sprint planning wizard
│   │   │   │   │   ├── review/        # Plan review with AI recommendations
│   │   │   │   │   ├── processing/    # Plan generation loading state
│   │   │   │   │   └── pushed/        # Plan pushed confirmation
│   │   │   │   ├── burndown/          # Sprint burndown chart & tracking
│   │   │   │   ├── planning-notes/    # Sprint planning meeting minutes
│   │   │   │   └── [id]/
│   │   │   │       ├── deck/          # Sprint deck presentation
│   │   │   │       └── report/        # Sprint report
│   │   │   ├── accuracy/              # Estimation accuracy tracking
│   │   │   │   └── [sprintId]/        # Per-sprint accuracy detail
│   │   │   ├── history/               # Sprint history timeline
│   │   │   ├── retro/                 # Sprint retrospective board
│   │   │   ├── standups/              # Daily standup meeting minutes
│   │   │   ├── chat/                  # ATLAS AI chat assistant
│   │   │   ├── analytics/             # Team performance analytics
│   │   │   ├── team/                  # Team directory & profiles
│   │   │   ├── backlog/               # Backlog management with filters
│   │   │   ├── insights/
│   │   │   │   ├── complexity/        # Code complexity analysis
│   │   │   │   └── debt/              # Technical debt tracking
│   │   │   ├── capacity/              # Team capacity planning
│   │   │   │   └── multi/             # Multi-sprint capacity view
│   │   │   ├── integrations/          # Integration management
│   │   │   │   └── [tool]/            # Per-tool integration detail
│   │   │   ├── repos/                 # Repository health & activity
│   │   │   ├── revenue/               # Revenue impact tracking
│   │   │   ├── projects/              # Multi-project management
│   │   │   ├── nexus/                 # AI signal intelligence feed
│   │   │   ├── stakeholder/           # Stakeholder dashboard
│   │   │   ├── notifications/         # Notification center
│   │   │   ├── settings/              # Application settings
│   │   │   └── layout.tsx             # Main layout with AppShell
│   │   ├── onboarding/                # Onboarding flow (6 steps)
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page
│   │   └── globals.css                # Theme & global styles
│   ├── components/
│   │   ├── AppShell.tsx               # Layout wrapper (sidebar + topbar)
│   │   ├── Sidebar.tsx                # Navigation sidebar
│   │   ├── TopBar.tsx                 # Header bar
│   │   ├── Reveal.tsx                 # Scroll-triggered animation wrapper
│   │   ├── SlideOver.tsx              # Slide-over panel
│   │   ├── TabBar.tsx                 # Tab navigation component
│   │   └── ui.tsx                     # UI component library
│   └── lib/
│       ├── mock-data.ts               # Comprehensive mock data & types
│       └── motion.ts                  # Animation presets & variants
├── public/                            # Static assets
├── tailwind.config.ts                 # Tailwind configuration
├── tsconfig.json                      # TypeScript configuration
├── next.config.ts                     # Next.js configuration
└── package.json                       # Dependencies & scripts
```

---

## Pages & Features

### Sprint Management
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Central hub with KPI gauges, velocity charts, activity feed, team load |
| Plan Sprint | `/sprint/plan` | AI-assisted sprint composition wizard |
| Plan Review | `/sprint/plan/review` | Review ATLAS recommendations with confidence scores |
| Burndown | `/sprint/burndown` | Real-time burndown chart with ATLAS predictions |
| Accuracy | `/accuracy` | Estimation accuracy tracking with ATLAS vs team comparison |
| History | `/history` | Sprint history timeline with trends |
| Retrospective | `/retro` | Retro board (went well / improve / actions) with sentiment |

### Meetings & Collaboration
| Page | Route | Description |
|------|-------|-------------|
| Daily Standups | `/standups` | Standup meeting minutes with AI summaries |
| Planning Notes | `/sprint/planning-notes` | Sprint planning session notes & decisions |
| ATLAS AI Chat | `/chat` | Natural language sprint intelligence assistant |

### Insights & Analytics
| Page | Route | Description |
|------|-------|-------------|
| Backlog | `/backlog` | Filterable backlog with priority distribution |
| Complexity | `/insights/complexity` | Code complexity heatmaps & scatter plots |
| Tech Debt | `/insights/debt` | Debt health score, categories, retirement plan |
| Capacity | `/capacity` | Team capacity grid with skills matrix |
| Analytics | `/analytics` | Team performance analytics & velocity trends |
| NEXUS Feed | `/nexus` | AI signal intelligence feed |

### Team & Organization
| Page | Route | Description |
|------|-------|-------------|
| Team Directory | `/team` | Team profiles, skills matrix, availability |
| Projects | `/projects` | Multi-project management hub |
| Stakeholder | `/stakeholder` | Executive dashboard with KPIs & risk register |

### Integrations & Settings
| Page | Route | Description |
|------|-------|-------------|
| Boards | `/integrations` | Jira, Linear, ClickUp connections |
| Repos | `/repos` | GitHub/GitLab repository health |
| Revenue | `/revenue` | Revenue impact tracking & ROI analysis |
| Notifications | `/notifications` | Notification center with preferences |
| Settings | `/settings` | App config, team management, billing |

---

## Design System

### Theme

ATLAS uses a dark-only theme optimized for developer productivity:

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#0a0a0f` | Page background |
| `surface` | `#12121a` | Card surfaces |
| `surface-hover` | `#1a1a25` | Interactive hover states |
| `border` | `#2a2a3a` | Subtle borders |
| `foreground` | `#e8e8ed` | Primary text |
| `muted` | `#6b6b80` | Secondary text |
| `atlas-orange` | `#f16e2c` | Brand accent, CTAs, active states |
| `success` | `#22c55e` | Positive indicators |
| `warning` | `#eab308` | Caution indicators |
| `danger` | `#ef4444` | Error/critical states |
| `info` | `#3b82f6` | Informational elements |

### Components

Built-in UI components in `src/components/ui.tsx`:

- `Badge` - Status badges (success, warning, danger, info, muted, orange)
- `Button` - Action buttons (primary, secondary, ghost, danger)
- `Card` - Motion-enabled card containers
- `ProgressBar` - Animated progress indicators
- `StatusDot` - Live/stale/error status indicators
- `SignalBadge` - Signal source badges
- `EmptyState` - Empty state placeholders

### Animation

- **Framer Motion** for page transitions and scroll-triggered reveals
- **CSS @keyframes** for micro-interactions (shimmer, pulse, glow, bounce)
- **Reduced motion** support via `prefers-reduced-motion` media query

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Architecture Decisions

- **App Router** - Uses Next.js App Router with route groups for layout separation
- **Client Components** - Pages use `'use client'` for rich interactivity
- **Mock Data** - Comprehensive mock data layer (`src/lib/mock-data.ts`) for demo purposes
- **No External State** - React useState/useEffect for all state management
- **CSS-Only Charts** - Data visualizations built with CSS + SVG (no chart libraries)
- **Inline Themes** - Tailwind CSS v4 inline theme configuration

---

## Product Suite

ATLAS is part of a larger product ecosystem:

| Product | Purpose |
|---------|---------|
| **ATLAS** | AI Sprint Intelligence Layer |
| **LOOP** | Continuous Feedback Engine |
| **PHANTOM** | Technical Debt Analysis Engine |
| **SIGNAL** | Data Pipeline Orchestration |
| **NEXUS** | Cross-Signal AI Intelligence |

---

## License

Proprietary - All rights reserved.

---

<p align="center">
  Built with <span style="color: #f16e2c;">&#9632;</span> by the ATLAS Team
</p>
