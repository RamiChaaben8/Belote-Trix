import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const games = await prisma.game.findMany({
    where: { players: { some: { userId: uid } } },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { players: { orderBy: { seat: "asc" } } },
  });
  return NextResponse.json({ games, uid });
}
