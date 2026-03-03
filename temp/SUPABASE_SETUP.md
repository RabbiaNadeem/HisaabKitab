# Supabase Setup Guide

Your HisaabKitab project is now integrated with Supabase! Follow these steps to complete the setup.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or sign in to your account
3. Create a new project
4. Wait for the project to be provisioned

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon/public key** (this is safe to expose in frontend code)

⚠️ **IMPORTANT SECURITY NOTE**: Only use the `anon/public` key in frontend code. Never use the `service_role` key in frontend applications as it bypasses all security rules.

## 3. Update Environment Variables

Update the `.env` file in your project root with your actual Supabase credentials:

```env
# Replace with your actual Supabase project URL
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Replace with your actual Supabase anon key (safe for frontend)
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Database Schema (Optional)

For a bookkeeping application, you might want to create these tables in your Supabase database:

```sql
-- Users table (automatically created by Supabase Auth)

-- Categories table
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions table
create table transactions (
  id uuid default gen_random_uuid() primary key,
  amount decimal(10,2) not null,
  description text,
  date date not null default current_date,
  category_id uuid references categories(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table categories enable row level security;
alter table transactions enable row level security;

-- Create policies
create policy "Users can view own categories" on categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on categories for delete using (auth.uid() = user_id);

create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on transactions for delete using (auth.uid() = user_id);
```

## 5. Generate TypeScript Types (Optional)

Install Supabase CLI and generate types:

```bash
npm install -g supabase
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

Then update `src/lib/supabase.ts` to use the generated types.

## 6. Available Features

Your project now includes:

### Authentication
- Sign up / Sign in with email and password
- Authentication context and hooks
- Protected routes with AuthGuard

### Database Operations
- Generic CRUD operations in `src/lib/supabase-utils.ts`
- React Query integration for data fetching
- Custom hooks in `src/hooks/useSupabase.ts`

### File Storage
- File upload/download utilities
- Public URL generation

## 7. Usage Examples

### Using Authentication
```tsx
import { useAuthContext } from './contexts/AuthContext'

function MyComponent() {
  const { user, signIn, signOut } = useAuthContext()
  
  // Your component logic
}
```

### Fetching Data
```tsx
import { useSupabaseQuery } from './hooks/useSupabase'

function TransactionsList() {
  const { data: transactions, loading, error } = useSupabaseQuery<Transaction>(
    'transactions',
    '*',
    { user_id: user.id }
  )
  
  // Your component logic
}
```

### Inserting Data
```tsx
import { useSupabaseInsert } from './hooks/useSupabase'

function AddTransaction() {
  const insertTransaction = useSupabaseInsert<Transaction>('transactions')
  
  const handleSubmit = (data) => {
    insertTransaction.mutate(data)
  }
  
  // Your component logic
}
```

## 8. Security Best Practices

- ✅ The `anon/public` key is used correctly in frontend code (safe to expose)
- ✅ Row Level Security (RLS) is enabled on all tables
- ✅ All database policies are user-scoped using `auth.uid()`
- ⚠️ Never use the `service_role` key in frontend applications
- ⚠️ Always validate data on the backend through RLS policies

## 9. Next Steps

1. Update your `.env` file with actual Supabase credentials
2. Create your database schema
3. Start building your bookkeeping features!

For more information, visit the [Supabase Documentation](https://supabase.com/docs).