import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const WEBHOOK_REGEX = /^https:\/\/(canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d+\/.+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { webhookUrl, threadId, payload } = body as {
    webhookUrl: string;
    threadId?: string;
    payload: Record<string, unknown>;
  };

  if (!webhookUrl || !WEBHOOK_REGEX.test(webhookUrl)) {
    return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
  }

  const isV2 = payload.flags === 32768;
  const url = new URL(webhookUrl);
  url.searchParams.set("wait", "true");
  if (isV2) {
    url.searchParams.set("with_components", "true");
  }
  if (threadId) {
    url.searchParams.set("thread_id", threadId);
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { message?: string }).message || `HTTP ${res.status}` },
      { status: res.status }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (userId) {
    prisma.appUser.update({
      where: { discordId: userId },
      data: { webhooksSent: { increment: 1 }, lastActive: new Date() },
    }).catch(() => void 0);
  }

  return NextResponse.json({ success: true });
}
