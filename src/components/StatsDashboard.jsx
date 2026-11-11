import { useMemo } from 'react';

export default function StatsDashboard({ logs }) {
  const stats = useMemo(() => {
    if (!logs?.length) return null;
    const totalLogs = logs.length;
    const totalEpisodes = logs.reduce((s, l) => {
      const from = Number(l.episodes_from ?? l.episode_start ?? 1);
      const to = Number(l.episodes_to ?? l.episode_end ?? from);
      return s + (to - from + 1);
    }, 0);
    const rated = logs.filter(l => l.rating);
    const avg = rated.length ? (rated.reduce((s, l) => s + Number(l.rating), 0) / rated.length).toFixed(1) : "-";
    const unique = new Set(logs.map(l => l.animeTitle)).size;
    const thisMonth = logs.filter(l => {
      const d = new Date(l.date || l.watched_on || l.created_at);
      const n = new Date();
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length;
    return { totalLogs, totalEpisodes, avg, unique, thisMonth };
  }, [logs]);

  if (!stats) return null;

  const Item = ({ label, value }) => (
    <div className="flex-1 min-w-">
      <p className="text- tracking-widest text-zinc-500 uppercase">{label}</p>
      <p className="text-lg md:text-xl font-bold text-white leading-tight">{value}</p>
    </div>
  );

  return (
    <div className="flex divide-x divide-zinc-800 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2.5 md:px-4 md:py-3 mb-4">
      <div className="flex-1 flex gap-4 md:gap-6 pr-3">
        <Item label="Logs" value={`${stats.totalLogs}`} />
        <Item label="Anime" value={`${stats.unique}`} />
      </div>
      <div className="flex-1 flex gap-4 md:gap-6 px-3">
        <Item label="Episodes" value={`${stats.totalEpisodes}`} />
        <Item label="Avg" value={`${stats.avg}`} />
      </div>
      <div className="hidden sm:flex flex-1 gap-4 md:gap-6 pl-3">
        <Item label="This Month" value={`${stats.thisMonth}`} />
      </div>
    </div>
  );
}