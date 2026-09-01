import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const token = process.env.RETENTION_TOKEN;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || given !== token) return NextResponse.json({ error: "no" }, { status: 401 });
  return NextResponse.json({
    "x-forwarded-for": req.headers.get("x-forwarded-for"),
    "x-client-ip": req.headers.get("x-client-ip"),
    "x-azure-clientip": req.headers.get("x-azure-clientip"),
    "x-azure-socketip": req.headers.get("x-azure-socketip"),
    "x-real-ip": req.headers.get("x-real-ip"),
  });
}
