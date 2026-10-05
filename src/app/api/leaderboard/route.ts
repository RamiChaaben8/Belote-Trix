import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ gamesWon: "desc" }, { totalScore: "asc" }],
      take: 50,
      select: { id: true, name: true, avatar: true, gamesPlayed: true, gamesWon: true, totalScore: true },
    });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ users: [], error: "Database unavailable" }, { status: 503 });
  }
}
