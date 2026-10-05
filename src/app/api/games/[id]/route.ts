import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      players: { orderBy: { seat: "asc" } },
      rounds: { orderBy: { number: "asc" }, include: { playedCards: { orderBy: { seq: "asc" } }, tricks: { orderBy: { number: "asc" } } } },
      scores: { orderBy: [{ round: "asc" }, { seat: "asc" }] },
      chat: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ game });
}
