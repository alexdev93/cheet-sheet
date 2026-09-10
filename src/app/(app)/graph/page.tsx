import type { Metadata } from "next";
import { getGraphData } from "@/server/graph";
import { GraphExplorer } from "@/components/graph/GraphExplorer";

export const metadata: Metadata = { title: "Graph" };

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;
  const data = await getGraphData("all");
  return <GraphExplorer initialData={data} initialFocusSlug={focus} />;
}
