import type { NoteStatus, NoteType, SectionKind } from "@/generated/prisma/client";

export type NoteSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  type: NoteType;
  status: NoteStatus;
  favorite: boolean;
  updatedAt: Date;
  useCount: number;
  domain: { name: string; slug: string } | null;
  collection: { name: string; slug: string } | null;
  tags: string[];
};

export type SectionTabData = { label: string; lang: string; code: string };

export type SectionData = {
  id: string;
  order: number;
  heading: string;
  kind: SectionKind;
  body: string | null;
  items: string[];
  warning: string | null;
  codeTitle: string | null;
  codeLang: string | null;
  code: string | null;
  highlightLines: number[];
  tabs: SectionTabData[];
};

export type LinkedNote = { slug: string; title: string; summary: string | null; type: NoteType };

export type AttachmentData = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
};

export type NoteDetail = NoteSummary & {
  sections: SectionData[];
  linksOut: { relation: string; note: LinkedNote }[];
  linksIn: { relation: string; note: LinkedNote }[];
  history: { id: string; summary: string; createdAt: Date }[];
  attachments: AttachmentData[];
};

export type SearchHitView = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  type: NoteType;
  updatedAt: Date;
  domainName: string | null;
  collectionName: string | null;
  snippet: string | null;
};

export type GraphNode = { id: string; slug: string; title: string; domain: string | null; summary: string | null };
export type GraphEdge = { source: string; target: string; relation: string };
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };
