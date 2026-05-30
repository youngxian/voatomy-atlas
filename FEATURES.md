# Atlas — Feature Map

> Atlas is an AI intelligence layer that sits on top of any team's project board (Jira, ClickUp, Linear, Asana, GitHub Projects, Azure DevOps). It adds predictive intelligence, estimation calibration, and cross-team visibility without replacing the tools teams already use.

---

## How to Read This Document

Each feature is tagged with its **status** and **delivery surface**:

| Tag | Meaning |
|-----|---------|
| `LIVE` | Shipping today |
| `TRANSFORM` | Exists but needs smart-layer upgrade |
| `NEW` | Not yet built |
| `DEPRECATE` | Will be removed or absorbed into another feature |

| Surface | Where the feature is delivered |
|---------|-------------------------------|
| `WEB` | Atlas web app |
| `BOARD` | Pushed to Jira/ClickUp/Linear via labels, comments, custom fields |
| `SLACK` | Slack or Teams bot |
| `EXT` | Browser extension overlay |
| `EMAIL` | Auto-generated email digest |
| `API` | Public REST/GraphQL endpoint |
| `IDE` | VS Code extension |

---

## 1. Universal Provider Engine

> One adapter interface that maps to any project board. Webhook-first, bi-directional.

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| ClickUp adapter | `LIVE` | `WEB` | OAuth connect, space/folder/list import, sprint sync, ticket read/write |
| Jira Cloud adapter | `NEW` | `WEB` | Full bi-directional sync: epics, sprints, boards, custom fields, webhooks |
| Linear adapter | `NEW` | `WEB` | Cycles, projects, labels, auto-sync via webhooks |
| Asana adapter | `NEW` | `WEB` | Sections-as-sprints, custom fields, portfolio mapping |
| GitHub Projects adapter | `NEW` | `WEB` | V2 projects, iterations, custom fields, Actions integration |
| Azure DevOps adapter | `NEW` | `WEB` | Work items, iterations, area paths, boards |
| Monday.com adapter | `NEW` | `WEB` | Boards, groups, automations mapping |
| Shortcut adapter | `NEW` | `WEB` | Iterations, epics, labels, milestones |
| Unified data model | `NEW` | `API` | One `Ticket`, `Sprint`, `Board`, `Member` schema across all providers |
| Webhook ingestion pipeline | `NEW` | — | Real-time event processing from all providers (replaces polling) |
| Zero-config board detection | `TRANSFORM` | `WEB` | Auto-detect sprint structure, workflow states, custom fields from any board |
| Write-back engine | `NEW` | `BOARD` | Push comments, labels, custom fields, status changes back to any provider |
| Project switcher | `LIVE` | `WEB` | Switch between connected projects with sync status and provider badge |
| Sprint switcher | `LIVE` | `WEB` | Browse sprints by status (active/planning/completed) with cycle detection |
| Board explorer | `LIVE` | `WEB` | Visual space/folder/list browser for ClickUp; extend to all providers |
| Multi-provider projects | `NEW` | `WEB` | One Atlas project connected to Jira + GitHub + Slack simultaneously |

---

## 2. Intelligence Hub (Web App)

> The Atlas web app is the control plane: configure, deep-dive, plan. Not where daily work happens.

### 2.1 Dashboard (`/dashboard`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Sprint progress recap | `LIVE` | `WEB` | Progress ring, pts delivered ratio, status breakdown with colored indicators, day counter badge |
| AI sprint intelligence | `LIVE` | `WEB` | Dynamic insight text, projected completion badge, mini stat cards (Completed / Capacity / Accuracy), action buttons |
| Sprint outcome predictor | `LIVE` | `WEB` | Pace-based projected completion % with good/warn/risk badge in AI card |
| Metric cards | `LIVE` | `WEB` | Velocity, Accuracy, Capacity with trend badges and icon indicators |
| Velocity chart | `LIVE` | `WEB` | Last 3/6/All toggle, gradient bars, planned-vs-actual markers, average line |
| Team workload | `LIVE` | `WEB` | Per-member load bars, avatar grid, average load indicator, overloaded alerts |
| Recent ticket activity | `LIVE` | `WEB` | Sprint tickets with search, status filter pills, points badges, external IDs |
| Quick actions | `LIVE` | `WEB` | Plan Sprint, View Backlog, Check Accuracy, Integrations with plan-gated locks |
| **Risk radar** | `NEW` | `WEB` | Real-time risk scoring with predictive sprint outcome probability |
| **Portfolio overview** | `NEW` | `WEB` | All projects, all teams, all sprints — one executive view |

### 2.2 Sprint Planning (`/sprint/plan`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Duration selector | `LIVE` | `WEB` | 1wk–4wk, Custom |
| Signal config toggles | `LIVE` | `WEB` | Live/stale/disconnected signal sources |
| Write-back options | `LIVE` | `WEB` | Choose what to push back to board |
| AI plan generation | `LIVE` | `WEB` | Backlog → complexity → debt → capacity → business analysis pipeline |
| Plan review | `LIVE` | `WEB` | Include/exclude tickets, risk factors, sprint simulation |
| Push to board | `LIVE` | `WEB` `BOARD` | One-click write tickets, points, labels, comments to provider |
| **Sprint outcome simulator** | `NEW` | `WEB` | "What if we add/remove this ticket?" with confidence intervals |
| **Auto-plan from signals** | `NEW` | `WEB` `BOARD` | Atlas auto-generates optimal plan when sprint starts, pushes to board |
| **Capacity-aware scheduling** | `NEW` | `WEB` | Pull calendar/HR availability, factor into plan automatically |

### 2.3 Burndown (`/sprint/burndown`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Burndown chart | `LIVE` | `WEB` | Ideal vs actual vs projected lines |
| KPI cards | `LIVE` | `WEB` | Pts completed, remaining, scope changes |
| Daily progress table | `LIVE` | `WEB` | Day-by-day breakdown |
| Sprint scope tracking | `LIVE` | `WEB` | Added/removed items with attribution |
| Risk indicators | `LIVE` | `WEB` | Sprint health signals |
| ATLAS prediction | `LIVE` | `WEB` | Predicted completion with confidence |
| **Predictive burndown** | `NEW` | `WEB` `SLACK` | What-if simulator, daily chart pushed to Slack |
| **Scope creep alerts** | `NEW` | `BOARD` `SLACK` | Auto-alert when scope changes exceed threshold |

### 2.4 Accuracy (`/accuracy`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Overview gauge | `LIVE` | `WEB` | Animated accuracy score with sprint comparison |
| Story-level breakdown | `LIVE` | `WEB` | Accurate/Over/Under counts, per-ticket table |
| Team accuracy | `LIVE` | `WEB` | Per-member accuracy bars with AI coaching |
| Module accuracy | `LIVE` | `WEB` | Module cards with risk alerts |
| Sprint history | `LIVE` | `WEB` | Historical accuracy trend across sprints |
| **Estimation calibrator** | `NEW` | `BOARD` | Per-developer, per-module correction factors auto-applied to board estimates |
| **AI coaching comments** | `NEW` | `BOARD` | "You overestimate backend tasks by 30%. Consider 5 pts instead of 8" posted on ticket |
| **Org benchmarks** | `NEW` | `WEB` | "Your accuracy is 72% — org average is 81%. Here's what top teams do differently" |

### 2.5 Analytics (`/analytics`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| KPI cards | `LIVE` | `WEB` | Velocity, Accuracy, Completion, Cycle Time |
| Velocity chart | `LIVE` | `WEB` | Bar chart with trend line |
| Team performance | `LIVE` | `WEB` | Per-member metrics |
| Accuracy matrix | `LIVE` | `WEB` | Sprint-over-sprint comparison |
| Health trends | `LIVE` | `WEB` | Longitudinal health tracking |
| AI recommendations | `LIVE` | `WEB` | Suggested process improvements |
| **Auto-generated executive report** | `NEW` | `EMAIL` `WEB` | Weekly PDF/email sent to stakeholders automatically |
| **Cross-team benchmarking** | `NEW` | `WEB` | Compare velocity, accuracy, cycle time across all teams |
| **Predictive velocity** | `NEW` | `WEB` `SLACK` | "Next sprint will likely deliver 38±5 pts based on capacity and backlog" |

### 2.6 Retro (`/retro`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Board view | `LIVE` | `WEB` | What Went Well / Could Improve / Action Items with voting |
| Whiteboard | `LIVE` | `WEB` | Sticky notes, drawing tools, text, zoom, color picker |
| Sprint summary cards | `LIVE` | `WEB` | Delivered, Accuracy, Velocity Trend, Carry-over |
| Team sentiment | `LIVE` | `WEB` | Overall mood, individual ratings, trend chart |
| AI Insights | `LIVE` | `WEB` | Categorized insight cards |
| Previous retros | `LIVE` | `WEB` | Historical data |
| **Auto-generated retro** | `NEW` | `WEB` `BOARD` | Pre-populate retro from sprint data; post summary to board wiki |
| **Action item tracking** | `NEW` | `BOARD` | Create board tickets from retro action items, track completion |
| **Sentiment trends** | `NEW` | `WEB` | Cross-sprint mood trends with anomaly detection |

### 2.7 Revenue Intelligence (`/revenue`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Revenue overview | `LIVE` | `WEB` | KPI cards, team/project/epic/feature breakdown |
| Engineering ROI | `LIVE` | `WEB` | Revenue per engineering hour/point |
| Revenue pipeline | `LIVE` | `WEB` | Confidence-weighted revenue forecast |
| **Revenue tags on board** | `NEW` | `BOARD` | Custom field `Revenue Impact: $45K` on board tickets |
| **Revenue risk alerts** | `NEW` | `SLACK` | "Feature X ($120K) is 3 days behind — 2 blocked tickets" |
| **Revenue-weighted prioritization** | `NEW` | `WEB` `BOARD` | Auto-prioritize backlog by revenue impact |

### 2.8 Dependencies (`/dependencies`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Dependency chains | `LIVE` | `WEB` | Visual chain cards with assessment |
| All dependencies table | `LIVE` | `WEB` | From/To/Type/Status with resolve/delete |
| Cross-team view | `LIVE` | `WEB` | Team cards with blocked-by/blocking counts |
| AI insights | `LIVE` | `WEB` | Dependency risk analysis |
| **Cross-board dependencies** | `NEW` | `WEB` `BOARD` | Track dependencies across Jira + Linear + ClickUp |
| **Blocker cascade predictor** | `NEW` | `WEB` `BOARD` `SLACK` | "If PROJ-89 isn't done by Wednesday, it cascade-blocks 5 tickets across 2 teams" |
| **Auto-blocker comments** | `NEW` | `BOARD` | Post warning on blocked tickets: "⚠️ 3 unresolved dependencies" |

### 2.9 Backlog Intelligence (`/backlog`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Health metrics | `LIVE` | `WEB` | Items, pts, avg age, Ready/Blocked/Stale/Unestimated |
| AI Insights | `LIVE` | `WEB` | Critical/Warning/Info insights with action buttons |
| Priority/Aging/Module charts | `LIVE` | `WEB` | Visual analytics |
| Auto-prioritize | `LIVE` | `WEB` | AI-driven priority ranking |
| Backlog item list | `DEPRECATE` | — | Tickets live on the board; link out instead of duplicating |
| **Priority write-back** | `NEW` | `BOARD` | Push AI priority scores as custom field to board |
| **Stale ticket alerts** | `NEW` | `BOARD` `SLACK` | Auto-label `atlas:stale-14d` and notify assignee |
| **Grooming suggestions** | `NEW` | `SLACK` | "You have 12 unestimated tickets. Schedule grooming?" |

### 2.10 Tech Debt (`/insights/debt`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Debt score gauge | `LIVE` | `WEB` | Overall tech debt health |
| Category breakdown | `LIVE` | `WEB` | Debt by type |
| Debt timeline | `LIVE` | `WEB` | Historical trend |
| Retirement plan | `LIVE` | `WEB` | Suggested debt paydown schedule |
| ROI analysis | `LIVE` | `WEB` | Impact of addressing debt on velocity |
| **Debt score on board** | `NEW` | `BOARD` | Custom field `Debt Score: 7.2` on affected tickets |
| **ROI-based sprint inclusion** | `NEW` | `WEB` | "Address auth module debt this sprint → +15% velocity next sprint" |

### 2.11 Complexity (`/insights/complexity`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Module cards | `LIVE` | `WEB` | Score, risk level, debt multiplier |
| Distribution chart | `LIVE` | `WEB` | Complexity spread |
| Complexity vs effort scatter | `LIVE` | `WEB` | Identifies misaligned estimates |
| Hotspot files | `LIVE` | `WEB` | Most complex code areas |
| **Complexity on board** | `NEW` | `BOARD` | Custom field `Complexity: High` on tickets touching hotspot modules |
| **IDE warnings** | `NEW` | `IDE` | "This file has complexity 8.4 — changes here take 2.3x longer" |

### 2.12 Security & PII (`/security`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| PII stats dashboard | `LIVE` | `WEB` | Severity distribution, tracker table |
| Trigger scan | `LIVE` | `WEB` | On-demand PII scan |
| Workflow & remediation panels | `LIVE` | `WEB` | PII handling workflows |
| **Real-time scan on ticket create** | `NEW` | `BOARD` | Auto-scan tickets as they're created; block PII before it persists |
| **Auto-redact suggestions** | `NEW` | `BOARD` | Comment on ticket: "This ticket contains PII (email). Consider redacting." |

---

## 3. Push Intelligence (Board Write-Back)

> Intelligence that flows FROM Atlas TO the board — users never have to leave Jira/ClickUp/Linear.

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Smart labels | `NEW` | `BOARD` | Auto-apply: `atlas:at-risk`, `atlas:overestimated`, `atlas:blocked-chain`, `atlas:stale-14d`, `atlas:high-complexity` |
| AI comments | `NEW` | `BOARD` | Risk warnings, estimation suggestions, dependency alerts posted as ticket comments |
| Custom field sync | `NEW` | `BOARD` | Populate: `Atlas Confidence`, `Complexity Score`, `Revenue Impact`, `Debt Score`, `Priority Rank` |
| Sprint summaries | `NEW` | `BOARD` | Post sprint review/retro to board wiki, Confluence, Notion |
| Status automation | `NEW` | `BOARD` | Suggest or auto-move tickets (e.g., PR merged → Done) |
| Digest documents | `NEW` | `BOARD` | Weekly intelligence digest as a board document |

---

## 4. Surfaces (Meet Teams Where They Work)

### 4.1 Slack / Teams Bot

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Daily standup collection | `NEW` | `SLACK` | Bot prompts team, collects Yesterday/Today/Blockers, posts summary |
| Sprint risk alerts | `NEW` | `SLACK` | "Sprint is at 65% with 3 days left. 4 tickets blocked." |
| Blocker notifications | `NEW` | `SLACK` | DM assignees when their ticket becomes blocked |
| @atlas queries | `NEW` | `SLACK` | "What's blocking the sprint?" "What's Sarah working on?" "Sprint accuracy forecast?" |
| Daily burndown chart | `NEW` | `SLACK` | Auto-post burndown image to sprint channel each morning |
| Sprint summary | `NEW` | `SLACK` | End-of-sprint summary posted to channel |
| Standup analysis | `NEW` | `SLACK` | Post AI summary + flag recurring blockers after standup |
| Meeting action items | `NEW` | `SLACK` | Post action items from meetings to relevant channels |

### 4.2 Browser Extension

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Ticket risk badge | `NEW` | `EXT` | Overlay on Jira/ClickUp ticket view: risk level, confidence score |
| Estimation helper | `NEW` | `EXT` | "Atlas suggests 5 pts (you overestimate backend by 30%)" next to estimate field |
| Sprint health bar | `NEW` | `EXT` | Mini burndown + risk indicator in board header |
| Dependency warning | `NEW` | `EXT` | "This ticket has 3 blockers" badge on board cards |
| Team capacity sidebar | `NEW` | `EXT` | Pop-out panel showing team load while assigning tickets |
| Quick Atlas actions | `NEW` | `EXT` | "Plan Sprint", "View Accuracy", "Ask Atlas" from any board page |

### 4.3 Email Digests

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Weekly stakeholder report | `NEW` | `EMAIL` | Auto-generated: KPIs, feature progress, risks, milestones |
| Sprint summary email | `NEW` | `EMAIL` | End-of-sprint results to team + stakeholders |
| Risk escalation | `NEW` | `EMAIL` | Immediate email when sprint risk exceeds threshold |
| Accuracy report | `NEW` | `EMAIL` | Per-sprint estimation accuracy breakdown |

### 4.4 Public API

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Sprint intelligence endpoint | `NEW` | `API` | GET `/api/v1/sprints/{id}/intelligence` — risk, prediction, recommendations |
| Ticket signals endpoint | `NEW` | `API` | GET `/api/v1/tickets/{id}/signals` — risk, complexity, debt, dependencies |
| Team capacity endpoint | `NEW` | `API` | GET `/api/v1/teams/{id}/capacity` — current allocation, forecast |
| Accuracy endpoint | `NEW` | `API` | GET `/api/v1/accuracy/{sprintId}` — team + module + ticket-level data |
| Webhook subscriptions | `NEW` | `API` | Subscribe to Atlas events: risk change, blocker detected, sprint complete |
| Embeddable widgets | `NEW` | `API` | `<atlas-widget type="sprint-health" project="X" />` for internal dashboards |

### 4.5 IDE Extension

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Ticket context panel | `NEW` | `IDE` | Show linked ticket details, complexity, dependencies while coding |
| Complexity warnings | `NEW` | `IDE` | "This module has complexity 8.4 — changes take 2.3x longer" |
| PR impact preview | `NEW` | `IDE` | "This PR touches 3 sprint tickets and 1 blocker chain" |

---

## 5. Predictive Engine

> Move from "here's what happened" to "here's what will happen and what to do about it."

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Sprint outcome simulator | `NEW` | `WEB` `SLACK` | "You'll complete 78%. Drop PROJ-789 to hit 95%" with confidence intervals |
| Estimation calibrator | `NEW` | `BOARD` `EXT` | Per-developer, per-module correction factors applied to new estimates |
| Blocker cascade predictor | `NEW` | `WEB` `BOARD` `SLACK` | "If PROJ-89 isn't done by Wed, it cascade-blocks 5 tickets across 2 teams" |
| Team load balancer | `NEW` | `WEB` `SLACK` | "Sarah at 150%, Jordan at 40%. Reassign PROJ-456 for optimal throughput" |
| Anomaly detection | `NEW` | `WEB` `SLACK` | "This sprint has 3x normal scope changes — flag for PM review" |
| Velocity forecasting | `NEW` | `WEB` `SLACK` | "Next sprint: 38±5 pts based on capacity + backlog complexity" |
| Meeting intelligence | `NEW` | `WEB` `SLACK` | "Planning meetings run 45min over avg. Teams that timebox have 12% higher accuracy" |
| Risk heat map | `NEW` | `WEB` | Real-time risk scoring across all sprints, teams, projects |

---

## 6. Cross-Project Intelligence

> Intelligence that spans projects, teams, providers, and tools.

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Portfolio dashboard | `NEW` | `WEB` | All projects, all teams, all sprints in one executive view |
| Cross-team dependencies | `TRANSFORM` | `WEB` `BOARD` | Track dependencies across separate Jira/Linear/ClickUp boards |
| Shared resource conflicts | `NEW` | `WEB` `SLACK` | "Jordan allocated to 3 sprints at 120% across 2 projects" |
| Organization benchmarks | `NEW` | `WEB` | Compare velocity, accuracy, cycle time across all teams |
| Knowledge transfer | `NEW` | `WEB` `SLACK` | "Team B solved a similar blocker pattern last sprint — here's how" |
| Unified search | `LIVE` | `WEB` | ⌘K search across all projects, providers, and tools |
| Impact analysis | `NEW` | `WEB` `SLACK` | "This infrastructure change affects 12 tickets across 4 teams" |

---

## 7. Collaboration & Communication

### 7.1 Chat (`/chat`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| AI assistant | `LIVE` | `WEB` | Natural language queries about sprint, capacity, risk |
| Suggestion chips | `LIVE` | `WEB` | Quick-ask: Sprint risk, Capacity forecast, etc. |
| Context panel | `LIVE` | `WEB` | Current sprint, signal health, recent activity |
| **Slack bot mode** | `NEW` | `SLACK` | Same AI, available as @atlas in any Slack channel |
| **Browser extension mode** | `NEW` | `EXT` | Ask Atlas from any Jira/ClickUp page |
| **IDE mode** | `NEW` | `IDE` | Ask Atlas while coding |

### 7.2 Standups (`/standups`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Today's standup view | `LIVE` | `WEB` | Member rows with Yesterday/Today/Blockers |
| AI summary | `LIVE` | `WEB` | Auto-generated summary with topic tags |
| Metrics | `LIVE` | `WEB` | Duration, Blockers/Day, Attendance, Resolution |
| History timeline | `LIVE` | `WEB` | Past standups with expandable detail |
| Action items | `LIVE` | `WEB` | Track items by status |
| **Slack-first collection** | `NEW` | `SLACK` | Bot collects standups → Atlas analyzes → posts summary |
| **Blocker auto-detection** | `NEW` | `SLACK` `BOARD` | Flag blockers from standup text, link to board tickets |

### 7.3 Meetings (`/meetings`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Calendar sync | `LIVE` | `WEB` | Google Calendar / provider calendar |
| Meeting cards | `LIVE` | `WEB` | List + calendar view with participants, linked tickets |
| AI analysis | `LIVE` | `WEB` | Summary, decisions, action items, blockers, ticket recommendations |
| **Auto-link tickets** | `NEW` | `WEB` `BOARD` | Detect ticket IDs in meeting notes, auto-link |
| **Action item → board ticket** | `TRANSFORM` | `BOARD` | One-click create board ticket from meeting action item |
| **Meeting efficiency scoring** | `NEW` | `WEB` `SLACK` | Duration vs decisions ratio, comparison to team average |

### 7.4 Notifications (`/notifications`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| In-app notifications | `LIVE` | `WEB` | Grouped by time, filterable, mark-read |
| Stakeholder report | `LIVE` | `WEB` | KPI cards, progress, risks, milestones |
| Preferences | `LIVE` | `WEB` | Email, Push, Sound toggles |
| **Multi-channel routing** | `NEW` | `SLACK` `EMAIL` | Route alerts by severity: critical → Slack DM + email, info → digest |
| **Smart digest** | `NEW` | `EMAIL` `SLACK` | Daily summary of what changed, ranked by relevance |

---

## 8. Workflow & Automation

### 8.1 Workflow Builder (`/workflow`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Visual flow canvas | `LIVE` | `WEB` | Drag-and-drop nodes, connections, minimap |
| Scenario templates | `LIVE` | `WEB` | Pre-built workflow templates |
| Node palette | `LIVE` | `WEB` | Triggers, conditions, actions |
| Share + export | `LIVE` | `WEB` | Share link, copy as JSON |
| **Cross-provider workflows** | `NEW` | `WEB` `BOARD` | "When Jira ticket closes → update Linear ticket → notify Slack" |
| **Atlas signal triggers** | `NEW` | `WEB` | "When risk > 80% → move ticket to Review → alert PM" |
| **Marketplace templates** | `NEW` | `WEB` | Community-shared workflow templates |

### 8.2 Automations (`/automations`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Flow builder | `LIVE` | `WEB` | Visual automation with triggers/conditions/actions |
| Run/pause controls | `LIVE` | `WEB` | Live status, run count, last run |
| **Provider-native rules** | `NEW` | `BOARD` | Execute actions directly on the board (move, label, assign, comment) |
| **Signal-driven automations** | `NEW` | `WEB` `BOARD` | "When Atlas detects stale ticket → comment on board → notify assignee in Slack" |

---

## 9. Configuration & Administration

### 9.1 Settings (`/settings`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| General settings | `LIVE` | `WEB` | Project config, display, theme, data retention |
| AI Engine config | `LIVE` | `WEB` | Follow-up rules, stakeholder notifications, AI behaviors |
| Sprint & Board config | `LIVE` | `WEB` | Duration, points, velocity target, columns, sync frequency, field mapping |
| Team management | `LIVE` | `WEB` | Members, roles, permissions |
| Notification prefs | `LIVE` | `WEB` | Channel preferences (Email, Slack, Teams), quiet hours |
| Security | `LIVE` | `WEB` | Vuln scanner, 2FA, SSO, API keys, audit log |
| Billing | `LIVE` | `WEB` | Plan management, data export, account deletion |
| **Write-back config** | `NEW` | `WEB` | Configure which labels/fields/comments Atlas pushes to board |
| **Slack bot config** | `NEW` | `WEB` | Channel mapping, standup schedule, alert thresholds |
| **API key management** | `TRANSFORM` | `WEB` | Scoped API keys with rate limits and usage dashboard |

### 9.2 Integrations (`/integrations`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Provider connections | `LIVE` | `WEB` | OAuth connect/disconnect, sync status |
| Available integrations | `LIVE` | `WEB` | Category-based integration catalog |
| Sync activity feed | `LIVE` | `WEB` | Recent sync events |
| Repo attachment | `LIVE` | `WEB` | Link repos to projects |
| **Jira / Linear / Asana / GitHub connectors** | `NEW` | `WEB` | Full adapter support for all major providers |
| **Slack workspace connect** | `NEW` | `WEB` | OAuth + channel selection for bot |
| **Calendar connect** | `TRANSFORM` | `WEB` | Google Calendar, Outlook — availability + meeting sync |
| **HR system connect** | `NEW` | `WEB` | BambooHR, Deel, Rippling — PTO and availability |

### 9.3 Team (`/team`)

| Feature | Status | Surface | Description |
|---------|--------|---------|-------------|
| Member management | `LIVE` | `WEB` | Add, edit, delete, sync from board |
| Skills + velocity | `LIVE` | `WEB` | Per-member velocity, availability, skills |
| **Cross-project allocation** | `NEW` | `WEB` | See member allocation across all projects |
| **Auto-sync from provider** | `NEW` | `WEB` | Keep team roster in sync with board membership |

---

## 10. Deprecated / Absorbed Features

| Feature | Current Route | Reason | Replacement |
|---------|--------------|--------|-------------|
| Ticket list view | `/tickets` | Duplicates the board | AI Suggestions tab only; link to board for ticket management |
| Activity feed | `/activity` | Duplicates board activity | NEXUS signal feed for Atlas-specific signals |
| Backlog item list | `/backlog` | Duplicates the board | Keep AI insights + analytics; link to board for item management |
| Planning notes (standalone) | `/sprint/planning-notes` | Low differentiation | Fold into meeting intelligence with auto-capture |
| Stakeholder (standalone) | `/stakeholder` | Overlaps notifications | Fold into Notifications > Stakeholder Report tab + email digest |

---

## Feature Count Summary

| Category | Live | Transform | New | Deprecate | Total |
|----------|------|-----------|-----|-----------|-------|
| Universal Provider Engine | 5 | 1 | 11 | 0 | 17 |
| Intelligence Hub (Web) | 51 | 0 | 25 | 0 | 76 |
| Push Intelligence (Board) | 0 | 0 | 6 | 0 | 6 |
| Surfaces (Slack/Ext/Email/API/IDE) | 0 | 0 | 28 | 0 | 28 |
| Predictive Engine | 0 | 0 | 8 | 0 | 8 |
| Cross-Project Intelligence | 1 | 1 | 5 | 0 | 7 |
| Collaboration & Communication | 15 | 1 | 10 | 0 | 26 |
| Workflow & Automation | 6 | 0 | 4 | 0 | 10 |
| Configuration & Admin | 11 | 2 | 6 | 0 | 19 |
| Deprecated | 0 | 0 | 0 | 5 | 5 |
| **Total** | **89** | **5** | **103** | **5** | **202** |
