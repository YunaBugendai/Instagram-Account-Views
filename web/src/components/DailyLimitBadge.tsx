export function DailyLimitBadge({ remaining, limit }: { remaining: number; limit: number }) {
  const empty = remaining <= 0;
  return (
    <span
      className={`self-start rounded-full px-3 py-1 text-sm font-medium ${
        empty ? "bg-danger/15 text-danger" : "bg-surfaceRaised text-textSecondary"
      }`}
    >
      Bugünkü hakkın: {remaining}/{limit}
    </span>
  );
}
