# Project Structure

## Root Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration with `@/*` path mapping
- `next.config.ts` - Next.js configuration
- `components.json` - shadcn/ui configuration (New York style)
- `eslint.config.mjs` - ESLint configuration
- `postcss.config.mjs` - PostCSS configuration
- `.env.local` - Environment variables (not tracked)

## Source Organization (`src/`)

### App Router (`src/app/`)
- `layout.tsx` - Root layout with Geist fonts and global styles
- `page.tsx` - Homepage component
- `globals.css` - Global Tailwind CSS styles
- `favicon.ico` - Site favicon

#### Route Groups
- `(homepage)/` - Homepage route group
- `api/quiz/` - Quiz API endpoints
- `play/[sessionId]/` - Dynamic quiz session pages

### Components (`src/components/`)
- `ui/` - Reusable UI components following shadcn/ui patterns
  - `button.tsx` - Button component with CVA variants
  - `card.tsx` - Card component
  - `dialog.tsx` - Modal dialog component
  - `input.tsx` - Input field component
  - `QuizCard.tsx` - Quiz-specific card component
  - `Leaderboard.tsx` - Leaderboard display component

### Libraries (`src/lib/`)
- `utils.ts` - Utility functions (cn for className merging)
- `supabase.ts` - Supabase client configuration
- `openai.ts` - OpenAI API client setup

## Static Assets (`public/`)
- SVG icons and images (Next.js, Vercel logos, etc.)

## Conventions
- Use TypeScript for all source files
- Follow Next.js App Router patterns
- Components use PascalCase naming
- Utilities and configs use camelCase
- API routes follow REST conventions under `/api`
- Dynamic routes use bracket notation `[param]`