# Atlas as a Smart Layer — Product Strategy

## The Core Problem

Atlas currently **rebuilds the board UI** (tickets, sprints, burndown, backlog). This forces teams to context-switch between their native tool (Jira, ClickUp, Linear) and Atlas. A smart layer should **add intelligence on top of the board**, not replace it.

---

## Current Architecture vs. Smart Layer Architecture

```
CURRENT:  Board → Sync → Atlas DB → Atlas UI (user works here)
                                     ↑ duplicates the board

SMART:    Board → Webhooks → Atlas Brain → Intelligence pushed BACK to board
                                         → Atlas UI (insights only)
                                         → Slack/Teams (alerts)
                                         → Browser extension (overlay)
                                         → API (embed anywhere)
```

---

## 5 Strategic Pillars

### Pillar 1: Universal Provider Adapter

**Problem**: Atlas is heavily ClickUp-coupled. Jira/Linear support is incomplete.

**Solution**: Abstract every board interaction behind a universal interface.

| Capability | What it means |
|-----------|---------------|
| **Unified data model** | One `Ticket`, `Sprint`, `Board`, `Member` schema that maps to any provider |
| **Provider plugins** | `JiraAdapter`, `ClickUpAdapter`, `LinearAdapter`, `AsanaAdapter`, `GitHubProjectsAdapter` — each implements the same interface |
| **Bi-directional sync** | Read tickets AND write back (comments, labels, custom fields, status changes) |
| **Webhook-first** | React to board events in real-time (ticket moved, sprint started, comment added) instead of polling |
| **Zero-config detection** | Auto-detect sprint structure, workflow states, custom fields from any board |

**New providers to support**: Jira Cloud, Jira Server/DC, Linear, Asana, Monday.com, GitHub Projects, Azure DevOps, Shortcut, Notion databases

### Pillar 2: Push Intelligence TO the Board

**Problem**: Insights live only in Atlas. Users must leave their board to see them.

**Solution**: Push Atlas intelligence directly into the tools teams already use.

| Feature | How it works |
|---------|-------------|
| **Smart labels** | Auto-apply labels to tickets: `atlas:at-risk`, `atlas:overestimated`, `atlas:blocked-chain`, `atlas:stale-14d` |
| **AI comments** | Post an Atlas comment on tickets with risk signals, estimation suggestions, dependency warnings |
| **Custom fields** | Populate custom fields: `Atlas Confidence`, `Complexity Score`, `Revenue Impact`, `Debt Score` |
| **Sprint summaries** | Auto-post sprint review/retro summaries as board documents or wiki pages |
| **Status automation** | Suggest or auto-move tickets based on signals (e.g., PR merged → move to Done) |
| **Digest notifications** | Daily/weekly intelligence digest posted to a board channel or document |

**Example flow**:
1. Developer moves ticket to "In Progress" in Jira
2. Webhook fires → Atlas Brain detects this ticket has 3 unresolved blockers
3. Atlas posts a Jira comment: "⚠️ This ticket has 3 blocking dependencies (PROJ-45, PROJ-67, PROJ-89). Consider resolving those first."
4. Atlas adds label `atlas:blocked-chain`
5. Sprint risk score updates in Atlas dashboard

### Pillar 3: Meet Teams Where They Work

**Problem**: Atlas is a standalone web app. Teams live in Slack, Jira, VS Code.

**Solution**: Deliver intelligence through the surfaces teams already use.

| Surface | What Atlas delivers |
|---------|-------------------|
| **Slack/Teams bot** | Daily standup prompts, sprint risk alerts, blocker notifications, "@atlas what's blocking the sprint?", sprint summary posts |
| **Browser extension** | Overlay on Jira/ClickUp pages: risk badge on tickets, accuracy prediction next to estimates, team capacity sidebar, sprint health indicator |
| **VS Code extension** | Show ticket context, complexity score, linked PRs, and Atlas suggestions while coding |
| **Email digests** | Weekly stakeholder reports, sprint summaries, risk escalations — auto-generated and sent |
| **Mobile push** | Critical alerts: sprint at risk, SLA breach, blocker escalation |
| **Embeddable widgets** | `<atlas-sprint-health project="X" />` — embed Atlas cards in any internal dashboard, wiki, or portal |
| **API-first** | Every Atlas insight available via REST/GraphQL for custom integrations |

### Pillar 4: Predictive Intelligence (not just descriptive)

**Problem**: Most current features show what happened. A smart layer should predict what will happen and prescribe what to do.

| Current (Descriptive) | Smart Layer (Predictive + Prescriptive) |
|----------------------|----------------------------------------|
| "Sprint velocity was 42 pts" | "Based on team availability and backlog complexity, next sprint will likely deliver 38±5 pts" |
| "3 tickets are blocked" | "PROJ-123 will become blocked in 2 days if PROJ-89 isn't resolved — here's a suggested re-ordering" |
| "Estimation accuracy was 67%" | "You consistently overestimate backend tasks by 30%. For PROJ-456, consider 5 pts instead of 8" |
| "Tech debt score is 7.2" | "If you address the auth module debt this sprint (-2 days), next sprint velocity increases by ~15%" |
| "Sprint is 60% complete" | "At current pace, you'll finish 78% of the sprint. Drop PROJ-789 (lowest priority, highest risk) to hit 95%" |

**New intelligence features**:

- **Sprint Outcome Simulator**: "What happens if we add/remove this ticket?" with confidence intervals
- **Team Load Balancer**: "Sarah has 150% capacity allocated, Jordan has 40%. Reassign PROJ-456 to Jordan for optimal throughput"
- **Blocker Cascade Predictor**: "If PROJ-89 isn't done by Wednesday, it will cascade-block 5 tickets across 2 teams"
- **Estimation Calibrator**: Per-developer, per-module calibration factors applied automatically to new estimates
- **Risk Heat Map**: Real-time risk scoring across all active sprints, all teams, all projects — one executive view
- **Anomaly Detection**: "This sprint has 3x the normal scope changes — flag for PM review"
- **Meeting Intelligence**: "Your planning meetings run 45min over average. Teams that timebox to 60min have 12% higher accuracy"

### Pillar 5: Cross-Project & Cross-Team Intelligence

**Problem**: Each project is siloed. Atlas doesn't see the big picture.

**Solution**: Intelligence that spans projects, teams, and tools.

| Feature | Description |
|---------|-------------|
| **Portfolio view** | All projects, all teams, all sprints in one executive dashboard |
| **Cross-team dependencies** | Team A's sprint depends on Team B's API — Atlas tracks this across boards |
| **Shared resource conflicts** | "Jordan is allocated to 3 sprints at 120% capacity across 2 projects" |
| **Organization benchmarks** | "Your team's accuracy is 72% — org average is 81%. Here's what top teams do differently" |
| **Knowledge transfer** | "Team B solved a similar blocking pattern last sprint. Here's what they did" |
| **Unified search** | Search across all projects, all providers, all tools — one ⌘K to find anything |
| **Impact analysis** | "This infrastructure change affects 12 tickets across 4 teams" |

---

## Feature Upgrade Matrix

What each existing feature becomes in the smart layer model:

| Current Feature | Smart Layer Upgrade |
|----------------|-------------------|
| **Dashboard** | Real-time risk radar with predictive sprint outcome, not just progress bars |
| **Tickets page** | Remove it — tickets live on the board. Replace with "AI Suggestions" overlay that pushes to board |
| **Burndown** | Predictive burndown with "what-if" simulator. Push daily burndown image to Slack |
| **Sprint Plan** | Auto-generate plan from backlog signals + capacity + velocity history. One-click push to any board |
| **Accuracy** | Per-developer calibration model. Auto-adjust estimates on the board via custom fields |
| **Backlog** | AI prioritization that writes priority scores back to the board as custom fields |
| **Dependencies** | Cross-board dependency graph. Auto-post warnings to blocked tickets on any provider |
| **Retro** | Auto-generated retro from sprint data. Post insights to board wiki/docs |
| **Standups** | Slack bot collects standups → Atlas analyzes → posts summary + flags blockers |
| **Meetings** | Calendar integration → auto-link discussed tickets → post action items back to board |
| **Capacity** | Pull availability from HR/Calendar APIs. Show on board as team capacity custom field |
| **Analytics** | Benchmarking across org. Auto-generated executive reports sent via email |
| **Revenue** | Tag tickets with revenue impact. Board custom field shows $ value per ticket |
| **Automations** | Provider-native automation rules. "When Atlas detects risk > 80%, move ticket to Review" |
| **Workflow Builder** | Cross-provider workflows. "When Jira ticket closes → update Linear ticket → notify Slack" |
| **Chat** | Available everywhere: Slack bot, browser extension, VS Code, in-app. Context-aware per page |
| **Security/PII** | Auto-scan on ticket create/update. Block PII before it reaches the board |

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1–4)
- [ ] Universal provider adapter interface
- [ ] Jira Cloud adapter (largest market)
- [ ] Linear adapter (fastest-growing market)
- [ ] Webhook ingestion pipeline (real-time events from all providers)
- [ ] Write-back engine (comments, labels, custom fields → board)

### Phase 2: Push Intelligence (Weeks 5–8)
- [ ] Smart label engine (auto-apply risk/status labels to board tickets)
- [ ] AI comment poster (risk warnings, estimation suggestions on tickets)
- [ ] Daily Slack/Teams digest bot
- [ ] Sprint summary auto-post to board wiki/channel
- [ ] Custom field sync (Atlas Confidence, Complexity Score → board)

### Phase 3: Surfaces (Weeks 9–12)
- [ ] Slack bot: standup collection, sprint alerts, "@atlas" queries
- [ ] Browser extension: Jira/ClickUp overlay with Atlas intelligence badges
- [ ] Embeddable widget SDK
- [ ] Public API with developer docs
- [ ] Email digest engine (stakeholder reports, sprint summaries)

### Phase 4: Predictive Engine (Weeks 13–16)
- [ ] Sprint outcome simulator with confidence intervals
- [ ] Per-developer estimation calibration model
- [ ] Blocker cascade predictor
- [ ] Team load balancer recommendations
- [ ] Anomaly detection (scope creep, velocity drops, unusual patterns)

### Phase 5: Cross-Org Intelligence (Weeks 17–20)
- [ ] Portfolio dashboard (all projects, all teams)
- [ ] Cross-team dependency tracking across boards
- [ ] Shared resource conflict detection
- [ ] Organization benchmarking
- [ ] Impact analysis engine

---

## Pages to Deprecate vs. Transform

### Remove (board duplication)
- `/tickets` — tickets should live on the board. Replace with AI Suggestions push-to-board.
- `/activity` — this is the board's activity feed. Replace with Atlas-specific signal feed.

### Transform (add intelligence layer)
- `/backlog` → "Backlog Intelligence" — keep the AI insights, remove the ticket list (link to board)
- `/sprint/burndown` → add prediction + push burndown chart to Slack daily
- `/standups` → make Slack-bot-first, web view becomes the archive
- `/meetings` → calendar-integration-first, auto-link tickets, auto-post action items

### Keep as-is (Atlas-native value)
- `/dashboard` — the intelligence hub
- `/sprint/plan` — AI planning is core Atlas value
- `/accuracy` — unique to Atlas, no board has this
- `/retro` — enhanced with auto-generation
- `/analytics` — cross-sprint intelligence
- `/revenue` — business impact mapping
- `/insights/debt` — tech debt intelligence
- `/insights/complexity` — complexity analysis
- `/workflow` — cross-provider automation
- `/chat` — AI assistant (extend to Slack/extension)
- `/security` — PII scanning
- `/nexus` — signal feed

---

## Key Metrics for Success

| Metric | Target |
|--------|--------|
| Time in Atlas vs. time on board | < 10% of workflow in Atlas (intelligence should be pushed out) |
| Board write-backs per sprint | > 50 (labels, comments, fields pushed to board) |
| Prediction accuracy | > 80% sprint outcome predictions within ±10% |
| Provider coverage | 5+ board providers supported |
| Time to value | < 5 min from board connection to first intelligence insight |
| Slack/extension engagement | > 60% of daily interactions happen outside Atlas web app |

---

## Summary

Atlas should evolve from **"a dashboard you visit"** to **"an intelligence engine that works for you"**. The web app becomes the control plane (configure, deep-dive, plan), while intelligence flows outward to every surface where teams already work.

The moat is not the UI — it's the **intelligence model** trained on sprint patterns, estimation accuracy, team dynamics, and codebase signals. That model should power every surface: the board, Slack, email, browser, IDE, and API.
