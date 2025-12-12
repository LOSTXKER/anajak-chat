# Anajak Chat - Multi-Business Communication Platform

**Business Communication OS** สำหรับหลายธุรกิจ - รวมแชททุกช่องทาง เปลี่ยนบทสนทนา → งาน → รายได้ → Insight

## 🌟 Features

### MVP Features (Phase 1)
- ✅ **Omni-channel Inbox** - รวมแชทจากทุกช่องทางในที่เดียว
- ✅ **Multi-Agent Chat** - Owner lock, Claim/Release, Internal notes
- ✅ **Entity Management** - Deal, Ticket, Work tracking
- ✅ **File Management** - Upload, versioning, approval workflow
- ✅ **Real-time Updates** - Supabase Realtime subscriptions
- ✅ **Analytics Dashboard** - KPIs, Funnels, Performance metrics
- ✅ **Multi-tenant Architecture** - แยกข้อมูลธุรกิจชัดเจน

### Upcoming Features (Phase 2 & 3)
- 🔄 AI Memory per Business
- 🔄 AI Draft Reply & Summary
- 🔄 Outcome-based Analytics
- 🔄 Channel Integrations (FB, IG, LINE, TikTok, Shopee)
- 🔄 Chatbot & Automation
- 🔄 Public API & Webhooks
- 🔄 Commission & Incentive Engine

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend**: Supabase (Postgres + Auth + RLS + Realtime + Storage)
- **UI**: Tailwind CSS + Lucide Icons
- **State Management**: Zustand (when needed)
- **Date Handling**: date-fns
- **Real-time**: Supabase Realtime subscriptions

## 📁 Project Structure

```
anajak-chat/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── dashboard/         # Main dashboard
│   │   │   ├── inbox/         # Chat interface
│   │   │   ├── entities/      # Entity management
│   │   │   ├── contacts/      # Contact management
│   │   │   ├── files/         # File management
│   │   │   ├── automation/    # Automation & workflows
│   │   │   ├── ai/           # AI Center
│   │   │   ├── analytics/     # Analytics & reports
│   │   │   └── settings/      # Settings
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/            # Reusable components
│   │   ├── inbox/            # Inbox components
│   │   ├── entities/         # Entity components
│   │   └── Sidebar.tsx
│   ├── lib/                  # Utilities
│   │   ├── supabase.ts       # Supabase client
│   │   └── supabase-server.ts # Server-side Supabase
│   └── types/
│       └── database.types.ts  # Database types
├── supabase/
│   └── schema.sql            # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)

### 1. Clone and Install

```bash
cd anajak-chat
npm install
```

### 2. Setup Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Get your API credentials from Project Settings > API

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI Configuration (Optional - for future use)
OPENAI_API_KEY=your_openai_api_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 5. Create Your First Account

1. Go to `/register`
2. Fill in your business name, email, and password
3. You'll be automatically logged in and redirected to the dashboard

## 📊 Database Schema

The application uses a multi-tenant architecture with the following main tables:

- **businesses** - Business/organization data
- **business_members** - User memberships and roles
- **channels** - Communication channels (FB, IG, LINE, etc.)
- **contacts** - Customer contacts
- **conversations** - Chat conversations
- **messages** - Individual messages
- **entities** - Work items (deals, tickets, projects)
- **files** - File uploads and versions
- **ai_memories** - AI knowledge base per business

All tables have Row Level Security (RLS) policies to ensure data isolation between businesses.

## 🎨 UI/UX Features

### Inbox (3-Column Layout)
- **Left**: Conversation list with filters and search
- **Middle**: Chat thread with claim/release functionality
- **Right**: Context panel (contact info, entities, AI insights)

### Entity Management
- Grid view with status, priority, and value
- Detail modal with tabs (Overview, Tasks, Notes)
- Create/Edit/Delete with full CRUD operations

### Analytics Dashboard
- KPI cards (conversations, entities, revenue, conversion)
- Funnel visualization
- Performance metrics
- AI insights

## 🔐 Security

- Row Level Security (RLS) on all tables
- Multi-tenant data isolation
- Supabase Auth for user authentication
- Encrypted API keys and secrets

## 🚢 Deployment

### Deploy to Vercel

```bash
npm run build
vercel deploy
```

### Environment Variables in Production

Make sure to set all environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 📖 API Routes (Future)

The platform is designed to support public APIs in Phase 3:

```
/api/v1/conversations
/api/v1/entities
/api/v1/contacts
/api/v1/messages
/api/v1/files
```

## 🤝 Contributing

This is a private business project. Contributions are managed internally.

## 📝 License

Proprietary - All rights reserved

## 🎯 Roadmap

### Phase 1 (MVP) - ✅ Completed
- Multi-tenant infrastructure
- Inbox with real-time chat
- Entity management
- Basic analytics

### Phase 2 (2-4 months)
- AI integration (OpenAI, Claude)
- AI Memory per business
- Advanced analytics
- Automation & workflows

### Phase 3 (4-6 months)
- Channel integrations
- Public API
- Marketplace & plugins
- Predictive AI

## 💬 Support

For support, email: support@anajak-chat.com (placeholder)

---

**Built with ❤️ for Thai businesses**

