import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── Base Chat ────────────────────────────────────────────────────────────────

export async function geminiChat(
  userMessage: string,
  systemPrompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(userMessage);
  return result.response.text();
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

// ─── Conversation Summary ─────────────────────────────────────────────────────

export async function summarizeConversation(messages: ConversationMessage[]): Promise<string> {
  const historyText = messages
    .map((m) => `${m.role === "user" ? "ลูกค้า" : "แอดมิน"}: ${m.content}`)
    .join("\n");

  const prompt = `สรุปบทสนทนาต่อไปนี้เป็นภาษาไทย ไม่เกิน 3 ประโยค:\n\n${historyText}`;
  return geminiChat(prompt, "คุณเป็นผู้ช่วยสรุปบทสนทนา");
}

