import Link from "next/link";
import ProgressBar from "./ProgressBar";

interface Campaign {
  id: string;
  title: string;
  organizerName: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  imageUrl: string | null;
  deadline: Date;
}

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const daysLeft = Math.max(
    0,
    Math.ceil((campaign.deadline.getTime() - Date.now()) / 86400000)
  );

  return (
    <Link href={`/campaigns/${campaign.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
        {campaign.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-5">
          <p className="text-xs text-emerald-600 font-medium mb-1">{campaign.organizerName}</p>
          <h2 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
            {campaign.title}
          </h2>
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{campaign.description}</p>
          <ProgressBar current={campaign.currentAmount} goal={campaign.goalAmount} />
          <p className="text-xs text-gray-400 mt-3">
            {daysLeft > 0 ? `剩餘 ${daysLeft} 天` : "已結束"}
          </p>
        </div>
      </div>
    </Link>
  );
}
