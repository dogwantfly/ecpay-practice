import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildECPayParams,
  generateECPayForm,
  generateMerchantTradeNo,
} from "@/lib/ecpay";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { campaignId, amount, buyerName, buyerEmail } = body as {
    campaignId: string;
    amount: number;
    buyerName: string;
    buyerEmail: string;
  };

  if (!campaignId || !amount || !buyerName || !buyerEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (amount < 1) {
    return NextResponse.json({ error: "Amount must be at least 1" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (new Date() > campaign.deadline) {
    return NextResponse.json({ error: "Campaign has ended" }, { status: 400 });
  }

  const merchantTradeNo = generateMerchantTradeNo();

  await prisma.order.create({
    data: {
      merchantTradeNo,
      campaignId,
      amount,
      buyerName,
      buyerEmail,
      status: "PENDING",
    },
  });

  const ecpayParams = buildECPayParams({
    merchantTradeNo,
    amount,
    itemName: `捐款支持 ${campaign.title}`.slice(0, 200),
    tradeDesc: campaign.organizerName,
  });

  const html = generateECPayForm(ecpayParams);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
