import { NextResponse } from "next/server";
import { listAllTags } from "@/server/notes";

export async function GET() {
  const tags = await listAllTags();
  return NextResponse.json({ tags });
}
