# 📱 LINE Official Account Integration Guide

## 🎯 Overview

ระบบนี้จะเชื่อมต่อกับ LINE Official Account เพื่อ:
- ✅ รับข้อความจากลูกค้าผ่าน LINE
- ✅ ส่งข้อความตอบกลับผ่าน LINE
- ✅ Auto-reply อัตโนมัติ
- ✅ จัดเก็บประวัติการสนทนา
- ✅ แสดงใน Dashboard แบบ real-time

---

## 🚀 Step 1: สร้าง LINE Official Account

### 1.1 สร้าง LINE Developers Account

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. Login ด้วย LINE Account (หรือสร้างใหม่)
3. ยอมรับ Terms of Service

### 1.2 สร้าง Provider

1. คลิก **"Create a new provider"**
2. ใส่ชื่อ Provider (ชื่อบริษัท/ธุรกิจ)
3. คลิก **Create**

### 1.3 สร้าง Messaging API Channel

1. ในหน้า Provider คลิก **"Create a new channel"**
2. เลือก **"Messaging API"**
3. กรอกข้อมูล:
   - **Channel name**: ชื่อ Bot (แสดงให้ลูกค้าเห็น)
   - **Channel description**: คำอธิบายแชทบอท
   - **Category**: เลือกประเภทธุรกิจ
   - **Subcategory**: เลือกประเภทย่อย
   - **Email**: อีเมลติดต่อ
4. อ่านและยอมรับ Terms
5. คลิก **Create**

---

## 🔑 Step 2: เก็บ API Credentials

### 2.1 Channel ID

1. ไปที่ Channel ที่สร้าง
2. ไปที่ tab **"Basic settings"**
3. หา **"Channel ID"** - คัดลอกเก็บไว้

### 2.2 Channel Secret

1. อยู่ใน tab เดียวกัน (Basic settings)
2. หา **"Channel secret"** - คลิก Issue แล้วคัดลอก

### 2.3 Channel Access Token (Long-lived)

1. ไปที่ tab **"Messaging API"**
2. เลื่อนลงมาหา **"Channel access token (long-lived)"**
3. คลิก **Issue** (ถ้ายังไม่มี)
4. คัดลอก Token (เก็บไว้ดี ๆ แสดงครั้งเดียว!)

### 2.4 เพิ่มใน Environment Variables

สร้างหรือแก้ไขไฟล์ `.env.local`:

```env
# LINE Configuration
LINE_CHANNEL_ID=your_channel_id_here
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_long_lived_access_token_here
```

---

## 🌐 Step 3: Deploy & Setup Webhook

### Option A: Deploy to Vercel (แนะนำ)

#### 3.1 Push to GitHub

```bash
git add .
git commit -m "Add LINE integration"
git push origin main
```

#### 3.2 Deploy to Vercel

1. ไปที่ [vercel.com](https://vercel.com)
2. Import repository
3. เพิ่ม Environment Variables:
   - `LINE_CHANNEL_ID`
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - (และตัวอื่นๆ จาก .env.local)
4. Deploy

#### 3.3 Get Webhook URL

หลัง Deploy เสร็จ Vercel จะให้ URL เช่น:
```
https://your-app.vercel.app
```

Webhook URL จะเป็น:
```
https://your-app.vercel.app/api/webhooks/line
```

### Option B: Use ngrok (สำหรับ Development)

```bash
# Install ngrok
# Download from https://ngrok.com/download

# Run your app
npm run dev

# In another terminal, run ngrok
ngrok http 3000

# จะได้ URL เช่น: https://xxxx-xx-xx-xx-xx.ngrok-free.app
# Webhook URL: https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhooks/line
```

---

## ⚙️ Step 4: ตั้งค่า LINE Channel

### 4.1 Set Webhook URL

1. ไปที่ LINE Developers Console
2. เลือก Channel ของคุณ
3. ไปที่ tab **"Messaging API"**
4. หา **"Webhook settings"**
5. คลิก **Edit** ที่ Webhook URL
6. ใส่ URL: `https://your-domain.com/api/webhooks/line`
7. คลิก **Update**
8. คลิก **Verify** เพื่อทดสอบ (ต้องได้ Success)
9. เปิด **"Use webhook"** (toggle เป็นสีเขียว)

### 4.2 ปิด Auto-reply จาก LINE

1. ในหน้าเดียวกัน เลื่อนลงมาหา **"Auto-reply messages"**
2. คลิก **Edit**
3. **ปิด** Auto-reply (เพราะเราจะใช้ระบบเรา)
4. **ปิด** Greeting messages (หรือตั้งได้ถ้าต้องการ)

### 4.3 Allow bot to join group chats (Optional)

ถ้าต้องการให้ bot เข้ากลุ่มได้:
1. หา **"Allow bot to join group chats"**
2. เปิด toggle

---

## 🔧 Step 5: เชื่อมต่อกับ Database

### 5.1 Update Channel ใน Supabase

เข้า Supabase SQL Editor รัน:

```sql
-- Update LINE channel status
UPDATE channels 
SET 
  status = 'connected',
  config = jsonb_build_object(
    'channel_id', 'YOUR_LINE_CHANNEL_ID',
    'auto_reply_enabled', true,
    'auto_reply_message', 'สวัสดีครับ ขอบคุณที่ติดต่อเรา เราจะรีบตอบกลับโดยเร็วที่สุดครับ 🙏'
  )
WHERE type = 'line';

-- ถ้ายังไม่มี LINE channel ให้สร้างใหม่
INSERT INTO channels (business_id, type, name, status, config)
VALUES (
  'YOUR_BUSINESS_ID',
  'line',
  'LINE Official Account',
  'connected',
  jsonb_build_object(
    'channel_id', 'YOUR_LINE_CHANNEL_ID',
    'auto_reply_enabled', true,
    'auto_reply_message', 'สวัสดีครับ ขอบคุณที่ติดต่อเรา เราจะรีบตอบกลับโดยเร็วที่สุดครับ 🙏'
  )
);
```

---

## 🧪 Step 6: ทดสอบ

### 6.1 ทดสอบรับข้อความ

1. เพิ่ม LINE Official Account เป็นเพื่อน:
   - ไปที่ LINE Developers Console
   - Tab "Messaging API"
   - Scan QR code หรือคลิก Bot basic ID

2. ส่งข้อความไปที่ Bot

3. ตรวจสอบใน Dashboard:
   - ไปที่ `/dashboard/inbox`
   - ควรเห็น conversation ใหม่
   - เห็นข้อความที่ส่งมา

### 6.2 ทดสอบส่งข้อความ

1. ใน Dashboard คลิกที่ conversation
2. Claim conversation
3. พิมพ์ข้อความและส่ง
4. ตรวจสอบใน LINE ว่าได้รับข้อความหรือไม่

### 6.3 ทดสอบ Auto-reply

1. ส่งข้อความใหม่ไปที่ Bot
2. ควรได้รับ auto-reply ทันที (ถ้าเปิดไว้)
3. ข้อความทั้งหมดจะแสดงใน Dashboard

---

## 🐛 Troubleshooting

### ❌ Webhook verification failed

**สาเหตุ:**
- URL ไม่ถูกต้อง
- Server ยังไม่ออนไลน์
- Environment variables ไม่ถูกต้อง

**แก้ไข:**
```bash
# ตรวจสอบ environment variables
echo $LINE_CHANNEL_SECRET

# ทดสอบ endpoint
curl https://your-domain.com/api/webhooks/line

# ดู logs ใน Vercel Dashboard
```

### ❌ ไม่ได้รับข้อความใน Dashboard

**ตรวจสอบ:**
1. Webhook URL ถูกต้องหรือไม่
2. "Use webhook" เปิดอยู่หรือไม่
3. ดู Logs ใน Vercel/Server
4. ตรวจสอบ RLS policies ใน Supabase

### ❌ ส่งข้อความไม่ได้

**ตรวจสอบ:**
1. Channel Access Token ถูกต้องหรือไม่
2. LINE user ID ถูกเก็บใน contact metadata หรือไม่
3. ดู Browser Console และ Network tab

### ❌ Auto-reply ไม่ทำงาน

**ตรวจสอบ:**
1. Channel config มี `auto_reply_enabled: true` หรือไม่
2. ปิด auto-reply ของ LINE แล้วหรือยัง
3. ดู logs ว่ามี error หรือไม่

---

## 📊 Monitoring & Logs

### Vercel Logs

```bash
# ดู logs แบบ real-time
vercel logs --follow

# หรือดูใน Vercel Dashboard
# Project > Logs
```

### Supabase Logs

1. ไปที่ Supabase Dashboard
2. Logs > All logs
3. Filter by "webhooks" หรือ "line"

---

## 🎨 Customize Auto-reply

แก้ไข auto-reply message ใน Supabase:

```sql
UPDATE channels 
SET config = config || jsonb_build_object(
  'auto_reply_enabled', true,
  'auto_reply_message', 'ข้อความ auto-reply ที่คุณต้องการ'
)
WHERE type = 'line';
```

หรือสร้าง UI ใน Settings page:

```typescript
// ใน Settings page
const updateAutoReply = async (message: string) => {
  await supabase
    .from('channels')
    .update({
      config: {
        auto_reply_enabled: true,
        auto_reply_message: message
      }
    })
    .eq('type', 'line')
}
```

---

## 🚀 Next Steps

### เพิ่ม Features:

1. **Rich Messages**
   - Flex Message (การ์ดสวยๆ)
   - Template Messages (Buttons, Confirm, Carousel)
   - Image/Video/Audio messages

2. **Advanced Features**
   - Quick Reply buttons
   - LINE Login integration
   - LIFF (LINE Front-end Framework)
   - Broadcast messages

3. **Analytics**
   - ติดตาม delivery rate
   - Response time
   - Popular questions

---

## 📚 Resources

- [LINE Messaging API Docs](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Bot SDK for Node.js](https://github.com/line/line-bot-sdk-nodejs)
- [LINE Developers Console](https://developers.line.biz/console/)

---

## ✅ Checklist

- [ ] สร้าง LINE Official Account
- [ ] ได้ Channel ID, Secret, Access Token
- [ ] เพิ่ม environment variables
- [ ] Deploy to Vercel (หรือใช้ ngrok)
- [ ] ตั้งค่า Webhook URL ใน LINE
- [ ] ปิด auto-reply ของ LINE
- [ ] Update channel status ใน database
- [ ] ทดสอบรับข้อความ
- [ ] ทดสอบส่งข้อความ
- [ ] ทดสอบ auto-reply

---

**🎉 เรียบร้อย! ตอนนี้คุณมีระบบแชท LINE แบบครบวงจรแล้ว**

มีปัญหาหรือข้อสงสัย ดูที่ Troubleshooting section ด้านบนครับ!

