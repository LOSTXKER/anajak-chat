# 🚀 Setup Guide - Anajak Chat Platform

## Quick Start (5 นาที)

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com) และสร้าง account (ฟรี)
2. สร้าง New Project:
   - ชื่อโปรเจค: `anajak-chat`
   - Database Password: เลือกรหัสผ่านที่แข็งแรง (เก็บไว้)
   - Region: Southeast Asia (Singapore) - ใกล้ไทยที่สุด
3. รอ 1-2 นาที ให้โปรเจคเสร็จ

### 3. Setup Database Schema

1. ใน Supabase Dashboard ไปที่ **SQL Editor**
2. คลิก **New query**
3. Copy ทั้งหมดจากไฟล์ `supabase/schema.sql`
4. Paste ใน SQL Editor แล้วคลิก **Run**
5. ควรเห็นข้อความ "Success" - ตาราง และ RLS policies ถูกสร้างแล้ว

### 4. ดึง API Keys

1. ไปที่ **Project Settings** (ไอคอนเฟือง)
2. ไปที่ **API**
3. Copy ข้อมูลต่อไปนี้:
   - **Project URL** (มีหน้าตา: `https://xxxxx.supabase.co`)
   - **anon public** key (ยาวมาก ~100+ characters)
   - **service_role** key (อยู่ด้านล่าง anon key)

### 5. สร้าง Environment File

สร้างไฟล์ `.env.local` ที่ root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **สำคัญ**: แทนที่ค่าทั้ง 3 ตัวด้วยค่าจริงจาก Supabase

### 6. รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## 📝 การสร้างบัญชีแรก

1. ไปที่ `http://localhost:3000/register`
2. กรอกข้อมูล:
   - **ชื่อธุรกิจ**: ชื่อร้านหรือบริษัทของคุณ
   - **อีเมล**: อีเมลสำหรับเข้าสู่ระบบ
   - **รหัสผ่าน**: อย่างน้อย 6 ตัวอักษร
3. คลิก **ลงทะเบียน**
4. คุณจะถูก redirect ไปที่ Dashboard อัตโนมัติ

---

## 🧪 ทดสอบระบบ

### สร้าง Mock Data (Optional)

คุณสามารถสร้างข้อมูลทดสอบได้ด้วยตนเองผ่าน UI:

#### สร้าง Contact
1. ไปที่ **Contacts** (sidebar)
2. คลิก **เพิ่มผู้ติดต่อ**
3. กรอกข้อมูล: ชื่อ, อีเมล, เบอร์โทร

#### สร้าง Entity (Deal/Work)
1. ไปที่ **Entities**
2. คลิก **สร้างงานใหม่**
3. กรอกข้อมูล: ชื่องาน, ประเภท, มูลค่า

---

## 🔍 ตรวจสอบว่า Setup สำเร็จ

### ✅ Checklist

- [ ] เห็นหน้า Login/Register
- [ ] สร้างบัญชีได้สำเร็จ
- [ ] เข้า Dashboard แล้วเห็น Sidebar
- [ ] ไปที่ Inbox แล้วไม่มี error
- [ ] ไปที่ Entities แล้วไม่มี error
- [ ] ไปที่ Analytics แล้วเห็นกราฟ

### 🐛 ถ้าเจอปัญหา

#### 1. Error: "Invalid API key"
- ✅ ตรวจสอบว่า copy API key ถูกต้อง (ไม่มีช่องว่างหรือตัวอักษรเกิน)
- ✅ ตรวจสอบว่าไฟล์ชื่อ `.env.local` (ไม่ใช่ `.env`)

#### 2. Error: "relation does not exist"
- ✅ ยืนยันว่ารัน SQL schema ใน Supabase SQL Editor แล้ว
- ✅ Refresh Supabase dashboard แล้วดูที่ Table Editor ว่ามีตารางหรือไม่

#### 3. หน้าจอว่างเปล่าหรือ Loading ไม่หยุด
- ✅ เปิด Browser Console (F12) ดู error
- ✅ ตรวจสอบว่า Supabase Project ยัง active อยู่

#### 4. Cannot create business
- ✅ ตรวจสอบ RLS policies - อาจต้องรัน schema.sql อีกครั้ง
- ✅ ลองดูที่ Supabase > Authentication ว่า user ถูกสร้างหรือไม่

---

## 🎨 UI Components

### หน้าหลัก (Pages)
- **/** - Landing page
- **/login** - เข้าสู่ระบบ
- **/register** - ลงทะเบียน
- **/dashboard** - Main dashboard (redirect ไป /inbox)
- **/dashboard/inbox** - Chat interface (3-column layout)
- **/dashboard/entities** - Entity management
- **/dashboard/contacts** - Contact list
- **/dashboard/files** - File management (placeholder)
- **/dashboard/automation** - Automation (placeholder)
- **/dashboard/ai** - AI Center
- **/dashboard/analytics** - Analytics dashboard
- **/dashboard/settings** - Settings

### Components
- `Sidebar` - Navigation sidebar
- `ConversationList` - List of chats
- `ChatThread` - Chat messages
- `ContextPanel` - Contact & entity info
- `CreateEntityModal` - Create entity form
- `EntityDetailModal` - Entity details

---

## 📊 Database Tables

### Core Tables (มี RLS)
1. **businesses** - ข้อมูลธุรกิจ
2. **business_members** - สมาชิกในธุรกิจ
3. **channels** - ช่องทางการสื่อสาร (FB, IG, LINE...)
4. **contacts** - ผู้ติดต่อ/ลูกค้า
5. **conversations** - บทสนทนา
6. **messages** - ข้อความในแชท
7. **entities** - งาน (Deal, Ticket, Work)
8. **files** - ไฟล์ที่อัปโหลด
9. **ai_memories** - ความจำของ AI

### RLS (Row Level Security)
ทุกตารางมี RLS เพื่อแยกข้อมูลแต่ละธุรกิจ:
- User สามารถเห็นและแก้ไขได้เฉพาะข้อมูลของธุรกิจตัวเอง
- Owner/Admin มีสิทธิ์มากกว่า Agent/Viewer

---

## 🔐 Security

### การ Authentication
- ใช้ Supabase Auth (email/password)
- Session จัดการโดย Supabase อัตโนมัติ
- Auto-redirect ถ้าไม่ได้ login

### Multi-tenant Isolation
- ข้อมูลแต่ละธุรกิจแยกกันด้วย RLS
- User ไม่สามารถเข้าถึงข้อมูลธุรกิจอื่นได้

---

## 🚀 Next Steps

### Phase 1 (MVP) - ✅ เสร็จแล้ว
- [x] Multi-tenant infrastructure
- [x] Authentication
- [x] Inbox with real-time
- [x] Entity management
- [x] Analytics dashboard

### Phase 2 (ต่อไป)
- [ ] AI integration (OpenAI/Claude)
- [ ] AI Draft Reply
- [ ] AI Summary
- [ ] Advanced automation

### Phase 3 (อนาคต)
- [ ] Channel integrations (FB, IG, LINE)
- [ ] Public API
- [ ] Webhooks
- [ ] Mobile app

---

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 💡 Tips

1. **Hot Reload**: แก้ไข code แล้วหน้าจะ refresh อัตโนมัติ
2. **Dark Mode**: UI รองรับ dark mode (ตาม OS setting)
3. **Real-time**: ข้อความและ entity จะ update แบบ real-time
4. **TypeScript**: ใช้ type safety ทั่วทั้งโปรเจค

---

**Happy Coding! 🎉**

ถ้ามีปัญหาหรือคำถาม ลองดูที่ README.md หรือตรวจสอบ Supabase Dashboard

