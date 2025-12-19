// src/components/StatCard.tsx
export default function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl p-6 shadow-sm">
      <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
