import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const embed = await prisma.savedEmbed.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      mode: true,
      payload: true,
      userId: true,
      createdAt: true,
    },
  });

  if (!embed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(embed);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const embed = await prisma.savedEmbed.findUnique({ where: { id } });

  if (!embed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (embed.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.savedEmbed.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const embed = await prisma.savedEmbed.findUnique({ where: { id } });
  if (!embed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (embed.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { title?: string };
  const updated = await prisma.savedEmbed.update({
    where: { id },
    data: { title: body.title ?? embed.title },
    select: { id: true, title: true },
  });

  return NextResponse.json(updated);
}
