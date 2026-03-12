import { streamText } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import {
  anthropic,
  MODEL_ID,
  SYSTEM_PROMPT,
  DAILY_LIMIT,
  MAX_MESSAGE_LENGTH,
  MAX_CONTEXT_MESSAGES,
  isUnlimitedUser,
} from "@/lib/ai";

export const maxDuration = 60;

const EMBED_DELIMITER = "\n\n---EMBED_DATA---\n";

function extractAndStrip(text: string): { clean: string; blocks: string[] } {
  const blocks: string[] = [];
  const clean = text.replace(/```(?:embed-json|json)?\n?([\s\S]*?)```/g, (_match, inner: string) => {
    const trimmed = inner.trim();
    if (!trimmed.startsWith("{")) return "";
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.embeds || parsed.components || parsed.content !== undefined) {
        blocks.push(trimmed);
        return "";
      }
    } catch {
      void 0;
    }
    return "";
  });
  return { clean: clean.replace(/\n{3,}/g, "\n\n").trim(), blocks };
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
    select: { role: true, content: true },
  });

  const systemWithContext = embedContext
    ? `${SYSTEM_PROMPT}\n\n## Current user embed state:\n\`\`\`json\n${embedContext}\n\`\`\``
    : SYSTEM_PROMPT;

  const messages = history.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const MAX_RETRIES = 2;

  // Wrap stream creation with retry — if the stream fails before producing
  // any text (e.g. gateway returns 400), we retry up to MAX_RETRIES times.
  async function createStream(): Promise<{ textStream: AsyncIterable<string> }> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const r = streamText({
        model: anthropic(MODEL_ID),
        system: systemWithContext,
        messages,
      });
      try {
        // Try to read first chunk to verify the stream actually works
        const reader = r.textStream[Symbol.asyncIterator]();
        const first = await reader.next();
        // Re-wrap into an async iterable that yields the first chunk + rest
        async function* replayStream() {
          if (!first.done) yield first.value;
          while (true) {
            const next = await reader.next();
            if (next.done) break;
            yield next.value;
          }
        }
        return { textStream: replayStream() };
      } catch (err) {
        console.error(`[chat] Stream attempt ${attempt + 1} failed:`, err);
        if (attempt < MAX_RETRIES) {
          await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
        } else {
          throw err;
        }
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
  const textStream = stream.textStream;
  let fullText = "";
  let buffer = "";
  let insideCodeBlock = false;
  let codeBlockContent = "";
  const embedBlocks: string[] = [];

  const outputStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of textStream) {
          fullText += chunk;
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
                  controller.enqueue(encoder.encode("```" + codeBlockContent + "```"));
                }
                codeBlockContent = "";
              }
            } else {
              const openIdx = buffer.indexOf("```");
              if (openIdx === -1) {
                const safe = buffer.length > 3 ? buffer.slice(0, -3) : "";
                if (safe) {
                  controller.enqueue(encoder.encode(safe));
                  buffer = buffer.slice(safe.length);
                }
                break;
              } else {
                if (openIdx > 0) {
                  controller.enqueue(encoder.encode(buffer.slice(0, openIdx)));
                }
                buffer = buffer.slice(openIdx + 3);
                insideCodeBlock = true;
                codeBlockContent = "";
              }
            }
          }
        }

        if (buffer.length > 0 && !insideCodeBlock) {
          controller.enqueue(encoder.encode(buffer));
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
              content: fullText,
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
        if (fullText.length > 0) {
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
