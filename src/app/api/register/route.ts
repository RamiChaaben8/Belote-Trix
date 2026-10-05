import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(24),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid name, email or password (min 6 chars)" }, { status: 400 });
  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 10) },
  });
  return NextResponse.json({ id: user.id });
}
