import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/request";
import { checkEcuadorOnly } from "@/lib/geo";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const token = process.env.RETENTION_TOKEN;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || given !== token) return NextResponse.json({ error: "no" }, { status: 401 });
  const ip = await getClientIp();
  return NextResponse.json({
    xff: req.headers.get("x-forwarded-for"),
    resuelta: ip,
    geo: checkEcuadorOnly(ip),
  });
}
