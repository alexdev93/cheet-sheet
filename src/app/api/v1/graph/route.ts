import { NextRequest, NextResponse } from "next/server";
import { getGraphData, type GraphScope } from "@/server/graph";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const scope = (searchParams.get("scope") as GraphScope | null) ?? "all";
  const focus = searchParams.get("focus") ?? undefined;
  const data = await getGraphData(scope, focus);
  return NextResponse.json(data);
}
