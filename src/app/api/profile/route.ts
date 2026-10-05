import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function uid() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET() {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, avatar: true, soundOn: true, gamesPlayed: true, gamesWon: true, totalScore: true, createdAt: true },
  });
  const modes = await prisma.gameModeHistory.groupBy({ by: ["mode"], _count: { mode: true }, where: { game: { players: { some: { userId: id } } } } });
  return NextResponse.json({ user, modes });
}

const patch = z.object({
  name: z.string().trim().min(2).max(24).optional(),
  avatar: z.string().trim().min(1).max(4).optional(),
  soundOn: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const user = await prisma.user.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ user: { id: user.id, name: user.name, avatar: user.avatar, soundOn: user.soundOn } });
}
