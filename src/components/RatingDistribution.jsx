import { useMemo, useState } from 'react';

export default function RatingDistribution({ logs }) {
const [open, setOpen] = useState(false);
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    logs.forEach(log => {
      if (log.rating) counts[log.rating] = (counts[log.rating] || 0) + 1;
    });
    const max = Math.max(...Object.values(counts), 1); // avoid divide by 0
    return { counts, max, totalRated: logs.filter(l => l.rating).length };
  }, [logs]);

 
  if (distribution.totalRated === 0) return null;
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl mb-4">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-3 py-2.5 text-sm"
      >
        <span className="text-zinc-300 font-medium">Rating Distribution • {distribution.totalRated} rated</span>
        <span className="text-zinc-500 text-xs">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-zinc-800 pt-3">
          {[5,4,3,2,1].map(stars => {
            const count = distribution.counts[stars];
            const percent = (count / distribution.max) * 100;
            return (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 w-6">{stars}★</span>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-fuchsia-800 rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <span className="text-[11px] text-zinc-500 w-4 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}