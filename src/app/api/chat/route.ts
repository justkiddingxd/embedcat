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

  const result = streamText({
    model: anthropic(MODEL_ID),
    system: systemWithContext,
    messages,
    onFinish: async ({ text }) => {
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSessionId!,
          role: "assistant",
          content: text,
        },
      });
    },
  });

  const response = result.toTextStreamResponse();
  response.headers.set("X-Chat-Session-Id", chatSessionId);
  response.headers.set("Access-Control-Expose-Headers", "X-Chat-Session-Id");
  return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI request failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}
