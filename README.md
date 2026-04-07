# HisaabKitab

HisaabKitab is a personal finance tracker built with React, TypeScript, and Supabase. It combines transaction management, budgets, goals, reporting, and AI-assisted finance features in a single application.

## Overview

The application is designed to help users record income and expenses quickly, understand spending patterns, and receive AI-generated assistance for transaction parsing, financial insights, and chat-based analysis.

## Features

- Authentication with Supabase Auth
- Transaction management for income and expenses
- AI quick add for natural-language transaction entry
- AI-generated monthly insights on the dashboard
- AI chat assistant for finance-related questions
- Categories with custom icons
- Monthly budgets with progress tracking
- Savings goals with deadlines and targets
- Dashboard summary of income, expenses, balance, and trends
- Charts and reports for spending analysis
- Dark and light theme support

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Supabase Auth, PostgreSQL, Edge Functions |
| AI Services | OpenRouter via Supabase Edge Functions |
| Data Fetching | TanStack Query |
| Forms | React Hook Form, Zod |
| Charts | Recharts |
| State | Zustand |

## AI Features

### Transaction Parsing

Users can enter a transaction in plain language, for example: `Paid Rs.1500 for groceries yesterday`. The frontend sends the request to the `ai-parse` Supabase Edge Function, which calls OpenRouter and returns structured transaction data.

### Dashboard Insights

The dashboard uses the `ai-insights` Edge Function to generate concise observations from monthly financial data. These insights are grouped by type, such as positive, warning, negative, and informational.

### AI Chat Assistant

The floating chat assistant uses the `ai-chat` Edge Function to answer questions using the user’s current financial context, including transactions, budgets, goals, and trends.

## Prerequisites

- Node.js 18 or later
- pnpm
- A Supabase project
- An OpenRouter account

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/RabbiaNadeem/HisaabKitab.git
cd HisaabKitab
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure local environment variables

Create a `.env` file in the project root with your Supabase values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

These values are read by [src/lib/supabase.ts](src/lib/supabase.ts).

### 4. Configure the OpenRouter secret in Supabase

The OpenRouter API key is stored as a Supabase secret and is only used server-side by Edge Functions.

```bash
supabase link --project-ref your-project-ref
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 5. Deploy the Edge Functions

```bash
supabase functions deploy ai-parse --no-verify-jwt
supabase functions deploy ai-insights --no-verify-jwt
supabase functions deploy ai-chat --no-verify-jwt
```

### 6. Run the app locally

```bash
pnpm dev
```

### 7. Create a production build

```bash
pnpm build
```

## Project Structure

```text
hisaabkitab/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── store/
│   └── types/
├── supabase/
│   └── functions/
│       ├── ai-chat/
│       ├── ai-insights/
│       └── ai-parse/
└── .env
```

## Security Model

| Item | Handling |
| --- | --- |
| OpenRouter API key | Stored in Supabase secrets, not in the browser |
| Supabase anon key | Stored in local `.env` for frontend access |
| Edge Function requests | Routed server-side through Supabase |
| API secrets in DevTools | Not exposed |

## Available Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Vite development server |
| `pnpm build` | Type-check and build the production bundle |
| `pnpm lint` | Run ESLint across the project |
| `pnpm preview` | Preview the production build locally |

## License

MIT
