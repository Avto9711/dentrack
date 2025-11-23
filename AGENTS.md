# Repository Guidelines

## Project Structure & Module Organization
- Vite + React (Ionic) with TypeScript. Entrypoint: `src/main.tsx`; layout shell: `src/App.tsx`.
- Routing and page UI live in `src/pages/*` (Dashboard, Patients, Appointments, Budgets, PatientDetail).
- Reusable pieces in `src/components/*` and domain logic split by feature folders under `src/features/*`.
- Shared utilities, hooks, types, and theme tokens sit in `src/utils`, `src/hooks`, `src/types`, and `src/theme`.
- Environment configuration is centralized in `src/config/environment.ts` and reads from `VITE_` variables.

## Build, Test, and Development Commands
- `npm run dev` — start the Vite dev server (e.g., `npm run dev -- --host 127.0.0.1 --port 5173` for LAN access).
- `npm run build` — type-checks then builds to `dist/`.
- `npm run preview` — serves the built bundle from `dist/` for local QA.
- `npm run typecheck` — run TypeScript without emitting files to catch typing issues early.

## Coding Style & Naming Conventions
- TypeScript everywhere; prefer explicit types for props and return values in shared utilities.
- React components in PascalCase (`PatientCard`); hooks prefixed with `use*`; file names follow the exported component/hook name.
- Favor Ionic components from `@ionic/react` for layout and controls; keep cross-cutting UI in `src/components`.
- Keep styles in `main.css` or feature-scoped styles; use `theme` tokens instead of hard-coded colors.
- Organize imports by std/lib, third-party, then local paths; use relative paths within a feature, absolute aliases only if configured.

## Testing Guidelines
- No automated test suite is present yet; add unit/UI tests colocated with the feature (`src/features/<area>/__tests__`) using a small runner such as Vitest + React Testing Library.
- For manual QA, use `npm run preview` against a production-like build and verify key flows (dashboard load, patient search/detail, appointment creation).
- Aim to reproduce reported issues with minimal repro steps and log them in PR descriptions.

## Commit & Pull Request Guidelines
- Commit messages: concise, present-tense/imperative (“Add appointment list filtering”). Group related changes together.
- PRs should include: brief summary of behavior changes, screenshots/GIFs for UI tweaks, steps to reproduce/verify, and linked issue/task IDs.
- Note any config needs (e.g., `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` for Supabase) so reviewers can run locally without surprises.
