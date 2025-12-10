import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

type Ticket = {
  id: string;
  createdAt: string;
  completedAt?: string;
  title: string;
  notes?: string;
  category?: "issue" | "question" | "feature" | "other";
  url?: string;
  path?: string;
  pageTitle?: string;
  userAgent?: string;
  selection?: string;
  extra?: Record<string, unknown>;
  status: "open" | "completed";
  agentNotes?: string;
  votes?: number;
  submitter?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
  };
  upvoters?: Array<{
    id?: string | null;
    name?: string | null;
    email?: string | null;
  }>;
  client?: {
    userAgent?: string | null;
    platform?: string | null;
    language?: string | null;
    deviceType?: "mobile" | "desktop" | "tablet" | "unknown";
  };
};

const DATA_DIR = path.join(process.cwd(), "data");
const TICKETS_PATH = path.join(DATA_DIR, "tickets.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(TICKETS_PATH);
  } catch {
    await fs.writeFile(TICKETS_PATH, "[]", "utf8");
  }
}

async function readTickets(): Promise<Ticket[]> {
  await ensureStore();
  const raw = await fs.readFile(TICKETS_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t) => ({
      ...t,
      votes: typeof t.votes === "number" ? t.votes : 0,
      upvoters: Array.isArray(t.upvoters) ? t.upvoters : [],
      category: (t as any).category ?? "issue",
      client: t.client ?? {
        userAgent: t.userAgent ?? null,
        platform: null,
        language: null,
        deviceType: "unknown",
      },
    })) as Ticket[];
  } catch {
    return [];
  }
}

async function writeTickets(tickets: Ticket[]) {
  await fs.writeFile(TICKETS_PATH, JSON.stringify(tickets, null, 2), "utf8");
}

export async function GET() {
  try {
    const tickets = await readTickets();
    const sorted = [...tickets].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json({ tickets: sorted });
  } catch (err) {
    console.error("[tickets][GET]", err);
    return new NextResponse("Failed to load tickets", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      notes,
      url,
      path: pathname,
      pageTitle,
      userAgent: userAgentInput,
      selection,
      extra,
      submitter,
      client,
      category,
    } = body ?? {};

    const resolvedUserAgent = userAgentInput ?? req.headers.get("user-agent") ?? undefined;

    const deriveDeviceType = (ua?: string | null) => {
      if (!ua) return "unknown" as const;
      const lower = ua.toLowerCase();
      if (/(ipad|tablet)/.test(lower)) return "tablet" as const;
      if (/(mobi|android|iphone)/.test(lower)) return "mobile" as const;
      return "desktop" as const;
    };

    const ticket: Ticket = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "open",
      votes: 0,
      submitter: submitter ?? undefined,
      upvoters: [],
      title: (title ?? "").trim() || "Untitled ticket",
      notes: (notes ?? "").trim() || undefined,
      url: url ?? req.headers.get("referer") ?? undefined,
      path: pathname ?? undefined,
      pageTitle: pageTitle ?? undefined,
      userAgent: resolvedUserAgent,
      selection: selection ?? undefined,
      extra: extra ?? undefined,
      category: category ?? "issue",
      client: client ?? {
        userAgent: resolvedUserAgent,
        platform: null,
        language: null,
        deviceType: deriveDeviceType(resolvedUserAgent),
      },
    };

    const tickets = await readTickets();
    tickets.push(ticket);
    await writeTickets(tickets);

    return NextResponse.json({ ok: true, ticket });
  } catch (err) {
    console.error("[tickets][POST]", err);
    return new NextResponse("Failed to save ticket", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, agentNotes, action, actor } = body ?? {};

    if (!id) {
      return new NextResponse("Missing ticket id", { status: 400 });
    }

    const tickets = await readTickets();
    const idx = tickets.findIndex((t) => t.id === id);
    if (idx === -1) {
      return new NextResponse("Ticket not found", { status: 404 });
    }

    const ticket = tickets[idx];
    const now = new Date().toISOString();

    if (action === "upvote") {
      const actorKey = actor?.id || actor?.email || undefined;
      const alreadyUpvoted = actorKey
        ? ticket.upvoters?.some((u) => (u.id && u.id === actorKey) || (u.email && u.email === actorKey))
        : false;
      if (!alreadyUpvoted) {
        ticket.votes = (ticket.votes ?? 0) + 1;
        if (!ticket.upvoters) ticket.upvoters = [];
        ticket.upvoters.push({
          id: actor?.id ?? null,
          name: actor?.name ?? null,
          email: actor?.email ?? null,
        });
      }
    } else {
      if (status === "completed") {
        ticket.status = "completed";
        ticket.completedAt = now;
      } else if (status === "open") {
        ticket.status = "open";
        ticket.completedAt = undefined;
      }

      if (typeof agentNotes === "string") {
        ticket.agentNotes = agentNotes.trim() || undefined;
      }
    }

    tickets[idx] = ticket;
    await writeTickets(tickets);

    return NextResponse.json({ ok: true, ticket });
  } catch (err) {
    console.error("[tickets][PATCH]", err);
    return new NextResponse("Failed to update ticket", { status: 500 });
  }
}
