import { prisma } from "@/lib/prisma";
import CampaignCard from "@/components/CampaignCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const campaigns = await prisma.campaign.findMany({
    where: { deadline: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
          <span className="text-2xl font-bold text-emerald-600">捐款平台</span>
          <span className="text-sm text-gray-400">ECPay 練習專案</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">公益活動</h1>
        <p className="text-gray-500 mb-8">支持你在乎的公益專案，透過綠界金流安全捐款</p>

        {campaigns.length === 0 ? (
          <p className="text-gray-400 text-center py-16">目前沒有進行中的活動</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
