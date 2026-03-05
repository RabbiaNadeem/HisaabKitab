# HisaabKitab 📒

A smart personal finance tracker built with React, TypeScript, and Supabase — featuring **AI-powered transaction parsing** so you can add transactions in plain language.

---

## ✨ Features

- 🔐 **Authentication** — Sign up / Sign in via Supabase Auth
- 💸 **Transactions** — Add, edit, delete income and expense transactions
- 🤖 **AI Quick Add** — Type "Paid Rs.1500 for groceries yesterday" and it saves instantly
- 🧠 **AI Insights** — Get 4 AI-generated financial insights on your Dashboard every month
- 📁 **Categories** — Organize transactions with custom categories and icons
- 💰 **Budgets** — Set monthly budgets per category with progress tracking
- 🎯 **Goals** — Track savings goals with target amounts and deadlines
- 📊 **Dashboard** — Overview of income, expenses, balance, and spending trends
- 📈 **Reports** — Visual charts and category breakdowns
- 🌙 **Dark / Light Mode** — Theme toggle with persistent preference

---

## 🛠️ Tech Stack

| Layer          | Technology                                   |
|----------------|----------------------------------------------|
| Frontend       | React 18, TypeScript, Vite                   |
| Styling        | Tailwind CSS, shadcn/ui                       |
| Backend        | Supabase (Auth, PostgreSQL, Edge Functions)  |
| AI Parsing     | OpenRouter API via Supabase Edge Function    |
| AI Insights    | OpenRouter API via Supabase Edge Function    |
| Data Fetching  | TanStack Query (React Query v5)              |
| Forms          | React Hook Form + Zod                        |
| Charts         | Recharts                                     |
| State          | Zustand                                      |

---

## 🤖 AI Quick Add

HisaabKitab lets users add transactions using natural language. The AI runs entirely server-side via a **Supabase Edge Function** — the API key is never exposed to the browser.

**How it works:**
```
User types: "Paid Rs.1500 for groceries yesterday"
        ↓
React calls supabase.functions.invoke('ai-parse')
        ↓
Edge Function (Deno) calls OpenRouter API
  → OPENROUTER_API_KEY stored securely in Supabase secrets
        ↓
Returns: { amount, type, category, date, description }
        ↓
Transaction saved directly to database
        ↓
Appears instantly in Dashboard and Transactions tab

**Deploy the Edge Function:**
```bash
supabase functions deploy ai-insights --no-verify-jwt
```

```

**Why Edge Function?**
The `OPENROUTER_API_KEY` never touches the browser. It lives in Supabase's secure server environment, invisible to DevTools or network inspection.

---

## 🧠 AI Insights

The Dashboard features an **AI Insights card** that analyses your monthly financial data and surfaces 4 concise, personalised observations — each colour-coded by type.

| Type | Colour | Example |
|------|--------|---------|
| ✅ Positive | Green | "Your savings rate of 32% this month is excellent." |
| ⚠️ Warning | Yellow | "Food spending is up 18% compared to last month." |
| ❌ Negative | Red | "Expenses exceeded income by Rs.3,200 this month." |
| ℹ️ Info | Blue | "Groceries is your top spending category at 41%." |

**How it works:**
```
Dashboard aggregates current & previous month data
  → income, expenses, savings rate, per-category breakdown
        ↓
React calls supabase.functions.invoke('ai-insights')
        ↓
Edge Function (Deno) sends financial summary to OpenRouter API
  → OPENROUTER_API_KEY stored securely in Supabase secrets
        ↓
Returns: [{ type, text }, { type, text }, { type, text }, { type, text }]
        ↓
Insights rendered in the Dashboard card with icons and colours
```

**Deploy the Edge Function:**
```bash
supabase functions deploy ai-insights --no-verify-jwt
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- `pnpm` installed (`npm i -g pnpm`)
- Supabase account
- OpenRouter account (free tier available at [openrouter.ai](https://openrouter.ai))

### 1. Clone the repository
```bash
git clone https://github.com/RabbiaNadeem/HisaabKitab.git
cd HisaabKitab
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set up the AI Edge Function

#### Set the OpenRouter API key as a Supabase secret:
```bash
supabase link --project-ref your-project-ref
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

#### Deploy both Edge Functions:
```bash
supabase functions deploy ai-parse --no-verify-jwt
supabase functions deploy ai-insights --no-verify-jwt
```

### 5. Run the development server
```bash
pnpm dev
```

### 6. Build for production
```bash
pnpm build
```

---

## 📁 Project Structure

```
hisaabkitab/
├── src/
│   ├── components/
│   │   ├── forms/
│   │   │   └── TransactionForm.tsx   # Add/Edit form with AI Quick Add
│   │   ├── layout/                   # AppLayout, Header, Sidebar
│   │   ├── shared/                   # CategoryBadge, CurrencyDisplay, etc.
│   │   └── ui/                       # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAiParse.ts             # AI transaction parsing hook
│   │   ├── useAiInsights.ts          # AI insights hook
│   │   ├── useTransactions.ts
│   │   ├── useBudgets.ts
│   │   ├── useGoals.ts
│   │   └── ...
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   ├── BudgetsPage.tsx
│   │   ├── GoalsPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── lib/
│   │   └── supabase.ts               # Supabase client
│   └── types/
│       └── database.ts               # TypeScript types
├── supabase/
│   └── functions/
│       ├── ai-parse/
│       │   └── index.ts              # Edge Function — natural language → transaction JSON
│       └── ai-insights/
│           └── index.ts              # Edge Function — financial summary → AI insights
└── .env                              # Local env variables (never commit)
```

---

## 🔐 Security

| Item | Status |
|------|--------|
| OpenRouter API key | ✅ Stored in Supabase secrets (server-side only) |
| `.env` file | ✅ In `.gitignore` |
| `supabase/.env` | ✅ In `.gitignore` |
| `supabase/functions/.env` | ✅ In `.gitignore` |
| API key in browser / DevTools | ✅ Never exposed |

---

## 📜 License

MIT
