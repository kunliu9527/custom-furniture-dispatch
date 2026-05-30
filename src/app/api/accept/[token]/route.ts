import { NextResponse } from "next/server";
import {
  readAcceptPublicPayload,
  submitCustomerAcceptance,
} from "@/lib/server/customer-flow";
import type { CustomerRatings } from "@/lib/types";

function parseRatings(raw: unknown): CustomerRatings | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const pick = (key: keyof CustomerRatings) => {
    const v = Number(o[key]);
    return v >= 1 && v <= 5 ? (v as CustomerRatings[keyof CustomerRatings]) : null;
  };
  const salesManager = pick("salesManager");
  const designer = pick("designer");
  const installTeam = pick("installTeam");
  const product = pick("product");
  if (!salesManager || !designer || !installTeam || !product) return null;
  return { salesManager, designer, installTeam, product };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const payload = await readAcceptPublicPayload(token);
  if (!payload) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(payload);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  try {
    const body = (await request.json()) as {
      ratings?: unknown;
      comment?: string;
      hasInstallIssue?: boolean;
    };
    if (body.hasInstallIssue) {
      return NextResponse.json({ error: "install_issue" }, { status: 400 });
    }
    const ratings = parseRatings(body.ratings);
    if (!ratings) {
      return NextResponse.json({ error: "invalid_ratings" }, { status: 400 });
    }
    const result = await submitCustomerAcceptance({
      token,
      ratings,
      comment: body.comment,
      hasInstallIssue: body.hasInstallIssue,
    });
    if (!result.ok) {
      const status =
        result.error === "not_found"
          ? 404
          : result.error === "already_accepted"
            ? 409
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, orderId: result.orderId });
  } catch (err) {
    console.error("[api/accept] POST failed", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
