# Foresight Development Roadmap

> **Last Updated**: December 31, 2025  
> **Current State**: Web Prototype (Vite + React)  
> **Target State**: Production React Native App (Expo)

---

## Executive Summary

Foresight is currently a **web-based UI mockup** demonstrating the visual design and UX concepts. It has ~65% UI completion but 0% real functionality. All data is mocked, there's no backend integration, and it runs on web instead of the target React Native platform.

**Estimated Time to MVP**: 12-16 weeks

---

## Current Implementation Status

### Platform & Architecture

| Aspect | Vision Spec | Current State | Gap |
|--------|-------------|---------------|-----|
| Framework | React Native (Expo managed) | React Web (Vite) | 🔴 Critical |
| Architecture | Feature-First | Flat folders | 🔴 Critical |
| State Management | Zustand / TanStack Query | Local useState | 🟡 Medium |
| Local Database | WatermelonDB / Realm | None (mock arrays) | 🔴 Critical |
| Backend | Supabase | None | 🔴 Critical |
| Styling | NativeWind (Tailwind) | Tailwind CDN | 🟡 Medium |
| Animations | React Native Reanimated | Framer Motion | 🟡 Medium |

### 5 Core Screens Completion

| Screen | UI % | Functionality % | Key Gaps |
|--------|------|-----------------|----------|
| Dashboard | 85% | 0% | Real data, dynamic calculations, "Add Goal" modal |
| Transaction Stream | 70% | 0% | Infinite scroll, pending states, search |
| Insights Tab | 90% | 0% | Real AI backend, functional action buttons |
| Add Transaction | 60% | 0% | Real NLP parsing, voice input |
| Settings/Profile | 40% | 0% | Data export, account linking, preferences |

### Feature Implementation Status

#### 🔴 Missing Entirely
- Predictive Cashflow Engine (real Safe-to-Spend calculation)
- Bank Sync (Plaid/Yodlee integration)
- Real AI Insights (LLM-powered analysis)
- Weather-Correlated Spending Analysis
- Collaborative Spaces (shared budgets)
- Haptic Feedback
- Voice Input (speech-to-text)
- Data Export (CSV/JSON)
- Overdraft Prediction
- Subscription Auto-Detection
- Push Notifications

#### 🟡 Mocked (UI exists, fake logic)
- Natural Language Parsing → Currently regex simulation
- AI Insights Feed → Static array in mockData.ts
- Safe-to-Spend Number → Hardcoded $2,847
- Financial Health Score → Hardcoded 78
- Merchant Logos → External Clearbit URLs

#### 🟢 Partially Implemented
- Dashboard UI (70% - needs real data)
- Transaction List (60% - needs infinite scroll)
- Savings Goals / Liquid Gauge (50% - needs deposit/withdraw flow)
- Bill Tracking (40% - needs reminders, auto-pay)

---

## Technical Debt

### Type System Gaps

```typescript
// Missing from types.ts:

interface LinkedAccount {
  id: string;
  provider: 'plaid' | 'yodlee' | 'manual';
  institutionName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  lastFour: string;
  balance: number;
  lastSynced: string;
}

interface Space {
  id: string;
  name: string;
  members: SpaceMember[];
  budget: number;
  spent: number;
  category?: BudgetCategory;
}

interface RecurringTransaction {
  id: string;
  baseTransactionId: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  nextOccurrence: string;
  amount: number;
}

interface UserPreferences {
  currency: string;
  locale: string;
  notifications: NotificationSettings;
  privacyMode: boolean;
  biometricEnabled: boolean;
}

// Transaction interface missing:
// - geolocation?: { lat: number; lng: number }
// - aiTags?: string[]
// - isRecurring?: boolean
// - linkedAccountId?: string

// Insight interface missing:
// - actionUrl?: string
// - priority: 'high' | 'medium' | 'low'
// - expiresAt?: string
```

### Hardcoded Values to Extract
- `"****4521"` → Account display
- `"$34.5k"` → Net worth
- `"$1.9k"` → Bills total
- `"2024"` → Member since year
- `"2 Active"` → Linked accounts count
- `"Dec 31"` → Pay period end date

### Code Quality Issues
- `any` types in `App.tsx` (NavButton) and `Profile.tsx` (MenuItem)
- No error boundaries
- No loading/skeleton states
- No offline handling
- Clearbit logo URLs fail without internet

---

## Priority Implementation Roadmap

### Phase 0: Foundation (Week 1-3)
> Platform migration and core infrastructure

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Scaffold React Native (Expo) project | P0 | 3 days | None |
| Set up feature-first folder structure | P0 | 1 day | RN scaffold |
| Configure NativeWind (Tailwind) | P0 | 1 day | RN scaffold |
| Set up Supabase project (auth + db) | P0 | 2 days | None |
| Design database schema | P0 | 2 days | None |
| Add Zustand for state management | P0 | 1 day | RN scaffold |
| Port existing components to RN | P0 | 5 days | NativeWind |

**Deliverable**: Running React Native app with ported UI, Supabase connected

### Phase 1: Core Engine (Week 4-6)
> Real data and cashflow logic

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Implement User authentication flow | P1 | 3 days | Supabase |
| Create Transaction CRUD operations | P1 | 2 days | Supabase |
| Build Cashflow Engine (Safe-to-Spend) | P1 | 3 days | Transactions |
| Implement Financial Health Score algorithm | P1 | 2 days | Transactions |
| Add recurring transaction detection | P1 | 2 days | Transactions |
| Build Bill tracking with due dates | P1 | 2 days | Transactions |
| Implement Savings Goals with deposits | P1 | 2 days | Supabase |

**Deliverable**: Functional app with real calculations, user accounts, manual transaction entry

### Phase 2: Bank Integration (Week 7-9)
> Automated data sync

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Integrate Plaid SDK | P2 | 3 days | Auth flow |
| Build account linking flow | P2 | 3 days | Plaid |
| Implement transaction sync | P2 | 3 days | Plaid |
| Add merchant logo resolution | P2 | 2 days | Transactions |
| Build sync status indicators | P2 | 1 day | Plaid |
| Handle Plaid errors gracefully | P2 | 2 days | Plaid |

**Deliverable**: Users can link bank accounts and auto-import transactions

### Phase 3: AI Features (Week 10-12)
> Intelligence layer

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Integrate OpenAI API | P3 | 2 days | None |
| Build NLP transaction parser | P3 | 3 days | OpenAI |
| Implement spending pattern analysis | P3 | 3 days | Transactions |
| Build subscription overlap detection | P3 | 2 days | Recurring txns |
| Add insight generation engine | P3 | 3 days | OpenAI |
| Implement actionable insight flows | P3 | 2 days | Insights |

**Deliverable**: Real AI-powered insights, natural language transaction entry

### Phase 4: Polish & Native Features (Week 13-14)
> Premium experience

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Add React Native Reanimated animations | P4 | 3 days | RN |
| Implement haptic feedback | P4 | 1 day | RN |
| Add confetti celebrations | P4 | 1 day | Reanimated |
| Build voice input (expo-speech) | P4 | 3 days | RN |
| Implement push notifications | P4 | 2 days | Supabase |
| Add data export (CSV/JSON) | P4 | 1 day | Transactions |
| Build infinite scroll for transactions | P4 | 1 day | RN |

**Deliverable**: Polished, native-feeling app with haptics and voice

### Phase 5: Collaboration (Week 15-16)
> Shared budgets

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Design Spaces data model | P5 | 1 day | Supabase |
| Build Space creation flow | P5 | 2 days | Spaces model |
| Implement member invitations | P5 | 2 days | Auth |
| Add shared transaction attribution | P5 | 2 days | Spaces |
| Build Space budget tracking | P5 | 2 days | Spaces |
| Add real-time sync for Spaces | P5 | 2 days | Supabase RT |

**Deliverable**: Couples/roommates can share budgets

---

## Target Folder Structure

```
src/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard
│   │   ├── activity.tsx          # Transaction Stream
│   │   ├── insights.tsx          # AI Insights
│   │   └── profile.tsx           # Settings
│   ├── add-transaction.tsx       # Modal
│   └── _layout.tsx
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── screens/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── SafeToSpendCard.tsx
│   │   │   ├── HealthDial.tsx
│   │   │   └── NetWorthCard.tsx
│   │   └── hooks/
│   │       └── useCashflow.ts
│   ├── transactions/
│   │   ├── components/
│   │   │   ├── TransactionItem.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   └── AddTransactionModal.tsx
│   │   ├── hooks/
│   │   │   └── useTransactions.ts
│   │   └── services/
│   │       └── nlpParser.ts
│   ├── insights/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   │       └── insightGenerator.ts
│   ├── goals/
│   │   ├── components/
│   │   │   └── LiquidGauge.tsx
│   │   └── hooks/
│   ├── bills/
│   │   ├── components/
│   │   └── hooks/
│   ├── spaces/                   # Collaborative budgets
│   │   ├── components/
│   │   └── hooks/
│   └── settings/
│       ├── components/
│       └── screens/
├── shared/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── BottomSheet.tsx
│   ├── hooks/
│   │   ├── useHaptics.ts
│   │   └── useAnimatedValue.ts
│   └── utils/
│       ├── formatters.ts
│       └── constants.ts
├── services/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── database.ts
│   ├── plaid/
│   │   ├── client.ts
│   │   └── sync.ts
│   ├── openai/
│   │   ├── client.ts
│   │   └── prompts.ts
│   └── notifications/
│       └── push.ts
├── stores/                       # Zustand stores
│   ├── useAuthStore.ts
│   ├── useTransactionStore.ts
│   └── useInsightStore.ts
└── types/
    ├── user.ts
    ├── transaction.ts
    ├── insight.ts
    ├── goal.ts
    ├── bill.ts
    └── space.ts
```

---

## Design System Tokens

### Colors (Dark Mode - OLED Optimized)

```typescript
const colors = {
  // Backgrounds
  background: '#000000',
  surface: {
    100: '#0A0A0A',
    200: '#111111',
    300: '#1A1A1A',
    400: '#242424',
  },
  
  // Brand
  mint: {
    DEFAULT: '#00D9A5',
    hover: '#00F5B8',
    muted: 'rgba(0, 217, 165, 0.2)',
    glow: 'rgba(0, 217, 165, 0.4)',
  },
  
  // Semantic
  danger: {
    DEFAULT: '#FF3B5C',
    muted: 'rgba(255, 59, 92, 0.2)',
  },
  warning: {
    DEFAULT: '#FFB800',
  },
  success: {
    DEFAULT: '#00D9A5', // Same as mint
  },
  
  // Neutrals
  neutral: {
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
  },
};
```

### Typography

```typescript
const typography = {
  fonts: {
    sans: 'Inter',
    mono: 'JetBrains Mono',
  },
  sizes: {
    hero: 48,      // Safe-to-Spend number
    h1: 24,        // Screen titles
    h2: 20,        // Section headers
    h3: 16,        // Card titles
    body: 14,      // Default text
    caption: 12,   // Secondary text
    micro: 10,     // Labels, badges
  },
};
```

### Animation Curves

```typescript
const animations = {
  spring: {
    default: { mass: 1, tension: 170, friction: 26 },
    bouncy: { mass: 1, tension: 200, friction: 20 },
    stiff: { mass: 1, tension: 300, friction: 30 },
  },
  timing: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeOut: [0.16, 1, 0.3, 1],
  },
};
```

---

## API Integration Specs

### OpenAI Prompt for NLP Transaction Parsing

```typescript
const NLP_SYSTEM_PROMPT = `You are a financial transaction parser. 
Extract structured data from natural language transaction descriptions.

Return JSON only, no explanation:
{
  "amount": number,
  "merchantName": string,
  "category": "food_dining" | "transportation" | "shopping" | "entertainment" | "bills_utilities" | "health_fitness" | "travel" | "subscriptions" | "other",
  "type": "expense" | "income",
  "confidence": number (0-1)
}

Examples:
"Lunch at Chipotle for $15" → {"amount": 15, "merchantName": "Chipotle", "category": "food_dining", "type": "expense", "confidence": 0.95}
"Got paid $2600 from work" → {"amount": 2600, "merchantName": "Employer", "category": "income", "type": "income", "confidence": 0.9}
`;
```

### Supabase Schema (Initial)

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  currency TEXT DEFAULT 'USD',
  locale TEXT DEFAULT 'en-US',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Linked Accounts
CREATE TABLE linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  plaid_item_id TEXT,
  institution_name TEXT,
  account_type TEXT,
  last_four TEXT,
  balance DECIMAL(12,2),
  last_synced TIMESTAMPTZ
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  linked_account_id UUID REFERENCES linked_accounts(id),
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('expense', 'income')),
  merchant_name TEXT,
  category TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  is_recurring BOOLEAN DEFAULT FALSE,
  ai_tags TEXT[],
  geolocation JSONB,
  status TEXT DEFAULT 'completed'
);

-- Savings Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  icon TEXT,
  target_amount DECIMAL(12,2),
  current_amount DECIMAL(12,2) DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  amount DECIMAL(12,2),
  due_date DATE,
  is_paid BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT TRUE,
  frequency TEXT
);

-- AI Insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT,
  title TEXT,
  description TEXT,
  data JSONB,
  priority TEXT DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Load Time | < 2s | Cold start to interactive |
| Animation FPS | 60fps | Reanimated performance |
| Offline Capability | 100% | Core features work without internet |
| Bank Sync Latency | < 5s | Plaid transaction refresh |
| NLP Accuracy | > 90% | Correct category + amount parsing |
| Crash Rate | < 0.1% | Production stability |

---

## Repository

**GitHub**: https://github.com/BillSteinUNB/Foresight

---

*This roadmap should be updated as implementation progresses. Each phase completion should trigger a review and adjustment of subsequent phases.*
