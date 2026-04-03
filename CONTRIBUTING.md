# Contributing to Venn with Friends

Thank you for your interest in contributing! This guide covers the development workflow, code conventions, and PR process.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/hondoentertainment/giant-schrodinger.git
cd giant-schrodinger

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app runs at `http://localhost:5173/giant-schrodinger/` — no environment variables required.

---

## Development Workflow

### Branch Naming

- `feature/short-description` — New features
- `fix/short-description` — Bug fixes
- `refactor/short-description` — Code restructuring
- `docs/short-description` — Documentation only
- `test/short-description` — Test additions or fixes

### Commit Messages

Use concise, descriptive commit messages:

```
feat: add score coaching tips to reveal screen
fix: prevent concept repetition within session
refactor: extract ProfileForm from Lobby.jsx
test: add integration tests for judge flow
docs: update NEXT_STEPS.md with Phase 6 roadmap
```

Prefix with the type of change: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, atomic commits
3. Run all checks before pushing:
   ```bash
   npm run test        # 179 unit/integration tests must pass
   npm run lint        # Check for new lint errors
   npm run build       # Production build must succeed
   ```
4. Open a PR against `main` with:
   - Clear title (under 70 characters)
   - Summary of changes
   - Test plan (how to verify the changes work)
5. CI will run tests, E2E, and Lighthouse checks automatically

---

## Project Structure

```
src/
  features/      # Feature modules — one directory per feature
  services/      # Business logic and external API integrations
  context/       # React Context providers (game state, rooms, toasts)
  components/    # Shared, reusable UI components
  hooks/         # Custom React hooks
  lib/           # Pure utility functions
  data/          # Static data (themes, concept images)
  locales/       # i18n translation JSON files
  test/          # Test setup and shared test utilities
e2e/             # Playwright end-to-end tests
supabase/        # Database schema and Edge Functions
discord-bot/     # Discord bot (separate package)
```

### Where to Put New Code

| Type | Location | Example |
|------|----------|---------|
| New game mode | `src/features/<mode>/` | `src/features/ranked/` |
| API integration | `src/services/<name>.js` | `src/services/gemini.js` |
| Shared UI component | `src/components/<Name>.jsx` | `src/components/Toast.jsx` |
| Custom hook | `src/hooks/use<Name>.js` | `src/hooks/useFocusTrap.js` |
| Utility function | `src/lib/<name>.js` | `src/lib/validation.js` |
| Static data | `src/data/<name>.js` | `src/data/themes.js` |
| Database changes | `supabase/schema.sql` | Add tables, RLS policies |
| Edge Function | `supabase/functions/<name>/` | `supabase/functions/score-submission/` |

---

## Code Conventions

### General

- **React 18** with functional components and hooks only (no class components)
- **Tailwind CSS** for all styling — no separate CSS files
- **ES modules** (`import`/`export`) — no CommonJS in `src/`
- **No TypeScript** — the project uses plain JavaScript with JSX

### File Naming

- React components: `PascalCase.jsx` (e.g., `VennDiagram.jsx`)
- Services/utilities: `camelCase.js` (e.g., `achievements.js`)
- Test files: `<filename>.test.jsx` or `<filename>.test.js`
- E2E specs: `<name>.spec.js`

### Component Patterns

```jsx
// Feature component with context
import { useGame } from '../../context/GameContext';

export default function MyFeature({ onBack }) {
  const { state, dispatch } = useGame();
  
  return (
    <div className="p-4">
      {/* Component content */}
    </div>
  );
}
```

### State Management

- **GameContext** — Game state, rounds, streaks, achievements, scores
- **RoomContext** — Multiplayer room state via Supabase Realtime
- **ToastContext** — Toast notification queue
- **localStorage** — User preferences, offline data, session persistence

Prefer context for shared state. Use `useState` for component-local state. Avoid prop drilling more than 2 levels — use context instead.

### Testing

- **Unit/integration tests**: Vitest + React Testing Library + MSW
- **E2E tests**: Playwright (Desktop Chrome, Firefox, Mobile Safari)
- Tests live next to the code they test: `MyComponent.test.jsx` alongside `MyComponent.jsx`

```jsx
// Example test
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders the title', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest (179 unit/integration tests) |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Generate HTML coverage report |
| `npm run test:e2e` | Run Playwright E2E tests (all browsers) |
| `npm run test:e2e:ui` | Run Playwright with interactive UI |
| `npm run test:e2e:desktop` | E2E — desktop browsers only |
| `npm run test:e2e:mobile` | E2E — mobile viewport only |
| `npm run lint` | ESLint check |

---

## Environment Setup (Optional)

All external services are optional — the app gracefully falls back to mock data:

| Service | What it enables | Setup guide |
|---------|----------------|-------------|
| Supabase | Real multiplayer, leaderboards, persistence | [SETUP.md](SETUP.md) |
| Google Gemini | AI scoring and fusion image generation | [SETUP.md](SETUP.md) |
| Stripe | Payment processing in shop | [SETUP.md](SETUP.md) |
| Sentry | Production error tracking | [SETUP.md](SETUP.md) |

---

## Known Issues

See [NEXT_STEPS.md](NEXT_STEPS.md) for the full list of known issues and planned improvements. Key items for contributors:

- **59 ESLint errors** — Mostly unused variables and imports. Good first-contribution targets.
- **Main bundle is 510 KB** (149 KB gzipped) — Needs further code splitting.
- **No component integration tests** — Service tests exist but UI flow tests are missing.
- **PWA manifest** may need icon assets in `public/`.

---

## Getting Help

- Open an issue for bugs or feature proposals
- Check [EXPECTED_BEHAVIORS.md](EXPECTED_BEHAVIORS.md) for intended feature behavior
- Check [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) for testing specific flows
