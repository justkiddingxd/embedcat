import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ADMIN_USER_ID } from "@/lib/ai";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (userId !== ADMIN_USER_ID) return null;
  return userId;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalUsers,
    todayUsers,
    weekUsers,
    totalSessions,
    totalMessages,
    totalSavedEmbeds,
    unlimitedCount,
    recentByLogin,
    chatUserIds,
  ] = await Promise.all([
    prisma.appUser.count(),
    prisma.appUser.count({
      where: { lastLogin: { gte: new Date(Date.now() - 86400000) } },
    }),
    prisma.appUser.count({
      where: { lastLogin: { gte: new Date(Date.now() - 604800000) } },
    }),
    prisma.chatSession.count(),
    prisma.chatMessage.count(),
    prisma.savedEmbed.count(),
    prisma.unlimitedUser.count(),
    prisma.appUser.findMany({
      orderBy: { lastLogin: "desc" },
      take: 50,
    }),
    prisma.chatSession.findMany({
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const recentIds = new Set(recentByLogin.map((u) => u.discordId));
  const missingChatUserIds = chatUserIds
    .map((s) => s.userId)
    .filter((id) => !recentIds.has(id));

  let foundAppUsers: typeof recentByLogin = [];
  if (missingChatUserIds.length > 0) {
    foundAppUsers = await prisma.appUser.findMany({
      where: { discordId: { in: missingChatUserIds } },
      orderBy: { lastLogin: "desc" },
    });
  }

  const foundIds = new Set(foundAppUsers.map((u) => u.discordId));
  const stubUsers = missingChatUserIds
    .filter((id) => !foundIds.has(id))
    .map((id) => ({
      discordId: id,
      username: "Unknown",
      displayName: "",
      avatar: null,
      firstLogin: new Date(),
      lastLogin: new Date(),
      aiRequests: 0,
      embedsCreated: 0,
      webhooksSent: 0,
      lastActive: new Date(),
    }));

  const recentUsers = [...recentByLogin, ...foundAppUsers, ...stubUsers];

  let discordAppStats = null;
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (botToken && clientId) {
      const res = await fetch(
        `https://discord.com/api/v10/applications/${clientId}`,
        {
          headers: { Authorization: `Bot ${botToken}` },
          next: { revalidate: 300 },
        }
      );
      if (res.ok) {
        const app = (await res.json()) as {
          approximate_user_install_count?: number;
          approximate_guild_count?: number;
        };
        discordAppStats = {
          userInstalls: app.approximate_user_install_count ?? null,
          guildCount: app.approximate_guild_count ?? null,
        };
      }
    }
  } catch {
    void 0;
  }

  return NextResponse.json({
    totalUsers,
    todayUsers,
    weekUsers,
    totalSessions,
    totalMessages,
    totalSavedEmbeds,
    unlimitedCount,
    recentUsers,
    discordAppStats,
  });
}
