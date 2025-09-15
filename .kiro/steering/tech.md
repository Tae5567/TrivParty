# Technology Stack

## Framework & Runtime
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety and development experience
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Component library (New York style variant)
- **Radix UI** - Headless UI primitives (@radix-ui/react-dialog, @radix-ui/react-slot)
- **Lucide React** - Icon library
- **class-variance-authority (CVA)** - Component variant management
- **clsx + tailwind-merge** - Conditional className utilities

## Backend & Data
- **Supabase** - Backend-as-a-Service for database and real-time features
- **OpenAI API** - AI-powered quiz generation

## Development Tools
- **ESLint** - Code linting with Next.js config
- **PostCSS** - CSS processing

## Common Commands

### Development
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Package Management
```bash
npm install          # Install dependencies
npm install <package> # Add new dependency
```

## Path Aliases
- `@/*` maps to `./src/*` for clean imports