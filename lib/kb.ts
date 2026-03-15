import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/gemini";

// pgvector cosine similarity search via raw SQL
export async function searchKb(
  orgId: string,
  query: string,
  topK = 5
): Promise<Array<{ id: string; title: string; content: string; category: string; usageCount: number }>> {
  try {
    const embedding = await generateEmbedding(query);
    const vector = `[${embedding.join(",")}]`;

    const results = await prisma.$queryRaw<
      Array<{ id: string; title: string; content: string; category: string; usage_count: number }>
    >`
      SELECT id::text, title, content, category, usage_count
      FROM knowledge_articles
      WHERE org_id = ${orgId}::uuid
        AND is_active = true
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${topK}
    `;

    return results.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      category: r.category,
      usageCount: r.usage_count,
    }));
  } catch {
    // Fallback: simple text search if pgvector fails
    const results = await prisma.knowledgeArticle.findMany({
      where: {
        orgId,
        isActive: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      take: topK,
      select: { id: true, title: true, content: true, category: true, usageCount: true },
    });
    return results.map((r) => ({ ...r, category: r.category as string }));
  }
}

export async function embedArticle(articleId: string): Promise<void> {
  const article = await prisma.knowledgeArticle.findUnique({ where: { id: articleId } });
  if (!article) return;

  const text = `${article.title}\n\n${article.content}`;
  const embedding = await generateEmbedding(text);
  const vector = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    UPDATE knowledge_articles
    SET embedding = ${vector}::vector
    WHERE id = ${articleId}::uuid
  `;
}

export function formatKbContext(
  articles: Array<{ title: string; content: string }>
): string {
  if (articles.length === 0) return "";
  return articles.map((a, i) => `[${i + 1}] ${a.title}:\n${a.content}`).join("\n\n");
}
