import { NextRequest, NextResponse } from "next/server";
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

  const users = await prisma.unlimitedUser.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { discordId } = (await req.json()) as { discordId: string };
  if (!discordId || !/^\d{17,20}$/.test(discordId)) {
    return NextResponse.json({ error: "Invalid Discord ID" }, { status: 400 });
  }

  const existing = await prisma.unlimitedUser.findUnique({ where: { discordId } });
  if (existing) {
    await prisma.unlimitedUser.delete({ where: { discordId } });
    return NextResponse.json({ action: "removed", discordId });
  }

  await prisma.unlimitedUser.create({
    data: { discordId, addedBy: adminId },
  });
  return NextResponse.json({ action: "added", discordId });
}
