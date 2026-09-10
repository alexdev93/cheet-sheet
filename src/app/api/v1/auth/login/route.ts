import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { loginInputSchema } from "@/lib/validation";

/** JSON login for API/CLI consumers. The web UI uses the loginAction server action instead. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials payload." }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

  const token = await createSessionToken({ sub: user.id, email: user.email });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}
