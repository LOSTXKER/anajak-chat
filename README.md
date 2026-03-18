# Anajak Chat

Unified Chat Management System — รวมแชทจากทุกช่องทาง (Facebook Messenger, Instagram DM, LINE OA, WhatsApp) เข้ามาจัดการในที่เดียว พร้อม AI (Gemini) ตอบแชทอัตโนมัติ วิเคราะห์พฤติกรรมลูกค้า และเชื่อมต่อ ERP + Meta Conversions API

## Tech Stack

- **Frontend + Backend**: Next.js 15 (App Router) + React 19
- **Database**: Supabase Cloud (PostgreSQL + pgvector)
- **ORM**: Prisma 7
- **Auth**: Supabase Auth
- **File Storage**: Supabase Storage
- **Realtime**: Supabase Realtime (postgres_changes)
- **AI**: Google Gemini API (chat, embeddings, auto-reply)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Deploy**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase project ([supabase.com](https://supabase.com))
- Gemini API key ([ai.google.dev](https://ai.google.dev))

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env

# 3. Fill in your environment variables (see below)

# 4. Generate Prisma client
pnpm prisma generate

# 5. Run database migrations
pnpm prisma migrate dev

# 6. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable pgvector: SQL Editor -> `CREATE EXTENSION IF NOT EXISTS vector;`
3. Create Storage bucket: `media` (public)
4. Copy URL, anon key, and service role key from Settings > API

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...    # Pooled connection (port 6543)
DIRECT_URL=postgresql://...      # Direct connection (port 5432, for migrations)

# AI
GEMINI_API_KEY=your_gemini_api_key

# Facebook (for Messenger + Instagram OAuth)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_WEBHOOK_VERIFY_TOKEN=

# Instagram (optional, falls back to FACEBOOK_APP_ID)
INSTAGRAM_APP_ID=

# LINE (credentials entered via Settings UI)
# No env vars needed — configured per-channel in the app

# ERP Integration (optional)
ERP_API_URL=https://erp.example.com/api
ERP_API_KEY=
ERP_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Features

### Core
- Unified inbox for all messaging platforms
- Real-time messaging via Supabase Realtime
- Multi-admin assignment, transfer, collision detection
- Contact management with customer journey timeline
- Order management with ERP sync

### AI (Gemini)
- **Smart Reply** — AI suggests replies for agents (`POST /api/ai/suggest-reply`)
- **Auto-Reply Bot** — Full auto or confirm mode per channel
- **Conversation Summary** — Summarize + detect sentiment/intent (`POST /api/ai/summarize/:id`)
- **Churn Analysis** — Analyze why customers drop off (`POST /api/ai/analyze-churn`)
- **Customer Segmentation** — AI-powered segment assignment (`POST /api/ai/segment/:contactId`)
- **Knowledge Base** — Semantic search via pgvector embeddings

### Integrations
- **Facebook Messenger** — OAuth connect + webhook
- **Instagram DM** — OAuth connect + webhook
- **LINE OA** — Manual token connect + webhook
- **WhatsApp** — Meta Embedded Signup + webhook
- **Meta Conversions API (CAPI)** — Send Purchase/Lead events back to Meta
- **ERP** — Bidirectional sync (products, customers, orders, webhooks)

### Settings (all configurable via UI)
- Channel connections (connect/disconnect/test/reconnect)
- AI Bot config (mode, persona, escalation rules)
- Knowledge Base (CRUD, CSV import, semantic search)
- Quick Reply Templates (with variable substitution)
- Business Hours + holidays + auto-reply
- SLA targets per priority + alerts + auto-escalate
- Team management + roles & permissions
- ERP connection config
- CAPI datasets + event log

## API Reference

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/suggest-reply` | Get AI-suggested reply for a conversation |
| POST | `/api/ai/summarize/:conversationId` | Summarize conversation + detect sentiment/intent |
| POST | `/api/ai/analyze-churn` | Analyze drop-off reasons |
| POST | `/api/ai/segment/:contactId` | AI-powered customer segmentation |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List conversations (filter by status, label, platform) |
| GET | `/api/conversations/:id` | Get conversation detail |
| POST | `/api/conversations/:id/assign` | Assign to agent |
| POST | `/api/conversations/:id/transfer` | Transfer to another agent |
| POST | `/api/conversations/:id/resolve` | Mark as resolved |
| GET | `/api/conversations/:id/messages` | Get messages |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts |
| GET | `/api/contacts/:id` | Contact detail |
| GET | `/api/contacts/:id/timeline` | Customer journey timeline |

### Channels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/channels` | List connected channels |
| GET | `/api/channels/:platform/connect` | Start OAuth connect flow |
| POST | `/api/channels/:id/test` | Test channel connection |
| POST | `/api/channels/:id/reconnect` | Get reconnect URL |
| DELETE | `/api/channels/:id` | Disconnect channel |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List templates (paginated) |
| POST | `/api/templates` | Create template |
| POST | `/api/templates/:id/render` | Render template with variables |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/media/files/upload` | Upload single file |
| POST | `/api/media/files/bulk-upload` | Upload multiple files (max 20) |
| GET | `/api/media/files` | List files |
| GET | `/api/media/folders` | List folders |

### Orders & ERP
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order (auto-pushes to ERP + CAPI) |
| GET | `/api/erp/orders/:id/status` | Pull order status from ERP |
| GET | `/api/erp/products` | Search ERP products |
| GET | `/api/erp/customers` | Search ERP customers |

### CAPI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/capi/datasets` | List CAPI datasets |
| POST | `/api/capi/datasets` | Create CAPI dataset |
| GET | `/api/capi/events` | List CAPI events |
| POST | `/api/capi/events` | Manually send CAPI event |

### Webhooks (inbound from platforms)
| Endpoint | Platform |
|----------|----------|
| `/api/webhooks/facebook` | Facebook Messenger |
| `/api/webhooks/instagram` | Instagram DM |
| `/api/webhooks/line` | LINE OA |
| `/api/webhooks/whatsapp` | WhatsApp |
| `/api/erp-webhooks/order-status` | ERP order status changes |
| `/api/erp-webhooks/stock-update` | ERP stock updates |
| `/api/erp-webhooks/customer-update` | ERP customer updates |

## Deployment

Deploy to Vercel:

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel
```

Set all environment variables in the Vercel dashboard under Settings > Environment Variables.

## License

Private — Internal use only.
