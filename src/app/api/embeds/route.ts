import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    title?: string;
    mode: string;
    payload: unknown;
    saveToProfile?: boolean;
  };

  if (!body.mode || !body.payload) {
    return NextResponse.json({ error: "Missing mode or payload" }, { status: 400 });
  }

  let userId: string | null = null;
  if (body.saveToProfile) {
    const session = await getServerSession(authOptions);
    userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  }

  const saved = await prisma.savedEmbed.create({
    data: {
      userId,
      title: body.title || "",
      mode: body.mode,
      payload: body.payload as object,
    },
  });

  return NextResponse.json({ id: saved.id });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const embeds = await prisma.savedEmbed.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      mode: true,
      payload: true,
      createdAt: true,
    },
    take: 50,
  });

  return NextResponse.json(embeds);
}
