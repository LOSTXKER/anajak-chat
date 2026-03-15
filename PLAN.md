# Anajak Chat — Unified Chat Management System

## วิสัยทัศน์

ระบบรวมแชทจากทุกช่องทาง (Facebook Messenger, Instagram DM, LINE OA) เข้ามาจัดการในที่เดียว
พร้อม AI (Gemini) ตอบแชทอัตโนมัติ + วิเคราะห์พฤติกรรมลูกค้า + สร้าง Insight ให้ธุรกิจ
รองรับ Facebook Conversions API (CAPI) สำหรับส่ง conversion events กลับ Meta เพื่อ optimize แอด
เชื่อมต่อ ERP ภายในผ่าน REST API เพื่อ sync สินค้า, ลูกค้า, order, และสถานะจัดส่ง
ตั้งค่าทุกอย่างผ่านหน้า Settings ได้เลย (เชื่อมต่อ channel, AI Bot, KB, SLA, Roles)

> Phase แรก: ใช้งานภายในทีมก่อน → ขยายเป็น SaaS ในอนาคต

---

## ปัญหาที่ต้องแก้

| # | ปัญหา | สิ่งที่ระบบต้องทำ |
|---|--------|------------------|
| 1 | ไม่รู้ว่าลูกค้าทักมาจากแอดตัวไหน / ตำแหน่งจัดวางอันไหน | **Ad Attribution Tracking** — ติดตาม UTM, ad_id, placement ทุก conversation |
| 2 | ลูกค้าทักมาแล้วหายไปตลอด | **Drop-off Analysis** — ตรวจจับ conversation ที่ไม่มี conversion แล้ววิเคราะห์สาเหตุ |
| 3 | ลูกค้าหายไปแล้วกลับมาซื้อ ไม่รู้ยอดเท่าไหร่ | **Returning Customer Tracking** — ติดตาม customer journey ตั้งแต่ทักครั้งแรกจนซื้อ |
| 4 | ไม่รู้ว่ากลุ่มลูกค้าคือใคร | **Customer Segmentation** — AI จัดกลุ่มลูกค้าอัตโนมัติตามพฤติกรรม |
| 5 | ไม่รู้ว่าลูกค้าหายไปเพราะอะไร | **Churn Analysis** — วิเคราะห์ปัจจัยที่ทำให้ลูกค้าหาย (ราคา, ตอบช้า, ไม่ตรงความต้องการ) |
| 6 | แอดมินหลายคนจัดการแชทไม่ได้ | **Multi-Admin Workspace** — กระจายงาน, มอบหมายแชท, ดู workload |

---

## สถาปัตยกรรมระบบ (Architecture)

```
┌─────────────────────────────────────────────────────────┐
│              Next.js 15 (App Router)                     │
│                                                          │
│  ── Frontend (React) ──                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Chat UI  │ │ Dashboard│ │ Analytics│ │ Settings   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│                                                          │
│  ── Backend (API Routes) ──                              │
│  ┌────────────┐ ┌────────────┐ ┌─────────────────────┐  │
│  │ Chat API   │ │ Gemini AI  │ │ Analytics API       │  │
│  │ - Messages │ │ - Suggest  │ │ - Attribution       │  │
│  │ - Assign   │ │ - Classify │ │ - Segmentation      │  │
│  │ - Routing  │ │ - Analyze  │ │ - Churn Analysis    │  │
│  └────────────┘ │ - AutoReply│ └─────────────────────┘  │
│                 └────────────┘                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ CAPI Service (Conversions API)                    │   │
│  │ - Send conversion events (Purchase, Lead, Order)  │   │
│  │ - Dataset management per channel                  │   │
│  │ - Event deduplication                             │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ERP Integration Service                           │   │
│  │ - Product/Stock sync (ดึงสินค้า, ราคา, สต็อก)      │   │
│  │ - Customer sync (bidirectional)                   │   │
│  │ - Order push (แชท → ERP)                          │   │
│  │ - Webhook receiver (ERP → แชท → CAPI)             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Deploy: Vercel (ที่เดียวจบ)                              │
└──────────┬──────────────────────────────┬───────────────┘
           │                              │
           │ (ขาเข้า)                      │ (ขาออก)
           │ Webhooks:                     │ Conversions API:
           │ - messaging_referrals         │ - POST /{DATASET_ID}/events
           │ - messages                    │ - Purchase, Lead, Order events
           │ - ad_id, placement            │ - PSID / IGSID / ctwa_clid
           │ - ERP webhooks (order status) │ - ERP order push
           │                              │
┌──────────▼──────────────────────────────▼───────────────┐
│                  Supabase Cloud                          │
│  ┌──────────┐ ┌────────────────┐ ┌────────────────────┐ │
│  │PostgreSQL│ │Supabase Storage│ │ Supabase Auth      │ │
│  │(+pgvector│ │ (Files/Images) │ │ (Login, OAuth)     │ │
│  │ + Prisma)│ └────────────────┘ └────────────────────┘ │
│  └──────────┘ ┌────────────────────────────────────────┐│
│               │ Supabase Realtime                      ││
│               │ (Chat messages, typing, online status) ││
│               └────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│               External Integrations                      │
│                                                          │
│  ── ขาเข้า (Inbound: Webhooks + Messaging API) ──       │
│  ┌──────┐ ┌──────────┐ ┌───────────┐ ┌──────┐           │
│  │  FB  │ │Instagram │ │   LINE    │ │  WA  │           │
│  │Msngr │ │  DM API  │ │Messaging  │ │Cloud │           │
│  │ API  │ │          │ │   API     │ │ API  │           │
│  └──────┘ └──────────┘ └───────────┘ └──────┘           │
│                                                          │
│  ── ขาออก (Outbound: Conversions API / CAPI) ──         │
│  ┌─────────────────────────────────────────────┐         │
│  │ Meta Conversions API (Graph API)            │         │
│  │ POST /{DATASET_ID}/events                   │         │
│  │ ├── Messenger (PSID)                        │         │
│  │ ├── Instagram (IGSID)                       │         │
│  │ └── WhatsApp (ctwa_clid)                    │         │
│  └─────────────────────────────────────────────┘         │
│                                                          │
│  ── AI & Others ──                                       │
│  ┌───────┐                                               │
│  │Gemini │                                               │
│  │  API  │                                               │
│  └───────┘                                               │
│                                                          │
│  ── ERP (Bidirectional REST API) ──                      │
│  ┌─────────────────────────────────────────────┐         │
│  │ Custom ERP System                           │         │
│  │ ├── GET  /erp-api/products (สินค้า, สต็อก)    │         │
│  │ ├── POST /erp-api/orders (สร้าง order)       │         │
│  │ ├── GET  /erp-api/customers (ข้อมูลลูกค้า)   │         │
│  │ └── Webhooks → Anajak Chat                  │         │
│  │     ├── order-status (shipped, delivered)    │         │
│  │     ├── stock-update                        │         │
│  │     └── customer-update                     │         │
│  └─────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

### Data Flow: Referral (ขาเข้า) vs CAPI (ขาออก)

```
                    ┌───────────────┐
                    │  Facebook Ad  │
                    │  (Messenger / │
                    │   IG / WA)    │
                    └──────┬────────┘
                           │
              ลูกค้าคลิกแอด │
                           ▼
               ┌───────────────────┐
               │   Webhook Event   │
               │ messaging_referrals│
               │ ├─ ad_id          │
               │ ├─ placement      │
               │ ├─ PSID / IGSID  │    ◄── ขาเข้า (Referral Data)
               │ └─ ctwa_clid     │
               └────────┬──────────┘
                        │
                        ▼
               ┌───────────────────┐
               │   Anajak Chat     │
               │ ├─ เก็บ ad_id     │
               │ ├─ เก็บ PSID      │
               │ ├─ แอดมินตอบแชท   │
               │ └─ บันทึก Order   │
               └────────┬──────────┘
                        │
           ลูกค้าสั่งซื้อ │
                        ▼
               ┌───────────────────┐
               │  Conversions API  │
               │ POST /events      │
               │ ├─ event: Purchase│    ◄── ขาออก (CAPI)
               │ ├─ value: ฿2,500  │
               │ └─ PSID / IGSID  │
               └────────┬──────────┘
                        │
                        ▼
               ┌───────────────────┐
               │  Facebook Ads     │
               │  Optimization     │
               │ ├─ วัด ROAS       │
               │ ├─ Optimize แอด   │
               │ └─ Lookalike      │
               └───────────────────┘
```

---

## Tech Stack

> **แนวคิด**: Simple stack สำหรับ solo dev — ใช้ services น้อยที่สุด, deploy ที่เดียว, ไม่ต้อง Docker

| Layer | เทคโนโลยี | เหตุผล |
|-------|-----------|--------|
| Frontend + Backend | **Next.js 15 (App Router)** + API Routes | ทำทั้ง UI + backend ในโปรเจกต์เดียว, deploy Vercel ที่เดียวจบ |
| UI | **Tailwind CSS** + **shadcn/ui** | สวย, ปรับแต่งง่าย, component library พร้อมใช้ |
| ORM | **Prisma** | Type-safe, autocomplete ดีมาก, schema ชัดเจน, community ใหญ่ |
| Database | **Supabase** (Managed PostgreSQL) | ไม่ต้อง manage เอง, มี pgvector, RLS, Dashboard, Backups |
| Auth | **Supabase Auth** | Built-in, รองรับ OAuth, JWT, ลดโค้ด auth ลงมาก |
| File Storage | **Supabase Storage** | เก็บรูป/ไฟล์, signed URL + image transform ในตัว |
| Realtime | **Supabase Realtime** | แชท realtime, typing indicator, online status — ไม่ต้อง Socket.IO |
| AI | **Google Gemini API** | วิเคราะห์แชท, จัดกลุ่ม, แนะนำคำตอบ, auto-reply |
| Deployment | **Vercel** | Deploy ที่เดียวจบ (frontend + API Routes) |

> **Dev workflow**: `pnpm install` → ใส่ env (Supabase URL + Key) → `pnpm dev` → พร้อมใช้ทันที
> ไม่ต้อง Docker, ไม่ต้อง manage server, ไม่ต้อง config หลาย service

### Scale ในอนาคต (เมื่อจ้าง dev / ทำ SaaS)

เมื่อถึงเวลาต้อง scale สามารถเพิ่มได้ทีหลัง:

| เพิ่มเมื่อต้องการ | ทำไม |
|------------------|------|
| Fastify (backend แยก) | ถ้า API Routes ไม่พอ, ต้องการ WebSocket server ถาวร |
| Upstash Redis | ถ้าต้องการ cache, queue, rate limiting ที่เร็วขึ้น |
| Railway / Render | ถ้าแยก backend ออก ต้องมีที่ deploy |
| Turborepo (monorepo) | ถ้ามีหลาย app/package ต้องจัดการร่วมกัน |

---

## Database Schema (Core)

> **Database**: ใช้ Supabase Cloud PostgreSQL — schema จัดการผ่าน **Prisma ORM** (`prisma migrate`)
> pgvector extension เปิดใช้ผ่าน Supabase Dashboard (สำหรับ Knowledge Base embeddings)
> Row Level Security (RLS) สามารถเปิดเพิ่มเติมผ่าน Supabase เพื่อ multi-tenant isolation ในอนาคต

### Organizations & Users

```sql
organizations
├── id (uuid, PK)
├── name
├── plan (enum: free, pro, enterprise)
├── settings (jsonb)
└── created_at

users
├── id (uuid, PK)
├── org_id (FK → organizations)
├── email
├── name
├── role_id (FK → roles)              -- ระบบ role & permission แบบ granular
├── avatar_url
├── is_active
└── created_at
```

### Channels & Contacts

```sql
channels
├── id (uuid, PK)
├── org_id (FK → organizations)
├── platform (enum: facebook, line, instagram, web, manual)
├── name
├── credentials (jsonb, encrypted)  -- API keys, tokens
├── is_active
└── created_at

contacts
├── id (uuid, PK)
├── org_id (FK → organizations)
├── platform_id         -- ID จาก platform (FB user id, LINE user id)
├── platform (enum)
├── display_name
├── avatar_url
├── phone
├── email
├── tags (text[])
├── segment (varchar)   -- AI-assigned segment
├── erp_customer_id (varchar, nullable)  -- 🔗 Link ไปหา customer ใน ERP
├── first_seen_at
├── last_seen_at
├── total_conversations (int)
├── total_orders (int)
├── total_revenue (decimal)
├── metadata (jsonb)    -- ข้อมูลเพิ่มเติม
└── created_at
```

### Conversations & Messages

```sql
conversations
├── id (uuid, PK)
├── org_id (FK → organizations)
├── channel_id (FK → channels)
├── contact_id (FK → contacts)
├── assigned_to (FK → users, nullable)
├── status (enum: open, pending, resolved, closed)
├── priority (enum: low, medium, high, urgent)
├── source_ad_id (varchar)          -- 🔑 แอดตัวไหน
├── source_ad_name (varchar)
├── source_placement (varchar)      -- 🔑 ตำแหน่งจัดวาง (feed, story, reel, search)
├── source_campaign_id (varchar)
├── source_utm (jsonb)              -- utm_source, utm_medium, utm_campaign
├── psid (varchar)                  -- 🔑 Page-Scoped ID (Messenger) สำหรับ CAPI
├── igsid (varchar)                 -- 🔑 Instagram-Scoped ID สำหรับ CAPI
├── ctwa_clid (varchar)             -- 🔑 Click-to-WhatsApp Click ID สำหรับ CAPI
├── is_returning_customer (bool)    -- 🔑 ลูกค้ากลับมาซื้อ
├── first_response_at (timestamp)
├── resolved_at (timestamp)
├── ai_summary (text)               -- Gemini สรุปบทสนทนา
├── ai_sentiment (enum: positive, neutral, negative)
├── ai_intent (varchar)             -- purchase, inquiry, complaint, support
├── drop_off_reason (varchar)       -- 🔑 สาเหตุที่หาย (AI วิเคราะห์)
├── metadata (jsonb)
└── created_at

messages
├── id (uuid, PK)
├── conversation_id (FK → conversations)
├── sender_type (enum: contact, agent, bot, system)
├── sender_id (uuid, nullable)
├── content (text)
├── content_type (enum: text, image, file, sticker, location, template)
├── media_url (varchar)
├── platform_message_id (varchar)
├── is_ai_suggested (bool)
├── metadata (jsonb)
└── created_at
```

### Orders & Analytics

```sql
orders
├── id (uuid, PK)
├── org_id (FK → organizations)
├── conversation_id (FK → conversations)
├── contact_id (FK → contacts)
├── order_number (varchar)
├── amount (decimal)
├── status (enum: pending, confirmed, shipped, delivered, cancelled)
├── items (jsonb)
├── source_ad_id (varchar)          -- ซื้อจากแอดตัวไหน
├── source_placement (varchar)
├── erp_order_id (varchar, nullable)    -- 🔗 Link ไปหา order ใน ERP
├── erp_synced_at (timestamp, nullable) -- sync กับ ERP ล่าสุดเมื่อไหร่
└── created_at

conversation_events
├── id (uuid, PK)
├── conversation_id (FK → conversations)
├── event_type (enum: opened, assigned, replied, resolved, dropped, reopened)
├── actor_id (uuid)
├── metadata (jsonb)
└── created_at
```

### CAPI (Conversions API)

```sql
capi_datasets
├── id (uuid, PK)
├── org_id (FK → organizations)
├── channel_id (FK → channels)
├── platform (enum: messenger, instagram, whatsapp)
├── dataset_id (varchar)            -- Dataset ID จาก Meta (ใช้ส่ง events)
├── page_id (varchar, nullable)     -- Facebook Page ID (Messenger)
├── ig_user_id (varchar, nullable)  -- Instagram Business Account ID
├── waba_id (varchar, nullable)     -- WhatsApp Business Account ID
├── access_token (text, encrypted)  -- Token ที่มี permission page_events / instagram_manage_events
├── is_active (bool)
├── last_verified_at (timestamp)    -- ตรวจสอบ dataset ล่าสุด
└── created_at

capi_events
├── id (uuid, PK)
├── org_id (FK → organizations)
├── dataset_id (FK → capi_datasets)
├── conversation_id (FK → conversations)
├── contact_id (FK → contacts)
├── order_id (FK → orders, nullable)
├── event_name (varchar)            -- Purchase, LeadSubmitted, OrderCreated, etc.
├── event_time (timestamp)
├── action_source (varchar)         -- "business_messaging"
├── messaging_channel (enum: messenger, instagram, whatsapp)
├── user_identifier (varchar)       -- PSID / IGSID / ctwa_clid (ขึ้นกับ channel)
├── currency (varchar)              -- THB, USD
├── value (decimal)                 -- มูลค่า event (เช่น ราคาสินค้า)
├── custom_data (jsonb)             -- ข้อมูลเพิ่มเติมที่ส่งไป Meta
├── request_payload (jsonb)         -- Full payload ที่ส่งไป (สำหรับ debug)
├── response_payload (jsonb)        -- Response จาก Meta
├── status (enum: pending, sent, failed, retrying)
├── error_message (text, nullable)
├── retry_count (int, default 0)
├── event_id (varchar, unique)      -- สำหรับ deduplication
├── sent_at (timestamp, nullable)
└── created_at
```

### ERP Integration

```sql
erp_sync_log
├── id (uuid, PK)
├── org_id (FK → organizations)
├── sync_type (enum: product, customer, order, shipping)
├── direction (enum: inbound, outbound)  -- inbound = ERP→Chat, outbound = Chat→ERP
├── erp_entity_id (varchar)              -- ID ของ entity ฝั่ง ERP
├── local_entity_id (uuid, nullable)     -- ID ของ entity ฝั่ง Anajak Chat
├── payload (jsonb)                      -- ข้อมูลที่ sync
├── status (enum: success, failed, skipped)
├── error_message (text, nullable)
├── triggered_capi_event_id (uuid, nullable, FK → capi_events)  -- ถ้า sync นี้ trigger CAPI event
├── synced_at (timestamp)
└── created_at

erp_connections
├── id (uuid, PK)
├── org_id (FK → organizations)
├── erp_name (varchar)                   -- ชื่อระบบ ERP
├── base_url (varchar)                   -- URL ของ ERP API
├── api_key (text, encrypted)            -- API key สำหรับเรียก ERP
├── webhook_secret (text, encrypted)     -- Secret สำหรับ verify webhook จาก ERP
├── sync_settings (jsonb)                -- การตั้งค่า sync (auto/manual, interval)
├── is_active (bool)
├── last_synced_at (timestamp, nullable)
└── created_at
```

### AI Bot, Knowledge Base & Templates

```sql
ai_bot_configs
├── id (uuid, PK)
├── org_id (FK → organizations)
├── channel_id (FK → channels, nullable)     -- null = default config for all channels
├── mode (enum: full_auto, confirm, off)
├── use_business_hours (bool)                -- auto-switch mode ตาม business hours
├── auto_mode (enum: full_auto, confirm)     -- mode นอกเวลา (ถ้า use_business_hours = true)
├── manual_mode (enum: full_auto, confirm)   -- mode ในเวลา (ถ้า use_business_hours = true)
├── persona (text)                           -- "คุณเป็นผู้ช่วยของร้าน..."
├── escalation_max_rounds (int, default 5)   -- ส่งต่อแอดมินหลังคุยกี่รอบ
├── escalation_on_negative_sentiment (bool, default true)
├── escalation_on_refund (bool, default true)
├── escalation_on_low_confidence (decimal, default 0.5)  -- threshold
├── greeting_message (text, nullable)
├── is_active (bool)
└── created_at

knowledge_base_articles
├── id (uuid, PK)
├── org_id (FK → organizations)
├── title (varchar)
├── content (text)
├── category (varchar)                       -- faq, product, policy, promotion, store_info
├── tags (text[])
├── embedding (vector, nullable)             -- Gemini embedding สำหรับ semantic search (pgvector)
├── is_active (bool)
├── usage_count (int, default 0)             -- จำนวนครั้งที่ AI อ้างอิง
├── created_by (FK → users)
├── updated_at (timestamp)
└── created_at

ai_reply_log
├── id (uuid, PK)
├── org_id (FK → organizations)
├── conversation_id (FK → conversations)
├── message_id (FK → messages, nullable)     -- message ที่ส่งจริง (หลัง approve)
├── mode (enum: full_auto, confirm)
├── draft_content (text)                     -- คำตอบที่ AI ร่าง
├── final_content (text, nullable)           -- คำตอบที่ส่งจริง (อาจถูกแก้ไข)
├── status (enum: auto_sent, pending_review, approved, edited, rejected, escalated)
├── confidence (decimal)
├── should_escalate (bool)
├── escalate_reason (varchar, nullable)
├── used_sources (text[])                    -- ["kb", "erp", "history"]
├── kb_article_ids (uuid[])                  -- articles ที่ AI อ้างอิง
├── reviewed_by (FK → users, nullable)
├── reviewed_at (timestamp, nullable)
└── created_at

quick_reply_templates
├── id (uuid, PK)
├── org_id (FK → organizations)
├── name (varchar)
├── content (text)                           -- รองรับ {customer_name}, {order_id}, etc.
├── category (varchar)                       -- greeting, pricing, shipping, closing, custom
├── shortcut (varchar, nullable)             -- e.g. "/greeting1"
├── is_active (bool)
├── usage_count (int, default 0)
├── created_by (FK → users)
└── created_at
```

### Business Hours, SLA & Notes

```sql
business_hours
├── id (uuid, PK)
├── org_id (FK → organizations)
├── day_of_week (int)                        -- 0=Sunday, 1=Monday, ..., 6=Saturday
├── is_open (bool)
├── open_time (time)                         -- e.g. 09:00
├── close_time (time)                        -- e.g. 18:00
├── auto_reply_message (text, nullable)      -- ข้อความตอบกลับนอกเวลา
└── created_at

holidays
├── id (uuid, PK)
├── org_id (FK → organizations)
├── date (date)
├── name (varchar)                           -- e.g. "วันสงกรานต์"
├── auto_reply_message (text, nullable)
└── created_at

sla_configs
├── id (uuid, PK)
├── org_id (FK → organizations)
├── priority (enum: urgent, high, medium, low)
├── first_response_minutes (int)             -- target เวลาตอบครั้งแรก
├── resolution_minutes (int)                 -- target เวลา resolve
├── warning_threshold_percent (int, default 80)  -- แจ้งเตือนเมื่อใช้เวลาไป X%
├── auto_escalate (bool, default true)       -- auto-escalate เมื่อ breach
├── escalate_to_role (varchar, default 'supervisor')
└── created_at

notes
├── id (uuid, PK)
├── org_id (FK → organizations)
├── noteable_type (enum: conversation, contact)
├── noteable_id (uuid)                       -- conversation_id หรือ contact_id
├── content (text)
├── mentions (uuid[])                        -- user IDs ที่ถูก @mention
├── author_id (FK → users)
└── created_at
```

### Roles & Permissions

```sql
roles
├── id (uuid, PK)
├── org_id (FK → organizations)
├── name (varchar)                           -- owner, admin, supervisor, agent, bot_manager, custom
├── description (text, nullable)
├── permissions (jsonb)                      -- ["chat:view_all", "contacts:edit", ...]
├── is_system_role (bool)                    -- system roles ลบไม่ได้
└── created_at
```

> หมายเหตุ: อัปเดต `users` table ให้ใช้ `role_id (FK → roles)` แทน `role (enum)`

เพิ่มใน `conversations` table:

```sql
├── sla_breached_at (timestamp, nullable)    -- เวลาที่ SLA breach
├── sla_warning_at (timestamp, nullable)     -- เวลาที่ SLA warning
```

### Media Library

```sql
media_folders
├── id (uuid, PK)
├── org_id (FK → organizations)
├── name (varchar)
├── parent_id (uuid, FK → media_folders, nullable)  -- nested folders
├── created_by (FK → users)
└── created_at

media_files
├── id (uuid, PK)
├── org_id (FK → organizations)
├── folder_id (FK → media_folders, nullable)
├── original_name (varchar)
├── storage_key (varchar)                    -- Supabase Storage path
├── file_type (enum: image, video, pdf, document, other)
├── mime_type (varchar)
├── file_size (bigint)                       -- bytes
├── width (int, nullable)                    -- สำหรับ image/video
├── height (int, nullable)
├── thumbnail_key (varchar, nullable)        -- Supabase Storage path ของ thumbnail
├── tags (text[])
├── description (text, nullable)
├── alt_text (varchar, nullable)
├── usage_count (int, default 0)             -- จำนวนครั้งที่ส่งในแชท
├── uploaded_by (FK → users)
└── created_at
```

---

## ฟีเจอร์หลัก (Features)

### 1. Unified Inbox — กล่องข้อความรวม

- รวมแชทจาก Facebook Messenger, Instagram DM, LINE OA ในที่เดียว (WhatsApp + Website เป็น optional)
- แสดง badge บอกว่ามาจาก platform ไหน
- Real-time update ผ่าน WebSocket
- ค้นหาแชทได้ตามชื่อลูกค้า, เนื้อหา, tag

### 2. Ad Attribution — ติดตามแหล่งที่มา

- **Facebook/Instagram**: ดึง `ad_id`, `ad_name`, `placement` จาก Referral Data ของ Messenger API
- **LINE**: ติดตาม UTM parameter จาก LINE URL scheme
- **Website**: ดึง UTM จาก URL → เก็บใน conversation metadata
- Dashboard แสดง:
  - จำนวนแชทต่อแอด
  - Conversion rate ต่อแอด
  - Revenue ต่อ placement
  - Cost per conversation (ถ้าเชื่อม Ads API)

### 3. Multi-Admin Management — ระบบแอดมินหลายคน

- **Auto-assign**: กระจายแชทใหม่ให้แอดมินอัตโนมัติ (Round Robin / Load Balance)
- **Manual assign**: หัวหน้าทีมมอบหมายแชทได้
- **Transfer**: โอนแชทระหว่างแอดมิน
- **Workload view**: ดูจำนวนแชทที่แต่ละคนรับผิดชอบ
- **Collision detection**: แจ้งเตือนเมื่อแอดมิน 2 คนเปิดแชทเดียวกัน
- **Role-based access**: Owner > Admin > Agent

### 4. Customer Journey Tracking — ติดตามพฤติกรรมลูกค้า

```
ทักครั้งแรก → ถามราคา → หายไป 5 วัน → กลับมาทัก → สั่งซื้อ → รับของ → รีวิว
     │              │            │              │            │
  [first_seen]  [inquiry]   [drop_off]    [returning]   [converted]
```

- ไทม์ไลน์แสดง journey ของลูกค้าแต่ละคน
- ตรวจจับลูกค้าที่ "หายไป" (ไม่ตอบภายใน X วัน)
- แยกประเภท:
  - **ทักแล้วหายเลย** (One-time drop)
  - **ทักหลายรอบแล้วหาย** (Repeated inquiry, no purchase)
  - **หายแล้วกลับมาซื้อ** (Delayed conversion)
  - **ซื้อแล้วกลับมาซื้อซ้ำ** (Repeat customer)

### 5. Gemini AI Integration — ปัญญาประดิษฐ์

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| **Smart Reply** | แนะนำคำตอบ 2-3 ตัวเลือกให้แอดมินเลือก |
| **Auto Summary** | สรุปบทสนทนาอัตโนมัติเมื่อปิดแชท |
| **Sentiment Analysis** | วิเคราะห์อารมณ์ลูกค้า (บวก/กลาง/ลบ) |
| **Intent Detection** | จำแนกว่าลูกค้าต้องการอะไร (ซื้อ/ถาม/ร้องเรียน/สนับสนุน) |
| **Drop-off Analysis** | วิเคราะห์สาเหตุที่ลูกค้าหาย |
| **Customer Segmentation** | จัดกลุ่มลูกค้าอัตโนมัติ |
| **Churn Prediction** | ทำนายว่าลูกค้าคนไหนมีแนวโน้มจะหาย |

#### Gemini Prompting Strategy

```
สำหรับ Drop-off Analysis:
"วิเคราะห์บทสนทนาต่อไปนี้และระบุสาเหตุที่ลูกค้าอาจหยุดตอบ
โดยเลือกจาก: ราคาสูง, ตอบช้า, สินค้าไม่ตรงความต้องการ,
เปรียบเทียบกับร้านอื่น, ปัญหาการจัดส่ง, อื่นๆ
ให้ตอบเป็น JSON: { reason, confidence, suggestion }"

สำหรับ Customer Segmentation:
"จากประวัติการสนทนาและการซื้อของลูกค้ารายนี้ จัดกลุ่มเป็น:
- VIP (ซื้อบ่อย, ยอดสูง)
- Regular (ซื้อเป็นประจำ)
- Window Shopper (ดูเยอะ, ไม่ค่อยซื้อ)
- One-timer (ซื้อครั้งเดียว)
- At-risk (เคยซื้อแต่หายไป)
ให้ตอบเป็น JSON: { segment, confidence, reasoning }"
```

### 6. Analytics Dashboard — แดชบอร์ดวิเคราะห์

#### Overview
- จำนวนแชทวันนี้ / สัปดาห์ / เดือน
- เวลาตอบเฉลี่ย (First Response Time)
- อัตราการ resolve

#### Ad Performance
- แชทต่อแอด (breakdown by ad_id, placement)
- Conversion rate ต่อแอด
- Revenue ต่อแอด
- Best performing placement

#### Customer Insights
- Customer segments pie chart
- Drop-off funnel (ทักมา → ถาม → ตัดสินใจ → ซื้อ)
- Churn reasons breakdown
- Returning customer rate
- Average time to conversion

#### Agent Performance
- แชทต่อแอดมิน
- เวลาตอบเฉลี่ยต่อแอดมิน
- Customer satisfaction score
- Resolution rate

### 7. Facebook Conversions API (CAPI) — ส่ง Conversion กลับ Meta

#### ทำไมต้องมี CAPI?

- **ไม่มี CAPI**: Facebook ไม่รู้ว่าแอดตัวไหนทำยอดได้จริง → optimize ไม่ถูก → เสียเงินแอดฟรี
- **มี CAPI**: Facebook รู้ว่าแอดไหนได้ลูกค้าที่ซื้อจริง → เอาเงินไปลงแอดที่ดี → วัด ROAS แม่น → สร้าง Lookalike Audience จากลูกค้าจริง

CAPI for Business Messaging เป็น **server-side** tracking ที่ส่งข้อมูล conversion โดยตรงจาก server ไปหา Meta ไม่ต้องพึ่ง browser pixel จึงไม่ได้รับผลกระทบจาก iOS privacy หรือ cookie blocking

#### Supported Events

| Event Name | เมื่อไหร่ที่ส่ง | ข้อมูลที่ส่ง |
|------------|----------------|-------------|
| `Purchase` | ลูกค้าจ่ายเงินเสร็จ | currency, value |
| `LeadSubmitted` | ลูกค้าให้ข้อมูลติดต่อ (เบอร์, อีเมล) | lead_type |
| `QualifiedLead` | แอดมินยืนยันว่าเป็น lead คุณภาพ | lead_score |
| `AddToCart` | ลูกค้าเลือกสินค้า (บอกในแชท) | product_id, value |
| `InitiateCheckout` | ลูกค้าเริ่มสั่งซื้อ | value |
| `OrderCreated` | สร้าง order ในระบบ | order_id, value |
| `OrderShipped` | จัดส่งสินค้า | order_id |
| `OrderDelivered` | ลูกค้าได้รับสินค้า | order_id |
| `OrderCanceled` | ยกเลิก order | order_id, reason |
| `ViewContent` | ลูกค้าดูรายละเอียดสินค้า | product_id |

#### CAPI Flow ตาม Channel

**Messenger (ใช้ PSID)**
```
1. ลูกค้าคลิก Click-to-Messenger Ad
2. Webhook: messaging_referrals → เก็บ ad_id + PSID
3. แอดมินตอบแชท → ลูกค้าสั่งซื้อ
4. CAPI: POST /{DATASET_ID}/events
   {
     "event_name": "Purchase",
     "action_source": "business_messaging",
     "messaging_channel": "messenger",
     "user_data": {
       "page_id": "<PAGE_ID>",
       "page_scoped_user_id": "<PSID>"
     },
     "custom_data": { "currency": "THB", "value": 2500 }
   }
```

**Instagram (ใช้ IGSID)**
```
1. ลูกค้าคลิก Click-to-Instagram Ad
2. Webhook: messages → เก็บ IGSID
3. แอดมินตอบแชท → ลูกค้าสั่งซื้อ
4. CAPI: POST /{DATASET_ID}/events
   {
     "event_name": "Purchase",
     "action_source": "business_messaging",
     "messaging_channel": "instagram",
     "user_data": {
       "instagram_business_account_id": "<IG_USER_ID>",
       "ig_sid": "<IGSID>"
     },
     "custom_data": { "currency": "THB", "value": 2500 }
   }
```

**WhatsApp (ใช้ ctwa_clid)**
```
1. ลูกค้าคลิก Click-to-WhatsApp Ad
2. Webhook: messages.referral → เก็บ ctwa_clid
3. แอดมินตอบแชท → ลูกค้าสั่งซื้อ
4. CAPI: POST /{DATASET_ID}/events
   {
     "event_name": "Purchase",
     "action_source": "business_messaging",
     "messaging_channel": "whatsapp",
     "user_data": {
       "whatsapp_business_account_id": "<WABA_ID>",
       "ctwa_clid": "<CLICK_ID>"
     },
     "custom_data": { "currency": "THB", "value": 2500 }
   }
```

#### Dataset Setup Flow

```
1. เชื่อมต่อ Channel (Facebook Page / IG Account / WABA)
2. ระบบเรียก POST /{PAGE_ID|IG_USER_ID|WABA_ID}/dataset
3. Meta ส่ง dataset_id กลับมา (ถ้ามีอยู่แล้วจะคืน id เดิม)
4. เก็บ dataset_id ใน capi_datasets table
5. ใช้ dataset_id นี้ในการส่ง events ทุกครั้ง
```

> หมายเหตุ: 1 Page/Account = 1 Dataset เท่านั้น

#### Deduplication Strategy

- ทุก event ต้องมี `event_id` ที่ unique (format: `{org_id}_{event_name}_{order_id}_{timestamp}`)
- เก็บ `event_id` ใน `capi_events` table เพื่อป้องกันส่งซ้ำ
- ก่อนส่ง event ตรวจสอบว่า `event_id` นี้ถูกส่งไปแล้วหรือยัง
- Meta ไม่ช่วย deduplicate สำหรับ Business Messaging CAPI → ต้องทำเองฝั่ง server

#### Event Timing Best Practices

- ส่ง event ภายใน **1 ชั่วโมง** หลังเกิดเหตุการณ์จริง เพื่อ attribution ที่ถูกต้อง
- ถ้าส่งไม่สำเร็จ → retry ด้วย exponential backoff (max 3 ครั้ง)
- เก็บ event ใน queue (Redis) ก่อนส่ง เพื่อไม่ block main flow

#### Required Permissions

| Platform | Permission ที่ต้องขอ | หมายเหตุ |
|----------|---------------------|---------|
| Messenger | `page_events` | ถ้ามี `pages_messaging` แล้ว จะได้ auto-approve |
| Instagram | `instagram_manage_events` | ถ้ามี `instagram_manage_messages` แล้ว จะได้ auto-approve |
| WhatsApp | `whatsapp_business_manage_events` | ถ้ามี `whatsapp_business_messaging` แล้ว จะได้ auto-approve |
| ทุก Platform | Ads Management Standard Access | ต้องมี 1,500 API calls สำเร็จใน 15 วัน, error rate < 10% |

### 8. ERP Integration — เชื่อมระบบ ERP

ระบบ ERP (พัฒนาเอง) เชื่อมกับ Anajak Chat ผ่าน **REST API แบบ bidirectional** เพื่อให้ข้อมูลสินค้า, ลูกค้า, order, และสถานะจัดส่งไหลเข้าออกอัตโนมัติ

#### 8.1 Product & Stock Sync (ERP → Chat)

- ดึงรายการสินค้า, ราคา, สต็อกจาก ERP แบบ real-time
- แอดมินค้นหาสินค้าได้ในหน้าแชท เพื่อตอบลูกค้าเรื่องราคาและ stock
- ถ้าสต็อกหมด → แสดง badge แจ้งเตือนในหน้าแชท
- ERP ส่ง webhook `stock-update` เมื่อสต็อกเปลี่ยน → อัปเดต cache

```
แอดมินพิมพ์ค้นหาสินค้า → GET /api/erp/products?q=เสื้อ
                        → Anajak Chat proxy → GET {ERP_API_URL}/products?q=เสื้อ
                        → แสดงผลในหน้าแชท (ชื่อ, ราคา, สต็อก, รูป)
```

#### 8.2 Customer Sync (Bidirectional)

- **ERP → Chat**: ลูกค้าเก่าใน ERP ถูก link กับ contact ในแชท ผ่าน `erp_customer_id`
- **Chat → ERP**: ลูกค้าใหม่ที่ทักมาทางแชท → สร้าง customer ใน ERP อัตโนมัติ
- Match ด้วย: เบอร์โทร, อีเมล, หรือ manual link โดยแอดมิน
- ข้อมูลที่ sync: ชื่อ, เบอร์, อีเมล, ที่อยู่, ประวัติซื้อ

```
ลูกค้าทักแชทครั้งแรก
  → ลูกค้าให้เบอร์โทร 081-xxx-xxxx
  → ระบบค้นหาใน ERP: GET {ERP_API_URL}/customers?phone=081xxxxxxx
  → ถ้าเจอ → link erp_customer_id กับ contact
  → ถ้าไม่เจอ → สร้างใหม่: POST {ERP_API_URL}/customers
```

#### 8.3 Order Creation (Chat → ERP)

- แอดมินสร้าง order ในหน้าแชท (เลือกสินค้าจาก ERP catalog)
- กด confirm → push order ไปยัง ERP ผ่าน API
- ERP ตอบ `erp_order_id` กลับมา → เก็บใน orders table
- พร้อมกัน → ส่ง CAPI event `Purchase` / `OrderCreated` ไป Meta

```
แอดมินสร้าง order ในแชท
  → POST /api/orders (สร้าง order ใน Anajak Chat)
  → POST {ERP_API_URL}/orders (push ไป ERP)
  → ERP ตอบ erp_order_id
  → CAPI Service: ส่ง Purchase event ไป Meta
```

#### 8.4 Shipping & Order Status Webhooks (ERP → Chat → CAPI)

นี่คือจุดเชื่อมสำคัญที่สุด: เมื่อ ERP อัปเดตสถานะ order → ระบบแชททำ 3 อย่างพร้อมกัน

```
ERP อัปเดตสถานะ order เป็น "shipped"
  │
  ├─ 1. POST /api/erp-webhooks/order-status
  │     → อัปเดต orders.status = "shipped" ใน DB
  │
  ├─ 2. ส่งข้อความแจ้งลูกค้าในแชท
  │     → "สินค้าของคุณจัดส่งแล้ว! เลข tracking: TH12345678"
  │
  └─ 3. CAPI Service ส่ง OrderShipped event ไป Meta
        → Facebook รู้ว่าลูกค้าจากแอดนี้ได้รับการจัดส่งจริง
        → Meta optimize แอดให้หาลูกค้าที่ซื้อแล้วจัดส่งสำเร็จ
```

**Order Status Mapping → CAPI Events:**

| ERP Status | Anajak Chat Status | CAPI Event | ส่งข้อความลูกค้า |
|------------|-------------------|------------|-----------------|
| confirmed | confirmed | OrderCreated | "ออเดอร์ยืนยันแล้ว" |
| shipped | shipped | OrderShipped | "จัดส่งแล้ว! Tracking: ..." |
| delivered | delivered | OrderDelivered | "ได้รับสินค้าแล้ว ขอบคุณครับ" |
| cancelled | cancelled | OrderCanceled | "ออเดอร์ถูกยกเลิก" |

#### 8.5 ERP API Authentication

- **Anajak Chat → ERP**: ใช้ API Key ใน header `Authorization: Bearer {ERP_API_KEY}`
- **ERP → Anajak Chat (Webhooks)**: ใช้ HMAC-SHA256 signature verification
  - ERP ส่ง header `X-ERP-Signature: sha256=...` ทุก webhook request
  - Anajak Chat verify ด้วย `ERP_WEBHOOK_SECRET`
  - Reject ถ้า signature ไม่ตรง

#### ERP Webhook Payload ตัวอย่าง

```json
// POST /api/erp-webhooks/order-status
{
  "event": "order.status_changed",
  "erp_order_id": "ERP-2026-001234",
  "old_status": "confirmed",
  "new_status": "shipped",
  "tracking_number": "TH12345678901",
  "tracking_url": "https://track.thailandpost.co.th/...",
  "shipped_at": "2026-03-15T10:30:00Z",
  "timestamp": "2026-03-15T10:30:05Z"
}

// POST /api/erp-webhooks/stock-update
{
  "event": "product.stock_changed",
  "product_id": "PROD-001",
  "product_name": "เสื้อยืดสีขาว Size M",
  "old_stock": 50,
  "new_stock": 3,
  "timestamp": "2026-03-15T11:00:00Z"
}

// POST /api/erp-webhooks/customer-update
{
  "event": "customer.updated",
  "erp_customer_id": "CUST-5678",
  "name": "สมชาย ใจดี",
  "phone": "0812345678",
  "email": "somchai@example.com",
  "address": "123/4 ถ.สุขุมวิท กรุงเทพฯ",
  "timestamp": "2026-03-15T09:00:00Z"
}
```

### 9. AI Auto-Reply Bot — Gemini ตอบแชทอัตโนมัติ

AI Chatbot ขับเคลื่อนด้วย Gemini ที่ใช้ข้อมูลจาก ERP + Knowledge Base ตอบลูกค้าอัตโนมัติ

#### โหมดการทำงาน (Hybrid Mode)

ตั้งค่าได้ต่อ channel ผ่านหน้า Settings:

| โหมด | การทำงาน | เหมาะกับ |
|------|---------|---------|
| **Full Auto** | AI ตอบทันทีโดยไม่ต้องรอแอดมิน | นอกเวลาทำงาน, คำถามง่ายๆ (สต็อก, ราคา, สถานะ order) |
| **Confirm Mode** | AI ร่างคำตอบ → แอดมินกด approve/แก้ไข ก่อนส่ง | ในเวลาทำงาน, คำถามที่ต้องการความแม่นยำ |

สามารถตั้งค่าให้สลับโหมดอัตโนมัติตาม Business Hours:
- ในเวลาทำงาน → Confirm Mode
- นอกเวลาทำงาน → Full Auto

#### แหล่งข้อมูลที่ AI เข้าถึง

```
ลูกค้าถาม: "เสื้อสีขาว size M ยังมีมั้ยคะ?"
                │
                ▼
┌─────────────────────────────────┐
│  Gemini AI Context Builder      │
│                                 │
│  1. Knowledge Base              │
│     → FAQ, นโยบาย, ข้อมูลร้าน   │
│                                 │
│  2. ERP API                     │
│     → GET /products?q=เสื้อสีขาว │
│     → stock: 12 ตัว, ราคา: ฿390  │
│                                 │
│  3. Conversation History        │
│     → ข้อความก่อนหน้าในแชทนี้     │
│                                 │
│  4. Contact Profile             │
│     → ชื่อ, segment, ประวัติซื้อ  │
│                                 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  AI Response:                   │
│  "มีค่ะ เสื้อยืดสีขาว Size M    │
│   ยังเหลือ 12 ตัว ราคา ฿390     │
│   สนใจสั่งเลยมั้ยคะ?"            │
└─────────────────────────────────┘
```

#### Escalation Rules (ส่งต่อแอดมิน)

AI จะส่งต่อให้แอดมินเมื่อ:

| เงื่อนไข | ตัวอย่าง |
|----------|---------|
| ลูกค้าขอคุยกับคน | "ขอคุยกับแอดมินได้มั้ยครับ" |
| Sentiment เป็นลบ | ลูกค้าโกรธ, ร้องเรียน |
| Confidence ต่ำ | คำถามไม่อยู่ใน KB, ไม่มีข้อมูลใน ERP |
| เรื่อง refund / ร้องเรียน | "ขอคืนเงิน", "สินค้ามีปัญหา" |
| คุยไป-มาเกิน N รอบ | ตั้งค่าได้ (default: 5 รอบ) |

เมื่อ escalate → แจ้ง notification ให้แอดมิน + แสดง AI summary ของบทสนทนา

#### Gemini Prompt Template สำหรับ Auto-Reply

```
คุณเป็นผู้ช่วยตอบแชทของร้าน {shop_name}

ข้อมูลที่คุณมี:
- Knowledge Base: {kb_articles}
- ข้อมูลสินค้า: {product_data}
- ประวัติลูกค้า: {contact_profile}
- บทสนทนาก่อนหน้า: {conversation_history}

กฎ:
1. ตอบเป็นภาษาไทย สุภาพ เป็นมิตร
2. ถ้าไม่มีข้อมูล ให้บอกว่าจะส่งต่อให้แอดมิน
3. อย่าให้ข้อมูลที่ไม่แน่ใจ
4. ถ้าลูกค้าต้องการซื้อ ให้แนะนำขั้นตอนสั่งซื้อ
5. ถ้าถามสถานะ order ให้ดึงจาก ERP data

ตอบเป็น JSON:
{
  "reply": "ข้อความตอบลูกค้า",
  "confidence": 0.0-1.0,
  "should_escalate": true/false,
  "escalate_reason": "เหตุผล (ถ้า escalate)",
  "used_sources": ["kb", "erp", "history"]
}
```

### 10. Knowledge Base — ฐานความรู้สำหรับ AI

ฐานข้อมูลความรู้ที่ AI ใช้อ้างอิงในการตอบลูกค้า

#### โครงสร้าง Knowledge Base

| หมวดหมู่ | ตัวอย่างเนื้อหา |
|---------|---------------|
| FAQ | "ส่งฟรีเมื่อซื้อครบ 500 บาท", "รับประกัน 30 วัน" |
| Product Info | รายละเอียดสินค้าเพิ่มเติมที่ไม่ได้อยู่ใน ERP |
| Policies | นโยบายคืนสินค้า, การจัดส่ง, การชำระเงิน |
| Promotions | โปรโมชั่นปัจจุบัน, คูปองส่วนลด |
| Store Info | ที่อยู่, เวลาเปิดปิด, เบอร์ติดต่อ |

#### AI Integration Flow

```
ลูกค้าถามคำถาม
  → Gemini สร้าง embedding ของคำถาม
  → ค้นหา KB articles ที่เกี่ยวข้อง (semantic search via pgvector)
  → ส่ง top-K articles เป็น context ให้ Gemini
  → Gemini ตอบโดยอ้างอิง KB + ERP data
```

#### Admin UI

- CRUD articles (สร้าง, แก้ไข, ลบ, เปิด/ปิด)
- จัดหมวดหมู่ + ติด tags
- Import จาก CSV / Bulk upload
- Preview: ทดสอบถามคำถาม → ดูว่า AI ตอบอะไร
- Usage stats: บทความไหนถูกอ้างอิงบ่อย

### 11. Quick Reply Templates — ข้อความสำเร็จรูป

ข้อความ template ที่แอดมินใช้ตอบได้เร็วขึ้น

#### ตัวอย่าง Templates

| หมวด | Template | ตัวแปร |
|------|---------|--------|
| Greeting | "สวัสดีค่ะ {customer_name} มีอะไรให้ช่วยมั้ยคะ?" | `{customer_name}` |
| Pricing | "สินค้า {product_name} ราคา {price} บาทค่ะ" | `{product_name}`, `{price}` |
| Shipping | "ออเดอร์ {order_id} จัดส่งแล้วค่ะ เลข tracking: {tracking_number}" | `{order_id}`, `{tracking_number}` |
| Closing | "ขอบคุณที่อุดหนุนนะคะ หากมีข้อสงสัยทักมาได้เลยค่ะ" | — |

#### การใช้งาน

- พิมพ์ `/` ในช่อง chat → แสดงรายการ templates (ค้นหาได้)
- เลือก template → ตัวแปรถูกแทนที่อัตโนมัติจากข้อมูล contact/order
- AI ก็สามารถเลือกใช้ template ที่เหมาะสมได้เมื่อตอบอัตโนมัติ
- แอดมินจัดการ templates ได้ในหน้า Settings > Templates

### 12. Business Hours & Auto-Reply — เวลาทำการ

#### การตั้งค่า

- ตั้งเวลาทำการต่อวัน (เช่น จ-ศ 9:00-18:00, ส 9:00-12:00)
- กำหนดวันหยุดพิเศษ (ปีใหม่, สงกรานต์, etc.)
- ตั้งข้อความ auto-reply นอกเวลา (customizable)
- เลือกพฤติกรรมนอกเวลา:
  - แค่ส่ง auto-reply → รอแอดมินตอบวันถัดไป
  - ให้ AI Bot ตอบแทน (Full Auto mode)

#### ตัวอย่าง Auto-Reply

```
"ขอบคุณที่ทักมานะคะ ตอนนี้อยู่นอกเวลาทำการ
(เปิดทำการ จ-ศ 9:00-18:00)
ทีมงานจะตอบกลับโดยเร็วที่สุดค่ะ 🙏"
```

### 13. SLA & Response Time Alerts — แจ้งเตือนตอบช้า

#### การตั้งค่า SLA

| Priority | First Response Target | Resolution Target |
|----------|----------------------|-------------------|
| Urgent | 2 นาที | 30 นาที |
| High | 5 นาที | 1 ชั่วโมง |
| Medium | 15 นาที | 4 ชั่วโมง |
| Low | 1 ชั่วโมง | 24 ชั่วโมง |

#### การทำงาน

- แชทที่ยังไม่ตอบแสดง **countdown timer** แบบ real-time
- เมื่อใกล้ถึง SLA (เหลือ 20%) → แจ้งเตือนสีเหลือง (warning)
- เมื่อ SLA breach → แจ้งเตือนสีแดง + notification ถึง supervisor
- Auto-escalate: มอบหมายให้ supervisor โดยอัตโนมัติเมื่อ SLA breach
- Analytics: SLA compliance rate, average response time, breach count per agent

### 14. Internal Notes — โน้ตภายใน

- แอดมินเพิ่มโน้ตภายในได้ (ลูกค้าไม่เห็น)
- แสดงใน chat timeline ด้วย styling แยก (เช่น พื้นเหลือง, icon โน้ต)
- @mention แอดมินคนอื่นในโน้ตได้ → ส่ง notification
- โน้ตบน contact profile (อยู่ข้ามหลาย conversation)
- ใช้สำหรับ: บันทึกข้อมูลลูกค้า, สื่อสารระหว่างทีม, หมายเหตุ order

### 15. Role & Permission System — ระบบบทบาทและสิทธิ์

#### บทบาทที่กำหนดไว้

| Role | คำอธิบาย | ตัวอย่างสิทธิ์หลัก |
|------|---------|------------------|
| **Owner** | เจ้าของระบบ | ทุกอย่าง, จัดการ billing, ลบ org |
| **Admin** | ผู้ดูแลระบบ | จัดการทีม, channels, ดูแชททั้งหมด, analytics |
| **Supervisor** | หัวหน้าทีม | ดูแชททีม, reassign, analytics, จัดการ SLA |
| **Agent** | แอดมินตอบแชท | ดูแชทที่ assigned, ใช้ templates, เพิ่มโน้ต |
| **Bot Manager** | ผู้จัดการ AI | จัดการ AI settings, Knowledge Base, templates |

#### Permissions (Granular)

```
chat:view_all           ดูแชททั้งหมด
chat:view_assigned      ดูเฉพาะแชทที่ assigned
chat:assign             มอบหมายแชท
chat:transfer           โอนแชท

contacts:view           ดูข้อมูลลูกค้า
contacts:edit           แก้ไขข้อมูลลูกค้า
contacts:delete         ลบข้อมูลลูกค้า

orders:create           สร้าง order
orders:edit             แก้ไข order
orders:view             ดู order

analytics:view          ดู dashboard
analytics:export        export รายงาน

settings:channels       จัดการ channels (เชื่อมต่อ/ตัดการเชื่อมต่อ)
settings:ai             จัดการ AI Bot settings
settings:templates      จัดการ Quick Reply Templates
settings:knowledge_base จัดการ Knowledge Base
settings:business_hours จัดการเวลาทำการ
settings:sla            จัดการ SLA targets
settings:roles          จัดการ roles & permissions
settings:erp            จัดการ ERP connection

erp:sync                trigger sync กับ ERP
capi:manage             จัดการ CAPI datasets
capi:view_events        ดู CAPI events log
```

#### Custom Roles

- นอกจาก system roles ข้างบน สามารถสร้าง custom role ได้
- เลือก permissions ที่ต้องการ → ตั้งชื่อ role → assign ให้ user

### 16. Self-Service Channel Setup — ตั้งค่าช่องทางแชทในหน้า Settings

ย้ายการตั้งค่า channel จาก env vars มาเป็น UI ในหน้า Settings เพื่อให้ผู้ใช้เชื่อมต่อเองได้

#### Channel Setup Flow

**Facebook Messenger:**
```
1. กด "Connect Facebook" ในหน้า Settings > Channels
2. Facebook OAuth → Login with Facebook → เลือก Page
3. ระบบรับ Page Access Token + Page ID อัตโนมัติ
4. Auto-setup webhook URL ไปที่ Facebook
5. Auto-create CAPI dataset
6. แสดง status: Connected ✓
```

**Instagram DM:**
```
1. กด "Connect Instagram"
2. Facebook OAuth → Login → เลือก IG Business Account
3. ระบบรับ Access Token + IG User ID
4. Setup webhook สำหรับ Instagram messages
5. Auto-create CAPI dataset
6. แสดง status: Connected ✓
```

**LINE OA:**
```
1. กด "Connect LINE"
2. กรอก Channel ID, Channel Secret, Channel Access Token
3. ระบบ verify ด้วยการเรียก LINE API
4. Setup webhook URL
5. แสดง status: Connected ✓
```

**WhatsApp (optional):**
```
1. กด "Connect WhatsApp"
2. Meta Embedded Signup flow
3. ระบบรับ WABA ID + Phone Number ID
4. Auto-create CAPI dataset
5. แสดง status: Connected ✓
```

#### Channel Card UI

แต่ละ channel แสดงเป็น card ในหน้า Settings > Channels:

```
┌─────────────────────────────────────────┐
│ 🟢 Facebook Messenger                  │
│ Page: ร้านอนาจัก                         │
│ Status: Connected                       │
│ Last message: 5 min ago                 │
│ Total messages: 12,345                  │
│ CAPI Dataset: Active                    │
│                                         │
│ [Reconnect]  [Disconnect]  [Settings]   │
└─────────────────────────────────────────┘
```

#### Settings Page Structure

```
Settings/
├── Channels          # เชื่อมต่อ/ตัดการเชื่อมต่อ channels
├── AI Bot            # โหมด (auto/confirm), persona, escalation rules
├── Knowledge Base    # CRUD articles, import CSV
├── Templates         # CRUD quick reply templates
├── Business Hours    # เวลาทำการ, วันหยุด
├── SLA               # SLA targets ต่อ priority
├── Team & Roles      # เชิญสมาชิก, assign roles, จัดการ permissions
├── ERP Connection    # URL, API key, test connection, sync log
├── CAPI              # Datasets, event log, retry failed events
└── General           # ชื่อ org, timezone, language, notification preferences
```

### 17. Media Library — ระบบจัดการไฟล์และรูปภาพ

ระบบจัดเก็บและจัดการรูปภาพ, ไฟล์, สื่อโปรโมชั่น เพื่อส่งให้ลูกค้าในแชทได้ง่ายและรวดเร็ว

#### ความสามารถหลัก

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| **Upload & Organize** | อัปโหลดรูปสินค้า, แบนเนอร์โปรโมชั่น, size chart, PDF catalog, วิดีโอ จัดเก็บในโฟลเดอร์ |
| **Quick Send in Chat** | แอดมินเปิด Media Library ในหน้าแชท → เลือกรูป/ไฟล์ → ส่งให้ลูกค้าทันที |
| **Folders / Categories** | จัดหมวดหมู่: รูปสินค้า, โปรโมชั่น, Size Chart, Catalog, ใบเสร็จ, โฟลเดอร์กำหนดเอง |
| **Search & Filter** | ค้นหาตามชื่อ, tags, หมวดหมู่, ประเภทไฟล์ |
| **Bulk Upload** | Drag-and-drop หลายไฟล์พร้อมกัน |
| **Thumbnail** | สร้าง thumbnail อัตโนมัติสำหรับรูปภาพ |
| **AI Integration** | AI Bot สามารถค้นหาและส่งรูปจาก Media Library ให้ลูกค้าอัตโนมัติ (เช่น ลูกค้าถามรูปสินค้า) |

#### การใช้งานในแชท

```
แอดมินกำลังตอบแชท
  → กดปุ่ม 📎 หรือ icon "Media Library"
  → เปิด panel ด้านข้าง: browse โฟลเดอร์ / ค้นหา
  → คลิกเลือกรูป → Preview → กด "ส่ง"
  → รูปถูกส่งให้ลูกค้าผ่าน platform (FB/IG/LINE)
```

#### AI Bot + Media Library

```
ลูกค้า: "ขอดูรูปเสื้อสีขาวหน่อยค่ะ"
  → AI Bot ค้นหาใน Media Library: tags=["เสื้อ", "สีขาว"]
  → เจอรูป 3 รูป
  → AI ส่งรูปพร้อมข้อความ:
    "เสื้อยืดสีขาวมีแบบนี้ค่ะ ราคาเริ่มต้น ฿390"
    [รูป 1] [รูป 2] [รูป 3]
```

#### Supported File Types

| ประเภท | นามสกุล | ขนาดสูงสุด |
|--------|--------|-----------|
| Image | jpg, png, webp, gif | 10 MB |
| Video | mp4, mov | 50 MB |
| Document | pdf, doc, docx, xls, xlsx | 20 MB |
| Other | zip, csv | 20 MB |

#### Storage

- เก็บไฟล์ใน **Supabase Storage** (มี CDN + image transforms ในตัว)
- สร้าง Storage Bucket ต่อ organization: `media-{org_id}`
- รูป original เก็บใน bucket, thumbnail ใช้ **Supabase Image Transformations** (ไม่ต้องสร้าง thumbnail เอง)
- Signed URL สำหรับ download/preview (หมดอายุตามเวลา) — ใช้ `supabase.storage.from(bucket).createSignedUrl()`
- จำกัด storage quota ต่อ organization (สำหรับ SaaS ในอนาคต)
- RLS policy บน bucket เพื่อ isolate files ระหว่าง orgs

---

## Phases การพัฒนา

### Phase 1 — Foundation (สัปดาห์ 1-3)

```
✅ Project setup (Next.js 15 + Supabase Cloud)
✅ Supabase project setup (Database, Auth, Storage, Realtime)
✅ Prisma ORM setup + schema + initial migration
✅ Authentication & Authorization (Supabase Auth)
✅ Role & Permission system (roles table, granular permissions)
✅ Organization & User management
✅ Basic UI layout (sidebar, chat list, chat view)
✅ Settings page structure (Channels, Team, General)
```

### Phase 2 — Core Chat (สัปดาห์ 4-6)

```
✅ Self-Service Channel Setup UI (Settings > Channels)
✅ Facebook Messenger integration (OAuth flow + webhook + send API)
✅ Instagram DM integration (OAuth flow + Messenger Platform for IG)
✅ LINE OA integration (Messaging API, manual credential input)
✅ Unified inbox UI
✅ Real-time messaging (Supabase Realtime)
✅ Message history & search
✅ File/image handling
✅ Internal Notes (conversation + contact level)
✅ Quick Reply Templates (CRUD + / shortcut in chat)
✅ Media Library (upload, folders, categories, search, thumbnails)
✅ Media picker in chat UI (browse + insert image/file into message)
```

### Phase 3 — Multi-Admin & Routing (สัปดาห์ 7-8)

```
✅ Admin assignment (auto + manual)
✅ Chat transfer between admins
✅ Workload dashboard
✅ Collision detection
✅ Notification system (in-app + push)
✅ Business Hours configuration (เวลาทำการ + วันหยุด)
✅ Auto-reply outside business hours
✅ SLA configuration (targets per priority)
✅ SLA countdown timer + breach alerts
✅ SLA auto-escalate to supervisor
```

### Phase 4 — Ad Attribution & CAPI (สัปดาห์ 9-11)

```
✅ Facebook Referral Data parsing (ad_id, placement)
✅ UTM parameter tracking
✅ PSID / IGSID / ctwa_clid extraction จาก webhook events
✅ Ad performance dashboard
✅ Source attribution per conversation
✅ Revenue tracking per ad

-- Conversions API (CAPI) --
✅ Dataset API setup (สร้าง dataset ต่อ Page/IG/WABA)
✅ CAPI event service (ส่ง events กลับ Meta)
✅ Auto-send Purchase event เมื่อสร้าง/อัปเดต Order
✅ Auto-send LeadSubmitted เมื่อลูกค้าให้เบอร์/อีเมล
✅ Event deduplication logic (event_id unique check)
✅ Event queue + retry mechanism (DB-based, cron retry)
✅ CAPI events log UI (ดู events ที่ส่งไปแล้ว, status, errors)
✅ Events Manager verification guide
```

### Phase 4.5 — ERP Integration (สัปดาห์ 12-13)

```
✅ ERP connection setup (base_url, API key, webhook secret)
✅ Product/Stock sync (search + detail proxy)
✅ Customer sync (bidirectional: match by phone/email)
✅ Order creation → push to ERP
✅ ERP webhook receivers (order-status, stock-update, customer-update)
✅ ERP order status → auto-send CAPI events (OrderShipped, OrderDelivered)
✅ ERP order status → auto-send message to customer in chat
✅ Sync log UI (ดูประวัติ sync, errors)
✅ Webhook signature verification (HMAC-SHA256)
```

### Phase 5 — AI & Analytics (สัปดาห์ 14-17)

```
✅ Gemini API integration
✅ Smart reply suggestions (confirm mode)
✅ Auto conversation summary
✅ Sentiment & intent analysis
✅ Customer segmentation (AI-powered)
✅ Drop-off & churn analysis
✅ Analytics dashboard (including SLA compliance report)

-- Knowledge Base --
✅ Knowledge Base CRUD UI (Settings > Knowledge Base)
✅ Article embeddings via Gemini (pgvector)
✅ Semantic search for AI context
✅ Import from CSV
✅ Usage stats per article

-- AI Auto-Reply Bot --
✅ AI Bot config UI (Settings > AI Bot)
✅ Full Auto mode (AI ตอบทันที)
✅ Confirm mode (AI ร่าง → แอดมิน approve)
✅ Hybrid mode (auto-switch ตาม Business Hours)
✅ ERP data access (product, stock, order status)
✅ KB-powered answers (semantic search → context injection)
✅ Escalation rules (sentiment, confidence, max rounds)
✅ AI reply log (audit trail)
```

### Phase 6 — Polish & Scale (สัปดาห์ 18-20)

```
✅ WhatsApp Cloud API integration (optional, CAPI-ready)
✅ Website live chat widget
✅ Customer journey timeline UI
✅ Export reports (CSV, PDF)
✅ Performance optimization
✅ Security audit
✅ Documentation
```

### Future — SaaS Expansion

```
○ แยก Fastify backend (รองรับ WebSocket server ถาวร + heavy processing)
○ เพิ่ม Upstash Redis (cache, queue, rate limiting)
○ Turborepo monorepo (แยก web + api + shared packages)
○ Multi-tenant isolation (RLS)
○ Subscription & billing (Stripe)
○ Onboarding wizard
○ API keys for third-party integration
○ Marketplace for plugins
○ White-label option
○ ClickHouse for heavy analytics
```

---

## โครงสร้างโปรเจกต์ (Project Structure)

> **Single Next.js project** — ไม่ต้อง monorepo, ไม่ต้อง Turborepo

```
anajak-chat2/
├── app/                            # Next.js App Router
│   ├── (auth)/                     # Login, register
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/                # Main app (protected routes)
│   │   ├── inbox/                  # Unified inbox
│   │   │   ├── page.tsx
│   │   │   └── [conversationId]/page.tsx
│   │   ├── contacts/               # Customer list
│   │   ├── analytics/              # Dashboards
│   │   ├── ads/                    # Ad performance
│   │   ├── media-library/          # Media Library
│   │   └── settings/               # Org settings
│   │       ├── channels/           # Channel setup (OAuth, connect/disconnect)
│   │       ├── ai-bot/             # AI Bot config (mode, persona, escalation)
│   │       ├── knowledge-base/     # KB CRUD, import, preview
│   │       ├── templates/          # Quick Reply Templates CRUD
│   │       ├── business-hours/     # เวลาทำการ + วันหยุด
│   │       ├── sla/                # SLA targets
│   │       ├── team/               # Team members, roles, permissions
│   │       ├── erp/                # ERP connection config
│   │       ├── capi/               # CAPI datasets, event log
│   │       └── general/            # Org name, timezone, notifications
│   ├── api/                        # Next.js API Routes (backend)
│   │   ├── auth/                   # Supabase Auth helpers
│   │   ├── conversations/          # Chat CRUD + assign + transfer
│   │   ├── messages/               # Send/receive messages
│   │   ├── contacts/               # Contact CRUD + journey
│   │   ├── channels/               # Channel setup + OAuth callbacks
│   │   ├── ai/                     # Gemini integration
│   │   ├── ai-bot/                 # AI Auto-Reply Bot
│   │   ├── knowledge-base/         # KB CRUD + semantic search
│   │   ├── templates/              # Quick Reply Templates
│   │   ├── notes/                  # Internal Notes
│   │   ├── roles/                  # Role & Permission management
│   │   ├── business-hours/         # Business hours + holidays
│   │   ├── sla/                    # SLA config + alerts
│   │   ├── media/                  # Media Library (upload, folders)
│   │   ├── orders/                 # Orders CRUD
│   │   ├── analytics/              # Analytics endpoints
│   │   ├── capi/                   # Conversions API
│   │   ├── erp/                    # ERP integration
│   │   ├── erp-webhooks/           # ERP webhook receivers
│   │   └── webhooks/               # Platform webhooks (FB, LINE, IG, WA)
│   └── layout.tsx
│
├── components/                     # React components
│   ├── chat/                       # Chat UI components
│   ├── media-library/              # Media Library UI
│   ├── dashboard/                  # Dashboard widgets
│   └── ui/                         # shadcn/ui components
│
├── lib/                            # Shared libraries
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient (frontend)
│   │   └── server.ts               # createServerClient (SSR / API routes)
│   ├── prisma.ts                   # Prisma client singleton
│   ├── gemini.ts                   # Gemini API client
│   ├── integrations/               # External service integrations
│   │   ├── facebook.ts
│   │   ├── instagram.ts
│   │   ├── line.ts
│   │   ├── whatsapp.ts
│   │   ├── capi.ts                 # Conversions API helper
│   │   └── erp.ts                  # ERP API helper
│   ├── hooks/                      # Custom React hooks
│   ├── stores/                     # Zustand stores
│   └── utils/                      # Utility functions
│
├── prisma/
│   ├── schema.prisma               # Prisma schema (database models)
│   └── migrations/                 # Prisma migrations
│
├── public/                         # Static assets
├── .env.example                    # Environment variables template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Key API Endpoints

```
# Auth
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout

# Conversations
GET    /api/conversations                    # List (filter: status, assigned_to, channel)
GET    /api/conversations/:id                # Detail + messages
POST   /api/conversations/:id/assign         # Assign to admin
POST   /api/conversations/:id/transfer       # Transfer
PATCH  /api/conversations/:id/status         # Update status

# Messages
GET    /api/conversations/:id/messages       # List messages
POST   /api/conversations/:id/messages       # Send message

# Contacts
GET    /api/contacts                         # List
GET    /api/contacts/:id                     # Detail + journey
GET    /api/contacts/:id/timeline            # Journey timeline
PATCH  /api/contacts/:id/tags                # Update tags

# AI
POST   /api/ai/suggest-reply                 # Get smart reply suggestions
POST   /api/ai/summarize/:conversationId     # Summarize conversation
POST   /api/ai/analyze-churn                 # Analyze drop-off reasons
GET    /api/ai/segments                      # Get customer segments

# AI Bot
GET    /api/ai-bot/config                    # Get bot config (per channel or default)
PUT    /api/ai-bot/config                    # Update bot config
GET    /api/ai-bot/reply-log                 # List AI reply log (audit)
POST   /api/ai-bot/reply-log/:id/approve     # Approve AI draft
POST   /api/ai-bot/reply-log/:id/reject      # Reject AI draft
POST   /api/ai-bot/reply-log/:id/edit        # Edit and send AI draft

# Knowledge Base
GET    /api/knowledge-base                   # List articles (filter by category, tags)
POST   /api/knowledge-base                   # Create article
GET    /api/knowledge-base/:id               # Get article detail
PUT    /api/knowledge-base/:id               # Update article
DELETE /api/knowledge-base/:id               # Delete article
POST   /api/knowledge-base/import            # Import from CSV
POST   /api/knowledge-base/search            # Semantic search (for AI context)
GET    /api/knowledge-base/stats             # Usage stats per article

# Quick Reply Templates
GET    /api/templates                        # List templates (filter by category)
POST   /api/templates                        # Create template
PUT    /api/templates/:id                    # Update template
DELETE /api/templates/:id                    # Delete template
POST   /api/templates/:id/render             # Render template with variables

# Business Hours
GET    /api/business-hours                   # Get business hours config
PUT    /api/business-hours                   # Update business hours
GET    /api/business-hours/holidays          # List holidays
POST   /api/business-hours/holidays          # Add holiday
DELETE /api/business-hours/holidays/:id      # Remove holiday
GET    /api/business-hours/is-open           # Check if currently open

# SLA
GET    /api/sla/config                       # Get SLA targets
PUT    /api/sla/config                       # Update SLA targets
GET    /api/sla/report                       # SLA compliance report

# Notes
GET    /api/notes/:type/:id                  # List notes (type=conversation|contact)
POST   /api/notes/:type/:id                  # Add note
DELETE /api/notes/:noteId                    # Delete note

# Roles & Permissions
GET    /api/roles                            # List roles
POST   /api/roles                            # Create custom role
PUT    /api/roles/:id                        # Update role permissions
DELETE /api/roles/:id                        # Delete custom role (not system roles)
GET    /api/roles/:id/permissions             # Get role permissions

# Channel Setup (OAuth flows)
POST   /api/channels/facebook/connect        # Start Facebook OAuth
GET    /api/channels/facebook/callback       # Facebook OAuth callback
POST   /api/channels/instagram/connect       # Start Instagram OAuth
GET    /api/channels/instagram/callback      # Instagram OAuth callback
POST   /api/channels/line/connect            # Verify & connect LINE credentials
POST   /api/channels/whatsapp/connect        # Start WhatsApp Embedded Signup
GET    /api/channels/whatsapp/callback       # WhatsApp callback
POST   /api/channels/:id/test                # Test channel connection
POST   /api/channels/:id/reconnect           # Reconnect channel

# Media Library
GET    /api/media/folders                    # List folders (tree)
POST   /api/media/folders                    # Create folder
PUT    /api/media/folders/:id                # Rename/move folder
DELETE /api/media/folders/:id                # Delete folder (+ contents)
GET    /api/media/files                      # List files (filter: folder, type, tags, search)
POST   /api/media/files/upload               # Upload file (multipart)
POST   /api/media/files/bulk-upload          # Upload multiple files
GET    /api/media/files/:id                  # Get file detail + metadata
PUT    /api/media/files/:id                  # Update metadata (tags, description, folder)
DELETE /api/media/files/:id                  # Delete file (from S3 + DB)
GET    /api/media/files/:id/url              # Get signed URL for download/preview

# Analytics
GET    /api/analytics/overview               # Overview stats
GET    /api/analytics/ads                    # Ad performance
GET    /api/analytics/agents                 # Agent performance
GET    /api/analytics/churn                  # Churn analysis
GET    /api/analytics/segments               # Customer segments
GET    /api/analytics/funnel                 # Conversion funnel

# Channels
GET    /api/channels                         # List connected channels
POST   /api/channels                         # Connect new channel
DELETE /api/channels/:id                     # Disconnect

# CAPI (Conversions API)
POST   /api/capi/datasets                   # Setup dataset for a channel (Page/IG/WABA)
GET    /api/capi/datasets                   # List configured datasets
DELETE /api/capi/datasets/:id               # Remove dataset
POST   /api/capi/events/send                # Manually trigger a CAPI event
GET    /api/capi/events                     # List sent events (audit log, filter by status)
POST   /api/capi/events/retry/:id           # Retry a failed event

# ERP Integration (outbound: Chat → ERP)
GET    /api/erp/products                    # Search products from ERP (proxy)
GET    /api/erp/products/:id                # Product detail + stock
POST   /api/erp/orders                      # Push new order to ERP
GET    /api/erp/orders/:id/status           # Pull order status from ERP
POST   /api/erp/customers/sync              # Sync customer data to ERP
GET    /api/erp/customers/search            # Search customer in ERP (by phone/email)
GET    /api/erp/sync-log                    # View sync history (audit)

# ERP Webhooks (inbound: ERP → Chat)
POST   /api/erp-webhooks/order-status       # Receive order status (triggers CAPI events)
POST   /api/erp-webhooks/stock-update       # Receive stock level changes
POST   /api/erp-webhooks/customer-update    # Receive customer data changes

# Webhooks (receive from platforms)
POST   /api/webhooks/facebook
POST   /api/webhooks/line
POST   /api/webhooks/instagram
POST   /api/webhooks/whatsapp
```

---

## การติดตั้งและรัน (Getting Started)

```bash
# 1. สร้าง Supabase Project
# - ไปที่ https://supabase.com → New Project
# - เปิด pgvector extension: SQL Editor → CREATE EXTENSION IF NOT EXISTS vector;
# - สร้าง Storage Buckets: media (public), chat-files (private)
# - คัดลอก URL, anon key, service role key จาก Settings > API

# 2. Clone & Install
pnpm install

# 3. Setup environment
cp .env.example .env
# แก้ไข NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, GEMINI_API_KEY

# 4. Setup Prisma
pnpm prisma generate    # Generate Prisma Client
pnpm prisma migrate dev # Run migrations → Supabase PostgreSQL

# 5. Start development (ไม่ต้อง Docker เลย!)
pnpm dev
```

---

## Environment Variables

```env
# ─── Supabase ───
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...       # Public anon key (safe for frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # Service role key (API routes only, NEVER expose to frontend)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres  # Supabase connection string (สำหรับ Prisma)
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres    # Direct connection (สำหรับ Prisma migrate)

# ─── Gemini AI ───
GEMINI_API_KEY=your_gemini_api_key

# ─── Facebook Messenger ───
FB_APP_ID=
FB_APP_SECRET=
FB_VERIFY_TOKEN=
FB_PAGE_ACCESS_TOKEN=
FB_PAGE_ID=                                 # สำหรับ CAPI dataset setup

# ─── Instagram ───
IG_APP_ID=
IG_APP_SECRET=
IG_USER_ID=                                 # Instagram Business Account ID สำหรับ CAPI

# ─── WhatsApp (optional, CAPI-ready) ───
WA_BUSINESS_ACCOUNT_ID=                     # WABA ID สำหรับ CAPI
WA_PHONE_NUMBER_ID=
WA_ACCESS_TOKEN=

# ─── LINE ───
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=

# ─── ERP Integration ───
ERP_API_URL=                                # Base URL ของ ERP API (e.g. https://erp.example.com/api)
ERP_API_KEY=                                # API key สำหรับเรียก ERP
ERP_WEBHOOK_SECRET=                         # Secret สำหรับ verify webhook จาก ERP (HMAC-SHA256)

# ─── App ───
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## สรุป

ระบบ Anajak Chat — Unified Chat Management System ที่ครบวงจร:

### แก้ปัญหาหลัก

1. **รู้ว่าลูกค้ามาจากแอดไหน** → Ad Attribution ติดตามทุก conversation (Referral Data ขาเข้า)
2. **ลูกค้าหายไปเพราะอะไร** → Gemini วิเคราะห์ Drop-off Reason อัตโนมัติ
3. **ลูกค้ากลับมาซื้อเท่าไหร่** → Customer Journey + Order Tracking
4. **กลุ่มลูกค้าคือใคร** → AI Segmentation แบ่งกลุ่มอัตโนมัติ
5. **ปัจจัยที่ทำให้หาย** → Churn Analysis + รายงานสรุป
6. **แอดมินหลายคน** → Auto-assign, Transfer, Workload Balance + Role & Permission
7. **Optimize แอด Facebook ด้วยข้อมูลจริง** → CAPI ส่ง Purchase/Lead events กลับ Meta
8. **เชื่อมข้อมูลกับ ERP** → สินค้า/สต็อก/ลูกค้า sync อัตโนมัติ + order lifecycle → CAPI
9. **AI ตอบแชทอัตโนมัติ** → Gemini + ERP data + Knowledge Base ตอบลูกค้า 24/7 (hybrid mode)

### ระบบเสริมที่ครบ

| ระบบ | รายละเอียด |
|------|-----------|
| AI Auto-Reply Bot | Gemini ตอบแชท hybrid mode (full auto / confirm) ใช้ข้อมูลจาก ERP + KB |
| Knowledge Base | ฐานความรู้ให้ AI อ้างอิง (FAQ, นโยบาย, โปรโมชั่น) + semantic search |
| Quick Reply Templates | ข้อความสำเร็จรูป + ตัวแปร + shortcut `/` |
| Business Hours | เวลาทำการ + วันหยุด + auto-reply/AI นอกเวลา |
| SLA Alerts | ตั้ง target ตอบตาม priority + countdown + auto-escalate |
| Internal Notes | โน้ตภายใน + @mention ระหว่างทีม |
| Role & Permissions | 5 system roles + custom roles + granular permissions |
| Self-Service Channel Setup | เชื่อมต่อ FB/IG/LINE/WA ผ่านหน้า Settings (OAuth) |
| Media Library | อัปโหลด/จัดการรูปสินค้า, โปรโมชั่น, ไฟล์ → ส่งให้ลูกค้าในแชทได้ง่าย, AI ส่งรูปอัตโนมัติ |
| Settings UI | ตั้งค่าทุกอย่างผ่าน UI (ไม่ต้องแก้ env vars) |

### Tech & Platforms

**Tech Stack (Solo Dev)**: Next.js 15 + Prisma + Supabase Cloud (DB + Auth + Storage + Realtime) + Gemini API
**Deploy**: Vercel (ที่เดียวจบ)
**Platform หลัก**: Facebook Messenger + Instagram DM + LINE OA
**CAPI รองรับ**: Messenger + Instagram + WhatsApp (พร้อมใช้ทันทีเมื่อเชื่อม channel)
**ERP**: เชื่อมผ่าน REST API + Webhooks (bidirectional)
**AI**: Gemini API (auto-reply, analysis, segmentation, KB semantic search)

> เริ่มพัฒนาจาก Phase 1 (Foundation) แล้วค่อยๆ เพิ่มฟีเจอร์ตาม Phase (ประมาณ 20 สัปดาห์)
> Stack ออกแบบให้ solo dev ทำได้ — เมื่อ scale เป็น SaaS ค่อยเพิ่ม Fastify, Redis, Turborepo ทีหลัง
