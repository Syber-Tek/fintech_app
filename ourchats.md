task 1: create a custom toast. make it a component and it should have the danger,waring,error,and success color and icon.
task 2: link the toast with the other pages and remove the toast i installed
task 3: add a feature such that will also send a toast message when the user is offline or theres no internet connection
 use this as inspiration fo rthe toast React Native\FinTech\assets\original-72c122d4b5755e76da84a5c.png and this React Native\FinTech\assets\Screenshot 2026-03-12 100813.png

---

### Supabase Schema (SQL) - Fintech Features
Run this SQL in your Supabase SQL Editor. It uses the `fintech` schema as defined in your `lib/supabase.ts`.

```sql
-- Create the fintech schema if not exists
CREATE SCHEMA IF NOT EXISTS fintech;

-- 1. PROFILES (Extends Auth)
CREATE TABLE IF NOT EXISTS fintech.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ACCOUNTS (Core balance storage)
CREATE TABLE IF NOT EXISTS fintech.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_name TEXT NOT NULL, -- e.g., 'Main Checking', 'Savings'
  account_type TEXT CHECK (account_type IN ('checking', 'savings', 'investment', 'credit')),
  balance DECIMAL(12,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CARDS (Linked to Accounts)
CREATE TABLE IF NOT EXISTS fintech.cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES fintech.accounts(id) ON DELETE CASCADE NOT NULL,
  card_holder_name TEXT NOT NULL,
  last_four TEXT NOT NULL,
  expiry_date TEXT NOT NULL, -- Format MM/YY
  card_type TEXT DEFAULT 'virtual' CHECK (card_type IN ('virtual', 'physical')),
  provider TEXT CHECK (provider IN ('visa', 'mastercard')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CATEGORIES (For Transaction/Expense categorization)
CREATE TABLE IF NOT EXISTS fintech.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT, -- Lucide/Phosphor icon name
  color TEXT -- Hex color for UI
);

-- Seed some default categories
INSERT INTO fintech.categories (name, icon, color) VALUES
('Food & Dining', 'ForkKnife', '#EF4444'),
('Transport', 'Car', '#3B82F6'),
('Shopping', 'ShoppingBag', '#8B5CF6'),
('Bills & Utilities', 'Receipt', '#F59E0B'),
('Entertainment', 'GameController', '#EC4899'),
('Salary', 'TrendUp', '#10B981'),
('Transfer', 'ArrowsLeftRight', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- 5. TRANSACTIONS (Payments, Expenses, and Income)
CREATE TABLE IF NOT EXISTS fintech.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES fintech.accounts(id) ON DELETE CASCADE NOT NULL,
  category_id INTEGER REFERENCES fintech.categories(id),
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  description TEXT,
  merchant_name TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SAVINGS GOALS (Targets for users)
CREATE TABLE IF NOT EXISTS fintech.savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0.00,
  target_date DATE,
  account_id UUID REFERENCES fintech.accounts(id) ON DELETE SET NULL, -- Source account
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES (Enable Security)
ALTER TABLE fintech.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech.savings_goals ENABLE ROW LEVEL SECURITY;

-- Simple "User can only see their own data" policies
CREATE POLICY "Users can view own profile" ON fintech.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON fintech.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own accounts" ON fintech.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cards" ON fintech.cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own transactions" ON fintech.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own savings" ON fintech.savings_goals FOR ALL USING (auth.uid() = user_id);

-- Categories are public (readable by all)
ALTER TABLE fintech.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for categories" ON fintech.categories FOR SELECT TO authenticated USING (true);
```

### Why this structure?
- **Efficiency:** **Expenses** are not a separate table; they are simply **Transactions** where `type = 'expense'`. This makes your logic much simpler and more consistent.
- **Flexibility:** **Payments** are also just transactions. Whether you're paying a bill or a friend, it's an outgoing transaction.
- **Normalization:** Cards are linked to accounts, and accounts are linked to users. This follows real-world banking logic.
- **Scalability:** The `categories` table allows you to add or change expense categories without modifying your main transaction logic.