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

  const user = await prisma.appUser.findUnique({ where: { discordId: id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [chatSessions, savedEmbeds, isUnlimited] = await Promise.all([
    prisma.chatSession.count({ where: { userId: id } }),
    prisma.savedEmbed.count({ where: { userId: id } }),
    prisma.unlimitedUser.findUnique({ where: { discordId: id } }).then((r) => r !== null),
  ]);

  return NextResponse.json({
    discordId: user.discordId,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    firstLogin: user.firstLogin,
    lastLogin: user.lastLogin,
    lastActive: user.lastActive,
    aiRequests: user.aiRequests,
    embedsCreated: user.embedsCreated,
    webhooksSent: user.webhooksSent,
    chatSessions,
    savedEmbeds,
    isUnlimited,
  });
}
