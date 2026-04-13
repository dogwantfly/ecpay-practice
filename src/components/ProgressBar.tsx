interface ProgressBarProps {
  current: number;
  goal: number;
}

export default function ProgressBar({ current, goal }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>NT$ {current.toLocaleString()}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 mt-1">
        目標 NT$ {goal.toLocaleString()}
      </p>
    </div>
  );
}
