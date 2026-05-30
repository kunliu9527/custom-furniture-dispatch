import { NextResponse } from "next/server";
import {
  readSignPublicPayload,
  submitCustomerSignature,
} from "@/lib/server/customer-flow";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const payload = await readSignPublicPayload(token);
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
      signatureDataUrl?: string;
      signedByName?: string;
      planConfirmed?: boolean;
      planConfirmRemark?: string;
    };
    if (!body.signatureDataUrl?.trim() || !body.signedByName?.trim()) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const result = await submitCustomerSignature({
      token,
      signatureDataUrl: body.signatureDataUrl.trim(),
      signedByName: body.signedByName.trim(),
      planConfirmed: body.planConfirmed,
      planConfirmRemark: body.planConfirmRemark,
    });
    if (!result.ok) {
      const status =
        result.error === "not_found"
          ? 404
          : result.error === "already_signed"
            ? 409
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, orderId: result.orderId });
  } catch (err) {
    console.error("[api/sign] POST failed", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
