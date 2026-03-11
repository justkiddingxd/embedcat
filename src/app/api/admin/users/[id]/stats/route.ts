import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ADMIN_USER_ID } from "@/lib/ai";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const callerId = (session?.user as { id?: string } | undefined)?.id;
  if (callerId !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id || !/^\d{17,20}$/.test(id)) {
    return NextResponse.json({ error: "Invalid Discord ID" }, { status: 400 });
  }

  const [user, chatSessions, savedEmbeds, isUnlimited] = await Promise.all([
    prisma.appUser.findUnique({ where: { discordId: id } }),
    prisma.chatSession.count({ where: { userId: id } }),
    prisma.savedEmbed.count({ where: { userId: id } }),
    prisma.unlimitedUser.findUnique({ where: { discordId: id } }).then((r) => r !== null),
  ]);

  if (!user && chatSessions === 0 && savedEmbeds === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    discordId: id,
    username: user?.username ?? "Unknown",
    displayName: user?.displayName ?? "Unknown",
    avatar: user?.avatar ?? null,
    firstLogin: user?.firstLogin ?? null,
    lastLogin: user?.lastLogin ?? null,
    lastActive: user?.lastActive ?? null,
    aiRequests: user?.aiRequests ?? 0,
    embedsCreated: user?.embedsCreated ?? 0,
    webhooksSent: user?.webhooksSent ?? 0,
    chatSessions,
    savedEmbeds,
    isUnlimited,
  });
}
