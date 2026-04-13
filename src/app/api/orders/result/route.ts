import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { merchantTradeNo: ref },
    include: { campaign: { select: { title: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    amount: order.amount,
    buyerName: order.buyerName,
    campaignTitle: order.campaign.title,
    merchantTradeNo: order.merchantTradeNo,
  });
}
