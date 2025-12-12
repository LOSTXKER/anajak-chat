# 🗺️ Anajak Chat - Development Roadmap

## 🎯 Current Status: Phase 1 (MVP) - 90% Complete

---

## 📅 Short-term (1-2 สัปดาห์)

### 🧪 Week 1: Testing & Mock Data

#### Day 1-2: สร้าง Mock Data
- [ ] รัน `supabase/seed_mock_data.sql` (แก้ไข YOUR_USER_ID และ YOUR_BUSINESS_ID)
- [ ] ทดสอบ Inbox ด้วยข้อมูลจริง
- [ ] ทดสอบ Entity Management
- [ ] ทดสอบ Analytics Dashboard

#### Day 3-4: UI/UX Improvements
- [ ] ปรับแต่ง responsive design สำหรับ mobile
- [ ] เพิ่ม loading states ที่ดีกว่า
- [ ] เพิ่ม error boundaries
- [ ] ปรับปรุง empty states

#### Day 5-7: Bug Fixes & Polish
- [ ] แก้ไข bugs ที่เจอจากการทดสอบ
- [ ] ปรับปรุง performance
- [ ] เพิ่ม validation ในฟอร์ม
- [ ] Test บน browser ต่างๆ (Chrome, Safari, Firefox)

---

## 🚀 Mid-term (2-4 สัปดาห์)

### Week 2: File Upload & Team Management

#### File Management
- [ ] Implement file upload (Supabase Storage)
- [ ] Show file list in Entity detail
- [ ] Preview images/PDFs
- [ ] File version history
- [ ] Approval workflow UI

```typescript
// Example: File upload implementation
const uploadFile = async (file: File) => {
  const { data, error } = await supabase.storage
    .from('files')
    .upload(`${businessId}/${Date.now()}_${file.name}`, file)
  
  // Save to database
  await supabase.from('files').insert({
    business_id: businessId,
    name: file.name,
    storage_path: data.path,
    // ...
  })
}
```

#### Team Management
- [ ] Invite team members (send email)
- [ ] Manage roles (Owner, Admin, Agent, Viewer)
- [ ] Team member list with status
- [ ] Remove/deactivate members
- [ ] Activity log per member

### Week 3-4: AI Integration (OpenAI/Claude)

#### Setup AI Provider
- [ ] เลือก AI provider (OpenAI แนะนำ)
- [ ] Setup API keys in environment
- [ ] Create AI service wrapper

```typescript
// src/lib/ai-service.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateReply(
  conversation: string,
  tone: string,
  context: string
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: `You are a helpful assistant. Tone: ${tone}` },
      { role: 'user', content: conversation }
    ]
  })
  return response.choices[0].message.content
}
```

#### AI Features to Implement
- [ ] **AI Draft Reply** - สร้างคำตอบอัตโนมัติ
- [ ] **AI Summary** - สรุปบทสนทนา
- [ ] **AI Intent Detection** - จับ intent ของลูกค้า
- [ ] **AI Risk Detection** - ตรวจจับอารมณ์เชิงลบ
- [ ] **AI Suggest Next Action** - แนะนำ action ถัดไป

#### AI Memory & Training
- [ ] Load AI memories from database
- [ ] Inject memories into AI context
- [ ] Feedback system (👍 👎)
- [ ] Learning from conversations

---

## 🎯 Long-term (1-3 เดือน)

### Month 2: Channel Integrations

#### Priority 1: LINE Official Account
**เหตุผล:** ไทยใช้ LINE เยอะที่สุด

- [ ] ศึกษา LINE Messaging API
- [ ] สร้าง LINE channel connector
- [ ] Webhook endpoint สำหรับรับข้อความ
- [ ] ส่งข้อความกลับผ่าน LINE
- [ ] Sync conversation to database

```typescript
// Example: LINE webhook
export async function POST(req: Request) {
  const events = await req.json()
  
  for (const event of events) {
    if (event.type === 'message') {
      // Save to database
      await supabase.from('messages').insert({
        conversation_id: findOrCreateConversation(event.source),
        content: event.message.text,
        sender_type: 'contact',
        // ...
      })
      
      // Auto-reply if chatbot enabled
      if (businessSettings.autoReply) {
        const reply = await generateAIReply(event.message.text)
        await lineClient.replyMessage(event.replyToken, reply)
      }
    }
  }
}
```

#### Priority 2: Facebook Messenger
- [ ] Setup Facebook App
- [ ] Messenger webhook
- [ ] Send/receive messages
- [ ] Handle attachments

#### Priority 3: Instagram DM
- [ ] Connect Instagram Business Account
- [ ] Instagram webhook
- [ ] Send/receive DMs

#### Optional: Email, Web Chat Widget
- [ ] Email integration (IMAP/SMTP)
- [ ] Embeddable web chat widget

### Month 3: Advanced Features

#### Automation & Workflows
- [ ] Visual flow builder (แบบ Chatcone)
- [ ] Trigger conditions
- [ ] Actions (send message, create entity, assign agent)
- [ ] AI fallback for unknown flows

#### Chatbot System
- [ ] No-code chatbot builder
- [ ] Pre-defined templates
- [ ] Intent matching
- [ ] Escalation to human

#### Advanced Analytics
- [ ] Custom reports
- [ ] Export data (CSV, PDF)
- [ ] Scheduled reports
- [ ] Funnel analysis
- [ ] Cohort analysis

#### Commission Engine
- [ ] Commission formulas
- [ ] Split by role (Lead, Closer, Support)
- [ ] Commission dashboard
- [ ] Payout tracking

---

## 🌐 Deployment & Production

### Prepare for Production

#### Infrastructure
- [ ] Deploy to Vercel/Netlify
- [ ] Setup custom domain
- [ ] SSL certificate (auto with Vercel)
- [ ] Setup environment variables

#### Performance
- [ ] Enable caching
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lighthouse score > 90

#### Security
- [ ] Review RLS policies
- [ ] Rate limiting (API routes)
- [ ] CORS configuration
- [ ] Input sanitization
- [ ] Security headers

#### Monitoring
- [ ] Setup Sentry (error tracking)
- [ ] Google Analytics / Plausible
- [ ] Supabase monitoring
- [ ] Uptime monitoring

---

## 📚 Technical Debt & Improvements

### Code Quality
- [ ] Add ESLint strict rules
- [ ] Add Prettier
- [ ] Type safety improvements
- [ ] Component documentation (Storybook?)

### Testing
- [ ] Unit tests (Vitest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] API tests

### Refactoring
- [ ] Extract shared components
- [ ] Create custom hooks
- [ ] Optimize re-renders
- [ ] Reduce bundle size

---

## 💰 Monetization Strategy

### Free Tier
- 1 business
- 2 team members
- 100 conversations/month
- Basic analytics
- Email support

### Pro Tier (฿999/month)
- 3 businesses
- 10 team members
- Unlimited conversations
- AI features
- All channels
- Advanced analytics
- Priority support

### Business Tier (฿2,999/month)
- Unlimited businesses
- Unlimited team members
- White-label option
- Custom integrations
- API access
- Dedicated support

### Add-ons
- Extra AI tokens: ฿499/month
- Extra storage: ฿199/month per 10GB
- Custom channel: ฿999/month

---

## 🎓 Learning Resources

### For Development
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/)
- [Facebook Messenger Platform](https://developers.facebook.com/docs/messenger-platform)

### For Design
- [Tailwind UI](https://tailwindui.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)

---

## 🎯 Priority Matrix

### High Priority (Do First)
1. ✅ Fix bugs & test thoroughly
2. ✅ Create mock data
3. 🔄 AI draft reply feature
4. 🔄 LINE integration
5. 🔄 File upload

### Medium Priority (Do Next)
1. Team management
2. Facebook integration
3. Chatbot builder
4. Advanced analytics
5. Commission engine

### Low Priority (Nice to Have)
1. Email integration
2. TikTok integration
3. Shopee integration
4. Mobile app
5. White-label option

---

## 📝 Quick Start Actions (Today!)

### 1. Add Mock Data (30 นาที)
```bash
# 1. Get your IDs
# In Supabase SQL Editor:
SELECT id FROM auth.users;
SELECT id FROM businesses;

# 2. แก้ไข supabase/seed_mock_data.sql
# Replace YOUR_USER_ID และ YOUR_BUSINESS_ID

# 3. รัน SQL
# Copy & paste ใน SQL Editor
```

### 2. Test All Features (1 ชั่วโมง)
- ลองทุก page
- ทดสอบ CRUD operations
- Check responsive design
- ดู console errors

### 3. Plan Your Next Sprint (30 นาที)
เลือก 3-5 features ที่จะทำในสัปดาห์หน้า:
- [ ] Feature 1: _________________
- [ ] Feature 2: _________________
- [ ] Feature 3: _________________

---

## 🤝 Need Help?

### Resources
- 📖 ดู README.md และ SETUP.md
- 📋 ดู PROJECT_SUMMARY.md
- 🗺️ ดู ROADMAP.md (ไฟล์นี้)

### Communities
- Supabase Discord
- Next.js Discord
- Thai Developer Facebook Groups

---

**Happy Building! 🚀**

Remember: Start small, iterate fast, get feedback early!

