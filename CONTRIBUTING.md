# Contributing to ATLAS

Thank you for your interest in contributing to ATLAS! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Component Guidelines](#component-guidelines)
- [Page Creation Guide](#page-creation-guide)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please be respectful and constructive in all interactions.

---

## Getting Started

### Prerequisites

- Node.js 18.17+
- npm (v9+), yarn, pnpm, or bun
- Git

### Setup

```bash
git clone https://github.com/your-org/atlas-app.git
cd atlas-app
npm install
npm run dev
```

### Verify Your Setup

```bash
npm run build    # Should compile with 0 errors
npm run lint     # Should pass ESLint checks
```

---

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the [Code Standards](#code-standards)

3. Verify the build passes:
   ```bash
   npm run build
   ```

4. Commit using the [Commit Convention](#commit-convention)

5. Open a Pull Request

---

## Code Standards

### TypeScript

- Use strict TypeScript - avoid `any` types
- Define interfaces for all data structures
- Export types from `src/lib/mock-data.ts` for shared type definitions
- Use proper React.FC or function component typing

### Styling

- Use **Tailwind CSS** classes for all styling
- Follow the ATLAS theme tokens (see `src/app/globals.css`):
  - Background: `#0a0a0f`
  - Surface: `#12121a`
  - Cards: `#1a1a2e`
  - Borders: `#2a2a3a`
  - Brand orange: `#f16e2c`
  - Text: `#e8e8ed`
  - Muted: `#6b6b80`
- **No external CSS files** - use Tailwind classes and inline `<style>` tags for @keyframes
- **No `max-w-*` constraints** on page-level wrappers (full width)

### Icons

- Use **lucide-react** exclusively - do not add other icon libraries
- Import only the icons you need (tree-shakeable)

### Animations

- Use **Framer Motion** for page transitions and scroll reveals
- Use **CSS @keyframes** (via inline `<style>` tags) for micro-interactions
- Always namespace animation names to avoid conflicts (e.g., `dashPulse`, `retroFade`)
- Respect `prefers-reduced-motion`

### State Management

- Use React `useState` and `useEffect` for local state
- No global state libraries (Redux, Zustand, etc.) at this time
- Keep state as close to where it's used as possible

---

## Component Guidelines

### Shared Components (`src/components/`)

- `ui.tsx` - Reusable UI primitives (Badge, Button, Card, etc.)
- `Reveal.tsx` - Scroll-triggered animation wrapper
- `TabBar.tsx` - Tab navigation with responsive mobile support
- `SlideOver.tsx` - Slide-over modal panel

### Using Components

```tsx
import { Card, Badge, Button } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
```

### Card Component

The `Card` component does **not** accept a `style` prop. If you need inline styles, wrap the Card in a `<div>`:

```tsx
// WRONG - will cause build errors
<Card style={{ animation: '...' }}>

// CORRECT
<div style={{ animation: '...' }}>
  <Card>...</Card>
</div>
```

---

## Page Creation Guide

### Directory Structure

All main app pages go in `src/app/(main)/your-page/page.tsx`.

### Template

```tsx
'use client';

import { useState } from 'react';
import { Reveal } from '@/components/Reveal';
import { Card, Badge, Button } from '@/components/ui';
import { SomeIcon } from 'lucide-react';

export default function YourPage() {
  return (
    <>
      <style>{`
        @keyframes yourPageFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Reveal>
        <div className="space-y-8 px-2 sm:px-4 lg:px-6 py-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-[#e8e8ed]">
              Page Title
            </h1>
            <p className="text-[#6b6b80] mt-1">Description</p>
          </div>

          {/* Content */}
          {/* ... */}
        </div>
      </Reveal>
    </>
  );
}
```

### Checklist for New Pages

- [ ] File at `src/app/(main)/route-name/page.tsx`
- [ ] `'use client'` directive at top
- [ ] Uses ATLAS theme colors
- [ ] No `max-w-*` on outermost wrapper
- [ ] Uses `Reveal` for scroll animations
- [ ] Icons from `lucide-react` only
- [ ] Navigation link added to `Sidebar.tsx`
- [ ] Build passes (`npm run build`)

---

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(dashboard): add velocity chart with 6-sprint history
fix(sidebar): correct navigation href for accuracy page
style(backlog): add priority distribution chart
refactor(mock-data): extract team member types
docs(readme): update project structure documentation
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature or page |
| `fix` | Bug fix |
| `style` | Visual/CSS changes |
| `refactor` | Code refactoring |
| `docs` | Documentation |
| `chore` | Build, tooling, dependencies |

---

## Pull Request Process

1. Ensure `npm run build` passes with 0 errors
2. Update `README.md` if adding new pages/routes
3. Update `CHANGELOG.md` with your changes
4. Add navigation to `Sidebar.tsx` if creating new pages
5. Request review from at least one team member
6. Squash and merge when approved

### PR Title Format

```
feat(scope): Short description of changes
```

### PR Description Template

```markdown
## Summary
Brief description of what changed and why.

## Changes
- Added X page with Y features
- Updated sidebar navigation
- Fixed Z component

## Screenshots
[Include screenshots for visual changes]

## Checklist
- [ ] Build passes
- [ ] New pages added to sidebar
- [ ] README updated
- [ ] CHANGELOG updated
```

---

## Questions?

If you have questions about contributing, open an issue or reach out to the ATLAS team.
