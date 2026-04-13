import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProgressBar from "@/components/ProgressBar";
import SupportForm from "@/components/SupportForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignPage({ params }: PageProps) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const isEnded = new Date() > campaign.deadline;
  const daysLeft = Math.max(
    0,
    Math.ceil((campaign.deadline.getTime() - Date.now()) / 86400000)
  );
  const supporterCount = await prisma.order.count({
    where: { campaignId: id, status: "PAID" },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <Link href="/" className="text-emerald-600 hover:underline text-sm">
            ← 返回活動列表
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: Campaign info */}
          <div className="lg:col-span-3 space-y-6">
            {campaign.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="w-full rounded-2xl object-cover h-56"
              />
            )}
            <div>
              <p className="text-sm text-emerald-600 font-medium">{campaign.organizerName}</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{campaign.title}</h1>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <ProgressBar current={campaign.currentAmount} goal={campaign.goalAmount} />
              <div className="flex gap-6 mt-4 text-sm text-gray-600">
                <div>
                  <p className="font-semibold text-gray-900">{supporterCount}</p>
                  <p>位支持者</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{isEnded ? "已結束" : `${daysLeft} 天`}</p>
                  <p>剩餘時間</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {campaign.deadline.toLocaleDateString("zh-TW")}
                  </p>
                  <p>截止日期</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-2">活動說明</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {campaign.description}
              </p>
            </div>
          </div>

          {/* Right: Donation form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-6">
              {isEnded ? (
                <p className="text-center text-gray-500 py-6">此活動已結束，感謝所有支持者。</p>
              ) : (
                <>
                  <h2 className="font-semibold text-gray-900 mb-4">支持這個活動</h2>
                  <SupportForm
                    campaignId={campaign.id}
                    campaignTitle={campaign.title}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
