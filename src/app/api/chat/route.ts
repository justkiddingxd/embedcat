import { streamText, type TextStreamPart } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import {
  ai,
  MODEL_ID,
  SYSTEM_PROMPT,
  applyMessageTool,
  DAILY_LIMIT,
  MAX_MESSAGE_LENGTH,
  MAX_CONTEXT_MESSAGES,
  isUnlimitedUser,
} from "@/lib/ai";

const SUMMARIZE_THRESHOLD = 14; // when history hits this, summarize older messages
const KEEP_RECENT = 6; // keep last N messages as-is

export const maxDuration = 60;

const EMBED_DELIMITER = "\n\n---EMBED_DATA---\n";

const tools = { apply_message: applyMessageTool };
type StreamPart = TextStreamPart<typeof tools>;

const EMBED_BLOCK_RE = /```(?:embed-json|json)?\n?([\s\S]*?)```/g;

// Earlier assistant replies are stored with their messages as embed-json blocks (so the
// chat can show Apply buttons again). The model doesn't need them: the current editor
// state is sent separately, and replaying JSON would nudge it to write JSON as text.
function stripEmbedBlocks(text: string): string {
  return text
    .replace(EMBED_BLOCK_RE, (match, inner: string) =>
      inner.trim().startsWith("{") ? "[called apply_message]" : match
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Turns an apply_message call into the payload format the chat UI applies to the editor.
function toEmbedBlock(input: unknown): { block: string; summary: string } | null {
  if (!input || typeof input !== "object") return null;
  const { summary, mode, content, embeds, components, username, avatar_url } = input as Record<string, unknown>;
  const payload: Record<string, unknown> = { mode: mode === "components_v2" ? "components_v2" : "classic" };
  if (payload.mode === "classic") {
    if (typeof content === "string") payload.content = content;
    payload.embeds = Array.isArray(embeds) ? embeds : [];
  } else {
    payload.components = Array.isArray(components) ? components : [];
  }
  if (typeof username === "string" && username) payload.username = username;
  if (typeof avatar_url === "string" && avatar_url) payload.avatar_url = avatar_url;
  return { block: JSON.stringify(payload), summary: typeof summary === "string" ? summary : "" };
}

export async function POST(req: Request) {
  try {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { message, sessionId, embedContext } = body as {
    message: string;
    sessionId?: string;
    embedContext?: string;
  };

  if (!message || typeof message !== "string") {
    return Response.json({ error: "Message required" }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` },
      { status: 400 }
    );
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.chatMessage.count({
    where: {
      session: { userId },
      role: "user",
      createdAt: { gte: todayStart },
    },
  });

  if (todayCount >= DAILY_LIMIT && !(await isUnlimitedUser(userId))) {
    return Response.json(
      { error: "Daily limit reached (5/day)" },
      { status: 429 }
    );
  }

  let chatSessionId = sessionId;
  if (!chatSessionId) {
    chatSessionId = nanoid(7);
    await prisma.chatSession.create({
      data: {
        id: chatSessionId,
        userId,
        title: message.slice(0, 50),
      },
    });
  } else {
    const existing = await prisma.chatSession.findFirst({
      where: { id: chatSessionId, userId },
    });
    if (!existing) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
  }

  await prisma.chatMessage.create({
    data: {
      sessionId: chatSessionId,
      role: "user",
      content: message,
    },
  });

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: chatSessionId },
    orderBy: { createdAt: "asc" },
    take: MAX_CONTEXT_MESSAGES,
    select: { id: true, role: true, content: true },
  });

  const now = new Date();
  const systemWithContext = [
    SYSTEM_PROMPT,
    `# Current time\n${now.toISOString()} (UNIX ${Math.floor(now.getTime() / 1000)})`,
    embedContext ? `# Current editor state\n\`\`\`json\n${embedContext}\n\`\`\`` : "",
  ].filter(Boolean).join("\n\n");

  // Preventive summarization: compress old messages into a summary
  let messages: { role: "user" | "assistant" | "system"; content: string }[];
  if (history.length >= SUMMARIZE_THRESHOLD) {
    const oldMessages = history.slice(0, -KEEP_RECENT);
    const recentMessages = history.slice(-KEEP_RECENT);

    // Check if first message is already a summary
    const alreadySummarized = oldMessages[0]?.content?.startsWith("[Summary of previous conversation:");
    
    let summary: string;
    if (alreadySummarized && oldMessages.length <= 3) {
      // Already compact enough
      summary = oldMessages[0].content;
    } else {
      try {
        const convo = oldMessages.map(m => `${m.role}: ${stripEmbedBlocks(m.content)}`).join("\n");
        // The API always answers as an SSE stream, so even one-shot calls use streamText.
        const text = await streamText({
          model: ai(MODEL_ID),
          system: "Summarize this conversation in 2-3 sentences. Preserve key details: URLs, emoji IDs, style preferences, specific requests. Be concise. Start with: [Summary of previous conversation:",
          messages: [{ role: "user", content: convo }],
        }).text;
        summary = text;
        console.log(`[chat] Summarized ${oldMessages.length} messages into ${summary.length} chars`);
      } catch (err) {
        console.error("[chat] Summarization failed, using truncation:", err);
        summary = `[Summary of previous conversation: ${oldMessages.length} messages about Discord embed creation]`;
      }

      // Replace old messages in DB with summary
      const oldIds = oldMessages.map(m => m.id);
      await prisma.chatMessage.deleteMany({
        where: { id: { in: oldIds } },
      });
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSessionId!,
          role: "assistant",
          content: summary,
          createdAt: new Date(0), // oldest possible so it sorts first
        },
      });
    }

    messages = [
      { role: "assistant", content: summary },
      ...recentMessages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.role === "assistant" ? stripEmbedBlocks(m.content) : m.content,
      })),
    ];
  } else {
    messages = history.map((m: { id: string; role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.role === "assistant" ? stripEmbedBlocks(m.content) : m.content,
    }));
  }

  const MAX_RETRIES = 2;

  // Wrap stream creation with retry — if the stream fails before producing any
  // output (e.g. the API returns 400), we retry up to MAX_RETRIES times.
  // On 400 errors, trim history in half and retry (likely context too long).
  async function createStream(): Promise<AsyncIterable<StreamPart>> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const r = streamText({
        model: ai(MODEL_ID),
        system: systemWithContext,
        messages,
        tools,
      });
      const reader = r.fullStream[Symbol.asyncIterator]();
      const head: StreamPart[] = [];
      let failure: unknown = null;
      try {
        // Read up to the first real output to verify the stream actually works
        while (true) {
          const next = await reader.next();
          if (next.done) break;
          if (next.value.type === "error") {
            failure = next.value.error;
            break;
          }
          head.push(next.value);
          if (["text-delta", "tool-input-start", "tool-call", "finish"].includes(next.value.type)) break;
        }
      } catch (err) {
        failure = err;
      }
      if (!failure) {
        // Re-wrap into an async iterable that yields the buffered parts + rest
        return (async function* replayStream() {
          yield* head;
          while (true) {
            const next = await reader.next();
            if (next.done) return;
            yield next.value;
          }
        })();
      }
      const statusCode = (failure as { statusCode?: number }).statusCode;
      console.error(`[chat] Stream attempt ${attempt + 1} failed (status: ${statusCode}, messages: ${messages.length}):`, failure);
      if (attempt < MAX_RETRIES) {
        if (statusCode === 400 && messages.length > 2) {
          const keep = Math.max(2, Math.floor(messages.length / 2));
          messages = messages.slice(-keep);
          console.log(`[chat] Trimmed history to ${messages.length} messages for retry`);
        }
        await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
      } else {
        throw failure;
      }
    }
    throw new Error("All stream attempts exhausted");
  }

  let stream;
  try {
    stream = await createStream();
  } catch (err) {
    console.error("[chat] All stream attempts failed:", err);
    return Response.json(
      { error: "AI is temporarily unavailable, please try again" },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  let visibleText = "";
  let buffer = "";
  let insideCodeBlock = false;
  let codeBlockContent = "";
  const embedBlocks: string[] = [];

  const outputStream = new ReadableStream({
    async start(controller) {
      try {
        const emit = (text: string) => {
          visibleText += text;
          controller.enqueue(encoder.encode(text));
        };

        for await (const part of stream) {
          if (part.type === "error") throw part.error;
          if (part.type === "tool-call") {
            const applied = part.toolName === "apply_message" && !part.invalid ? toEmbedBlock(part.input) : null;
            if (applied) {
              embedBlocks.push(applied.block);
              // The model is asked to write a sentence before the call; fall back to its summary.
              if (!visibleText.trim() && !buffer.trim() && applied.summary) emit(applied.summary);
            }
            continue;
          }
          if (part.type !== "text-delta") continue;
          const chunk = part.text;
          buffer += chunk;

          while (buffer.length > 0) {
            if (insideCodeBlock) {
              const closeIdx = buffer.indexOf("```");
              if (closeIdx === -1) {
                codeBlockContent += buffer;
                buffer = "";
              } else {
                codeBlockContent += buffer.slice(0, closeIdx);
                buffer = buffer.slice(closeIdx + 3);
                insideCodeBlock = false;

                const trimmed = codeBlockContent.trim();
                const bodyStart = trimmed.indexOf("\n");
                const body = bodyStart !== -1 ? trimmed.slice(bodyStart + 1).trim() : trimmed;

                let isEmbed = false;
                if (body.startsWith("{")) {
                  try {
                    const parsed = JSON.parse(body);
                    if (parsed.embeds || parsed.components || parsed.content !== undefined) {
                      embedBlocks.push(body);
                      isEmbed = true;
                    }
                  } catch {
                    void 0;
                  }
                }

                if (!isEmbed) {
                  emit("```" + codeBlockContent + "```");
                }
                codeBlockContent = "";
              }
            } else {
              const openIdx = buffer.indexOf("```");
              if (openIdx === -1) {
                const safe = buffer.length > 3 ? buffer.slice(0, -3) : "";
                if (safe) {
                  emit(safe);
                  buffer = buffer.slice(safe.length);
                }
                break;
              } else {
                if (openIdx > 0) {
                  emit(buffer.slice(0, openIdx));
                }
                buffer = buffer.slice(openIdx + 3);
                insideCodeBlock = true;
                codeBlockContent = "";
              }
            }
          }
        }

        if (buffer.length > 0 && !insideCodeBlock) {
          emit(buffer);
        }

        if (embedBlocks.length > 0) {
          controller.enqueue(encoder.encode(EMBED_DELIMITER + JSON.stringify(embedBlocks)));
        }

        controller.close();

        await Promise.all([
          prisma.chatMessage.create({
            data: {
              sessionId: chatSessionId!,
              role: "assistant",
              content: [visibleText.trim(), ...embedBlocks.map((b) => "```embed-json\n" + b + "\n```")]
                .filter(Boolean)
                .join("\n\n"),
            },
          }),
          prisma.appUser.update({
            where: { discordId: userId },
            data: {
              aiRequests: { increment: 1 },
              lastActive: new Date(),
            },
          }).catch(() => void 0),
        ]);
      } catch (err) {
        console.error("[chat] Stream processing error:", {
          error: err instanceof Error ? err.message : err,
          statusCode: (err as { statusCode?: number }).statusCode,
          responseBody: (err as { responseBody?: string }).responseBody,
          sessionId: chatSessionId,
          messageCount: messages.length,
        });
        // If we already sent some text, close gracefully
        if (visibleText.length > 0 || embedBlocks.length > 0) {
          controller.close();
        } else {
          controller.error(err);
        }
      }
    },
  });

  const response = new Response(outputStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Chat-Session-Id": chatSessionId,
      "Access-Control-Expose-Headers": "X-Chat-Session-Id",
    },
  });
  return response;
  } catch (err) {
    console.error("[chat] Unhandled error:", err);
    const msg = err instanceof Error ? err.message : "AI request failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}
