import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── Base Chat ────────────────────────────────────────────────────────────────

export async function geminiChat(
  userMessage: string,
  systemPrompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(userMessage);
      return result.response.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      const isRetryable = msg.includes("503") || msg.includes("429") || msg.includes("high demand");
      if (!isRetryable || attempt === MAX_RETRIES - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  throw new Error("Gemini: max retries exceeded");
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// ─── Smart Reply Suggestion ───────────────────────────────────────────────────

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ContactProfile {
  name?: string | null;
  segment?: string | null;
  totalOrders?: number;
  platform?: string;
}

export interface SuggestReplyResult {
  reply: string;
  confidence: number;
  shouldEscalate: boolean;
  escalateReason: string | null;
  usedSources: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

export async function suggestReply(params: {
  conversationHistory: ConversationMessage[];
  contactProfile: ContactProfile;
  kbContext: string;
  erpContext: string;
  shopName: string;
  persona?: string | null;
}): Promise<SuggestReplyResult> {
  const { conversationHistory, contactProfile, kbContext, erpContext, shopName, persona } = params;

  const systemPrompt = persona ?? `คุณเป็นผู้ช่วยตอบแชทของร้าน ${shopName}`;

  const historyText = conversationHistory
    .map((m) => `${m.role === "user" ? "ลูกค้า" : "แอดมิน"}: ${m.content}`)
    .join("\n");

  const prompt = `
ข้อมูลที่คุณมี:
- Knowledge Base: ${kbContext || "ไม่มี"}
- ข้อมูลสินค้า/ERP: ${erpContext || "ไม่มี"}
- ลูกค้า: ${contactProfile.name ?? "ไม่ทราบชื่อ"} (segment: ${contactProfile.segment ?? "ไม่ระบุ"}, ซื้อแล้ว ${contactProfile.totalOrders ?? 0} ครั้ง)

บทสนทนา:
${historyText}

กฎ:
1. ตอบเป็นภาษาไทย สุภาพ เป็นมิตร
2. ถ้าไม่มีข้อมูล ให้บอกว่าจะส่งต่อให้แอดมิน
3. อย่าให้ข้อมูลที่ไม่แน่ใจ
4. ถ้าลูกค้าต้องการซื้อ ให้แนะนำขั้นตอน
5. ถ้าลูกค้าขอคุยกับคน หรือมีความรู้สึกเชิงลบ หรือถามเรื่องคืนสินค้า ให้ escalate

ตอบเป็น JSON เท่านั้น:
{
  "reply": "ข้อความตอบลูกค้า",
  "confidence": 0.0-1.0,
  "should_escalate": true/false,
  "escalate_reason": "เหตุผล (ถ้า escalate, ไม่งั้นให้เป็น null)",
  "used_sources": ["kb", "erp", "history"],
  "sentiment": "positive|neutral|negative"
}`;

  try {
    const raw = await geminiChat(prompt, systemPrompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as {
      reply: string;
      confidence: number;
      should_escalate: boolean;
      escalate_reason: string | null;
      used_sources: string[];
      sentiment?: "positive" | "neutral" | "negative";
    };
    return {
      reply: parsed.reply,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      shouldEscalate: parsed.should_escalate,
      escalateReason: parsed.escalate_reason,
      usedSources: parsed.used_sources ?? [],
      sentiment: parsed.sentiment,
    };
  } catch {
    return {
      reply: "ขออภัยค่ะ ขอส่งเรื่องให้แอดมินช่วยนะคะ",
      confidence: 0,
      shouldEscalate: true,
      escalateReason: "AI parse error",
      usedSources: [],
    };
  }
}

// ─── AI Copilot Chat ──────────────────────────────────────────────────────────

export async function copilotChat(params: {
  question: string;
  conversationHistory: ConversationMessage[];
  contactProfile: ContactProfile;
  kbContext: string;
  shopName: string;
  chatHistory?: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const { question, conversationHistory, contactProfile, kbContext, shopName, chatHistory } = params;

  const historyText = conversationHistory
    .map((m) => `${m.role === "user" ? "ลูกค้า" : "แอดมิน"}: ${m.content}`)
    .join("\n");

  const prevChat = chatHistory?.length
    ? "\n\nบทสนทนากับ Copilot ก่อนหน้า:\n" +
      chatHistory.map((m) => `${m.role === "user" ? "แอดมิน" : "AI"}: ${m.content}`).join("\n")
    : "";

  const prompt = `ข้อมูลที่คุณมี:
- ร้าน: ${shopName}
- Knowledge Base: ${kbContext || "ไม่มี"}
- ลูกค้า: ${contactProfile.name ?? "ไม่ทราบชื่อ"} (segment: ${contactProfile.segment ?? "ไม่ระบุ"}, ซื้อแล้ว ${contactProfile.totalOrders ?? 0} ครั้ง)

บทสนทนากับลูกค้า:
${historyText}
${prevChat}

คำถามจากแอดมิน: ${question}`;

  const systemPrompt = `คุณเป็น AI Copilot ช่วยเหลือแอดมินของร้าน ${shopName} ในการตอบแชทลูกค้า
กฎ:
1. ตอบเป็นภาษาไทย กระชับ ตรงประเด็น
2. ถ้าแอดมินขอให้ร่างข้อความ ให้ร่างข้อความที่พร้อมส่งให้ลูกค้าได้เลย
3. ถ้าถามเรื่องวิเคราะห์ลูกค้า ให้วิเคราะห์จากข้อมูลที่มี
4. ถ้าไม่มีข้อมูลเพียงพอ ให้บอกตรงๆ`;

  return geminiChat(prompt, systemPrompt);
}

// ─── AI Customer Segmentation ─────────────────────────────────────────────────

export interface SegmentResult {
  segment: string;
  confidence: number;
  reasoning: string;
}

export async function segmentContact(params: {
  contactProfile: ContactProfile;
  conversationSummaries: string[];
  orderCount: number;
  totalRevenue: number;
}): Promise<SegmentResult> {
  const { contactProfile, conversationSummaries, orderCount, totalRevenue } = params;

  const prompt = `จากประวัติของลูกค้ารายนี้ จัดกลุ่มเป็นหนึ่งใน:
- VIP (ซื้อบ่อย, ยอดสูง)
- Regular (ซื้อเป็นประจำ)
- Window Shopper (ดูเยอะ, ไม่ค่อยซื้อ)
- One-timer (ซื้อครั้งเดียว)
- At-risk (เคยซื้อแต่หายไป)
- New (ลูกค้าใหม่ยังไม่ซื้อ)

ข้อมูลลูกค้า:
- ชื่อ: ${contactProfile.name ?? "ไม่ทราบ"}
- Platform: ${contactProfile.platform ?? "ไม่ระบุ"}
- จำนวนการสั่งซื้อ: ${orderCount} ครั้ง
- ยอดซื้อรวม: ${totalRevenue} บาท
- Segment ปัจจุบัน: ${contactProfile.segment ?? "ไม่ระบุ"}

สรุปบทสนทนาที่ผ่านมา:
${conversationSummaries.length > 0 ? conversationSummaries.join("\n---\n") : "ไม่มีข้อมูล"}

ตอบเป็น JSON เท่านั้น:
{
  "segment": "VIP|Regular|Window Shopper|One-timer|At-risk|New",
  "confidence": 0.0-1.0,
  "reasoning": "เหตุผลสั้นๆ"
}`;

  try {
    const raw = await geminiChat(prompt, "คุณเป็นนักวิเคราะห์ลูกค้า");
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as SegmentResult;
    return {
      segment: parsed.segment,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      reasoning: parsed.reasoning,
    };
  } catch {
    return { segment: "New", confidence: 0, reasoning: "ไม่สามารถวิเคราะห์ได้" };
  }
}

// ─── Churn / Drop-off Analysis ────────────────────────────────────────────────

export interface ChurnAnalysisResult {
  reason: string;
  confidence: number;
  suggestion: string;
}

export async function analyzeChurn(
  messages: ConversationMessage[],
  contactProfile: ContactProfile
): Promise<ChurnAnalysisResult> {
  const historyText = messages
    .map((m) => `${m.role === "user" ? "ลูกค้า" : "แอดมิน"}: ${m.content}`)
    .join("\n");

  const prompt = `วิเคราะห์บทสนทนาต่อไปนี้และระบุสาเหตุที่ลูกค้าอาจหยุดตอบ
โดยเลือกจาก: ราคาสูง, ตอบช้า, สินค้าไม่ตรงความต้องการ, เปรียบเทียบกับร้านอื่น, ปัญหาการจัดส่ง, ลูกค้ายังไม่พร้อมซื้อ, ได้ข้อมูลครบแล้ว, อื่นๆ

ข้อมูลลูกค้า: ${contactProfile.name ?? "ไม่ทราบชื่อ"} (segment: ${contactProfile.segment ?? "ไม่ระบุ"}, สั่งซื้อ ${contactProfile.totalOrders ?? 0} ครั้ง)

บทสนทนา:
${historyText}

ตอบเป็น JSON เท่านั้น:
{
  "reason": "สาเหตุหลัก",
  "confidence": 0.0-1.0,
  "suggestion": "คำแนะนำสำหรับแอดมินว่าควรทำอะไรต่อ"
}`;

  try {
    const raw = await geminiChat(prompt, "คุณเป็นนักวิเคราะห์พฤติกรรมลูกค้า");
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as ChurnAnalysisResult;
    return {
      reason: parsed.reason,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      suggestion: parsed.suggestion,
    };
  } catch {
    return { reason: "ไม่สามารถวิเคราะห์ได้", confidence: 0, suggestion: "ลองตรวจสอบบทสนทนาด้วยตนเอง" };
  }
}

// ─── Conversation Summary ─────────────────────────────────────────────────────

export interface ConversationAnalysis {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  intent: string;
}

export async function summarizeConversation(
  messages: ConversationMessage[]
): Promise<ConversationAnalysis> {
  const historyText = messages
    .map((m) => `${m.role === "user" ? "ลูกค้า" : "แอดมิน"}: ${m.content}`)
    .join("\n");

  const prompt = `วิเคราะห์บทสนทนาต่อไปนี้:

${historyText}

ตอบเป็น JSON เท่านั้น:
{
  "summary": "สรุปบทสนทนาเป็นภาษาไทย ไม่เกิน 3 ประโยค",
  "sentiment": "positive|neutral|negative",
  "intent": "purchase|inquiry|complaint|support|other"
}`;

  try {
    const raw = await geminiChat(prompt, "คุณเป็นผู้ช่วยวิเคราะห์บทสนทนา");
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as ConversationAnalysis;
    return {
      summary: parsed.summary,
      sentiment: (["positive", "neutral", "negative"] as const).includes(parsed.sentiment)
        ? parsed.sentiment
        : "neutral",
      intent: parsed.intent || "other",
    };
  } catch {
    const fallbackPrompt = `สรุปบทสนทนาต่อไปนี้เป็นภาษาไทย ไม่เกิน 3 ประโยค:\n\n${historyText}`;
    const summary = await geminiChat(fallbackPrompt, "คุณเป็นผู้ช่วยสรุปบทสนทนา");
    return { summary, sentiment: "neutral", intent: "other" };
  }
}

