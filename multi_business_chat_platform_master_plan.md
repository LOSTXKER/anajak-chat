# Multi-Business Chat Platform – Master Plan

## 1) Vision & Positioning

## 1.1 Tech Stack Decision (Updated)
- **Frontend/App:** Next.js
- **Backend Platform:** Supabase (Postgres + Auth + RLS + Realtime + Storage)
- **Data Access:** supabase-js (RLS-first) + Postgres RPC / Supabase Edge Functions สำหรับงานที่ logic หนัก
- **Not using:** (ไม่ใช้ Prisma), MCP


**Business Communication OS** สำหรับหลายธุรกิจ
- รวมแชททุกช่องทาง
- เปลี่ยนบทสนทนา → งาน → รายได้ → Insight
- ปรับแต่งได้ตามแต่ละธุรกิจ (ไม่ hardcode วงการ)

---

## 2) Product Principles (หลักที่ห้ามพลาด)
- **Multi-tenant by design** (แยกธุรกิจ/ทีม/ข้อมูลชัดเจน)
- **Config > Code** (ตั้งค่าได้มากกว่าการเขียนโค้ด)
- **Entity-based** (ใช้ object กลางแทนคำว่า order/ticket)
- **AI-assisted, Human-controlled** (AI ช่วย แต่คนคุม)

---

## 3) Core System Architecture

### 3.1 Information Architecture (UX Foundation)
- Sidebar Navigation (Desktop): Inbox / Entities / Contacts / Files / Automation / AI Center / Analytics / Settings
- Mobile Navigation: Inbox / Entities / AI / Analytics / More
- Command Palette (⌘K): ค้นหาแชท / ลูกค้า / งาน / ไฟล์ แบบเร็ว

### 3.2 UX Principles
- Chat-first, Context-aware
- One screen, one outcome
- Reduce cognitive load (ไม่ต้องสลับหลายหน้า)
- Visible ownership & status (ใครดูแล / ค้างอะไร)

### 3.3 Design System (UI)
- Clean SaaS style (Light / Dark mode)
- Color: Neutral base + 1 accent (status-driven)
- Typography scale: 12 / 14 / 16 / 20 / 24
- Components:
  - Status / SLA / Risk badges
  - Drawer & Context panel
  - Table with inline actions
  - Empty-state with CTA

---

## 4) Core Features (MVP – ใช้ได้ทุกธุรกิจ)

### 4.1 Inbox UX (Chatcone DNA + Upgrade)
- 3-column layout: Chat list / Chat thread / Context panel
- Claim / Release (ownership & locking)
- Presence & typing indicator
- SLA timer + Risk badge
- AI Assist panel (draft / summary / next action)

### 4.2 Multi-Agent Chat UX
- Owner lock (กันตอบซ้อน)
- Quick assign / reassign
- Internal note & @mention
- Shift handoff with AI summary

### 4.3 Entity Detail UX (Work / Deal / Ticket)
- Header: status / owner / value / due date
- Tabs: Overview / Tasks / Files / Notes / Outcome / Feedback
- Checklist per task + assignee
- Outcome attribution (Lead owner / Closer / Support)

### 4.4 File & Approval UX
- File timeline with versioning
- Inline preview
- Client approval page (Approve / Request change)
- Approval log & version history

### 4.5 AI Center UX
- Training Center (KB / Memory / Feedback)
- Model & API Settings
- Sandbox test panel
- Usage & cost dashboard

### 4.6 Analytics & Owner Dashboard UX
- KPI cards
- Funnel (Chat → Entity → Win)
- Agent leaderboard
- VoC & FAQ insight
- Weekly AI summary card

---

## 5) AI Layer (Business-Adaptive, Trainable & Cost-Aware)

### 5.1 AI Memory per Business
- Business Memory: โทนภาษา, แนวการขาย, เงื่อนไขสำคัญ, ข้อห้าม
- Pricing & Policy Memory: ราคาคร่าว ๆ, SLA, เงื่อนไขพิเศษ
- Editable Memory: เจ้าของแก้ไข / ล็อก memory ได้

### 5.2 AI Assist
- Draft reply ตามโทนร้าน
- Suggest next action / next question
- Conversation summary (handoff / daily recap)

### 5.3 AI Classification & Risk Detection
- Intent detection + confidence score
- Auto-tag / auto-priority
- Opportunity detection (โอกาสปิด)
- Risk detection (อารมณ์ลบ / คำเสี่ยง)

### 5.4 AI Guardrails & Policy Engine
- เตือนคำตอบเสี่ยง (ราคา / เวลา / policy)
- Hard stop เมื่อฝ่าฝืน policy

### 5.5 AI Training System (หัวใจความฉลาดตามร้าน)
- **Knowledge Base Training (RAG)**
  - Upload FAQ / ราคา / SOP / เอกสาร / รูป
  - แยกหมวด + Test question
  - บังคับตอบจาก KB ก่อนเสมอ
- **Conversation-Based Learning**
  - เรียนรู้จากแชทที่ปิดได้ / หลุด (Win / Lost)
  - วิเคราะห์ pattern คำพูด / flow ที่เวิร์ค
- **Feedback Training**
  - 👍 / 👎 ต่อทุก AI output
  - ใช้ feedback ปรับ prompt / policy ต่อ business
- **Memory Training**
  - AI เสนอ memory ใหม่ → Owner approve

### 5.6 AI Model Routing
- เลือกโมเดลแยกตามงาน:
  - Draft Reply / Summary / Intent / RAG / Risk
- รองรับ multi-provider (ออกแบบเผื่อ)

### 5.7 AI Cost Control & Ops
- Budget ต่อวัน / เดือน ต่อ business
- Token limit / Rate limit
- Fallback model เมื่อเกินงบ
- Usage dashboard แยกตามฟีเจอร์

---

## 6) Chatbot System (อ้างอิง Chatcone / Zwiz)
- Flow Builder (no-code)
- AI fallback เมื่อ flow ไม่ครอบคลุม
- Pre-qualify lead (เก็บข้อมูลก่อนส่งคน)
- Escalation rule → ส่งให้ Human

---

## 7) Analytics & Insight (Owner-Grade)

### 7.1 Outcome & Attribution Analytics
- Chat → Entity → Outcome (Win / Lost / Pending)
- Primary Closer / Lead Owner / Support roles
- Attribution model: First-touch / Last-touch / Weighted

### 7.2 Revenue & Performance by Agent
- รายได้ต่อพนักงาน
- Close rate / Avg deal size
- Time to close

### 7.3 Team & Coaching Insight
- ปิดเดี่ยว vs ปิดเป็นทีม
- วิเคราะห์บทบาทที่เหมาะกับแต่ละ agent
- AI แนะนำการจัดทีม

### 7.4 Customer Lifetime & Risk Insight
- Customer Lifetime Value (LTV)
- Purchase frequency / Avg deal
- Churn risk score
- AI แจ้งเตือนลูกค้าที่เสี่ยงหาย

### 7.5 Customer Feedback & Voice of Customer (VoC)
- เก็บ Feedback หลังจบเคส / ปิดดีล
- ประเภท feedback: ปัญหาที่พบ / สิ่งที่ชอบ / สิ่งที่ควรปรับ
- CSAT / NPS / Rating (config ได้)
- ผูก feedback กับ:
  - Entity
  - Agent
  - Channel
- FAQ Insight:
  - คำถามที่ถูกถามบ่อย
  - ปัญหาที่เกิดซ้ำ
- AI วิเคราะห์ trend:
  - Pain point หลักของลูกค้า
  - Feature ที่ลูกค้าต้องการ

### 7.6 Executive Summary (AI-generated)
- ใครทำเงิน
- ดีลใหญ่ / ดีลเสี่ยง
- Pain point ลูกค้ารายเดือน
- สิ่งที่ลูกค้าถามบ่อยที่สุด

---

## 8) Integration & Platform (Self-Growing Platform)
- Public REST API
- Webhook in / out
- Zapier / n8n ready
- Data export (CSV / API)
- Data ownership & portability
- Module system / Marketplace

---

## 8.7 AI Tooling Layer (No MCP)
- ใช้ Internal Tool API ผ่าน REST / Supabase Edge Functions / Postgres RPC
- Tool permission ตาม role / business
- แยก Read-only tools vs Action tools
- Audit log ทุก action
- ออกแบบ interface ให้ “อัปเกรดไป MCP” ได้ในอนาคตถ้าจำเป็น


## 8.6 Channel Integration Architecture (FB / IG / LINE / TikTok / Shopee)
### Connector Framework
- OAuth / Token vault (encrypt)
- Webhook router ต่อช่องทาง
- Retry + Backoff + Dead-letter queue
- Audit log ต่อ event

### Rate Limit & Queue
- Per-channel queue
- Throttle / burst control
- Fallback model เมื่อส่งไม่ทัน

### Policy Guardrails ต่อช่องทาง
- กฎการส่งข้อความตามแพลตฟอร์ม (reply window / opt-in / broadcast restrictions)
- Block/ban prevention: ตรวจ policy ก่อนส่ง

### Integration Risk & Fallback Mode
- ถ้าเชื่อม TikTok/Shopee ไม่ได้ (สิทธิ์/พาร์ตเนอร์):
  - ใช้ระบบหลักได้ครบ (Inbox/Entity/Files/AI)
  - รองรับ Import CSV / manual order
  - Progressive rollout (เริ่มจาก data ก่อนแล้วค่อย messaging)

---

### Channel Connection UX
- Wizard เชื่อมต่อทีละ step
- ตรวจสิทธิ์/สถานะบัญชีก่อนเชื่อม
- Health status ต่อ connector (Connected / Degraded / Down)

---

## 8.3 Commission & Incentive Engine
- ตั้งสูตรคอมมิชชั่นต่อดีล/เดือน
- Split commission ตาม role (Closer / Support)
- Target & bonus dashboard

---

## 8.4 Playbook & Coaching System
- เก็บแชทที่ปิดได้เป็น Playbook
- AI สรุป flow / คำพูดที่เวิร์ค
- แนะนำ playbook ให้ agent ตามบริบท

---

## 8.5 Compliance & Audit Trail
- Log ทุกการกระทำในแชทและ entity
- Policy violation report
- Export audit trail (Enterprise-ready)

---

## 8.1 AI Settings & API Configuration (Admin Feature)
- ตั้งค่า AI ต่อ Business
- เลือก Provider / Custom endpoint
- ใส่ API Key (encrypt + masked)
- Test connection
- เลือก Model ต่อ Task (dropdown)
- ตั้ง Budget / Rate limit
- ตั้ง Tone / Policy / ภาษา
- เปิด/ปิด Knowledge Base (RAG)
- ดู AI Logs / Usage / Feedback

---

## 8.2 AI Training Center (Admin & Owner)
- Knowledge Base Manager (Upload / Edit / Test)
- Conversation Learning Review (เลือกใช้/ไม่ใช้เป็น training)
- Feedback Review Dashboard
- Memory Manager (Key-value + version history)

---

## 9) Roadmap
### Phase 1: MVP (0–2 เดือน)
- Omni-channel Inbox + Monitoring
- Entity + Workflow
- File + Approval
- AI: Draft reply + Summary

### Phase 2: Business Intelligence (2–4 เดือน)
- AI Memory per Business
- Outcome-based Analytics
- Automation เต็มรูปแบบ

### Phase 3: Platform & Moat (4–6 เดือน)
- Integration & Public API
- Marketplace / Module system
- Predictive & Risk AI

---

## 10) Monetization Model
- Free: 1 business / limited channels / basic AI
- Pro: automation + AI assist
- Business: multi-team + analytics + integration
- Add-ons: AI usage / Channel / Storage

---

## 11) Success Metrics
- % แชทถูกแปลงเป็น Entity
- Time to resolution ลดลง
- AI assist usage
- Retention per business

---

## 12) Power Features (Differentiators)
### Conversation Replay
- Replay แชทที่ปิดได้เป็นกรณีศึกษา
- ใช้ train ทีม + AI

### Risk Alert
- AI ตรวจจับอารมณ์/คำเสี่ยง
- แจ้งเตือนก่อนลูกค้าหลุด

### Conversation → Document
- แชท → ใบเสนอราคา / สรุปงาน / PDF
- ใช้เป็นหลักฐานและส่งต่อทีม

---

## 13) Next Actions
- สรุป MVP v1 Scope
- ออกแบบ ERD + RLS
- วาด UX หน้าจอหลัก

