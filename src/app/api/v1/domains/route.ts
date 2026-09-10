import { NextResponse } from "next/server";
import { getDomainTree } from "@/server/tree";

export async function GET() {
  const domains = await getDomainTree();
  return NextResponse.json({ domains });
}
