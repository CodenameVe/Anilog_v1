import { useState } from 'react';

export default function Home({ onStartDiary }) {
  const [trending] = useState([
    { title: "Frieren: Beyond Journey's End", cover: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg', year: 2023, score: 9.3 },
    { title: 'SPY×FAMILY', cover: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg', year: 2022, score: 8.9 },
    { title: 'Chainsaw Man', cover: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', year: 2022, score: 9.1 },
    { title: 'Jujutsu Kaisen', cover: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', year: 2020, score: 9.2 },
  ]);


// NEW: 12 unique covers - no repeats
const marquee = [
  'https://cdn.myanimelist.net/images/anime/1015/138006.jpg', // Frieren
  'https://cdn.myanimelist.net/images/anime/1441/122795.jpg', // SPY x FAMILY
  'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', // Chainsaw Man
  'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', // Jujutsu Kaisen
  'https://cdn.myanimelist.net/images/anime/10/47347.jpg', // Attack on Titan
  'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', // Demon Slayer
  'https://cdn.myanimelist.net/images/anime/6/73245.jpg', // One Piece
  'https://cdn.myanimelist.net/images/anime/9/9453.jpg', // Death Note
  'https://cdn.myanimelist.net/images/anime/1223/96541.jpg', // Fullmetal Alchemist: Brotherhood
  'https://cdn.myanimelist.net/images/anime/13/17405.jpg', // Naruto
  'https://cdn.myanimelist.net/images/anime/1500/103005.jpg', // Vinland Saga
  'https://cdn.myanimelist.net/images/anime/1801/142390.jpg', // Solo Leveling
];

   return (
    <div className="min-h-screen w-full bg-neutral-950 relative overflow-hidden">
      {/* Glow - using style so it can't get stripped */}
      <div className="absolute top-0 right-0 rounded-full pointer-events-none" style={{ width: 600, height: 600, background: 'rgba(124,58,237,0.25)', filter: 'blur(120px)' }} />
      <div className="absolute bottom-0 left-0 rounded-full pointer-events-none" style={{ width: 500, height: 500, background: 'rgba(217,70,239,0.18)', filter: 'blur(120px)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT - centered when stacked, left-aligned on desktop */}
        <div className="max-w-lg w-full mx-auto lg:mx-0 flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="text-violet-400 text-sm font-semibold tracking-widest mb-4">✦ YOUR ANIME DIARY</p>
          <h1 className="text-6xl lg:text-7xl font-black leading-none tracking-tight text-white">
            Track the<br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              shows
            </span>
          </h1>
          <p className="mt-6 text-zinc-400 leading-relaxed">
            Log, rate, and remember every anime you watch. Build your personal journal, write reviews, and share with others — all on AniLog.
          </p>
           <button onClick={onStartDiary} className="mt-8 bg-gradient-to-r from-violet-500 to-fuchsia-400 hover:from-violet-400 hover:to-fuchsia-300 text-white font-bold text-lg px-10 py-4 rounded-full transition shadow-lg shadow-violet-500/40 hover:shadow-violet-400/50 hover:scale-105 active:scale-95">
            Start Tracking
          </button>
          <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white">☆ 10k+ shows</div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white">◧ Personal Logs</div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white">◐ Save Your Memories</div>
          </div>
        </div>

      {/* RIGHT - GRID, NOT ABSOLUTE - can't stack */}
        {/* Float keyframes*/}
        <style>{`@keyframes float { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-8px) } }`}</style>
        <div className="grid grid-cols-2 gap-5 max-w-md mx-auto w-full">
          <div className="mt-0 -rotate-2" style={{ animation: 'float 6s ease-in-out infinite', animationDelay: '0s' }}>
            <AnimeCard anime={trending[0]} />
          </div>
          <div className="mt-8 rotate-2" style={{ animation: 'float 6s ease-in-out infinite', animationDelay: '1s' }}>
            <AnimeCard anime={trending[1]} />
          </div>
          <div className="mt-2 rotate-1" style={{ animation: 'float 6s ease-in-out infinite', animationDelay: '2s' }}>
            <AnimeCard anime={trending[2]} />
          </div>
          <div className="mt-10 -rotate-2" style={{ animation: 'float 6s ease-in-out infinite', animationDelay: '0.5s' }}>
            <AnimeCard anime={trending[3]} />
          </div>
        </div>
      </div>

    {/* Marquee */}
      <style>{`@keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } } .marquee-track { animation: marquee 30s linear infinite; } .marquee-track:hover { animation-play-state: paused; }`}</style>
      <div className="relative z-10 border-t border-zinc-800/50 py-6 overflow-hidden">
        <p className="text-center text-violet-300/80 text-xs font-semibold tracking-widest mb-4">TRENDING THIS WEEK</p>
        <div className="flex overflow-hidden">
          <div className="marquee-track flex gap-4 shrink-0">
            {[...marquee, ...marquee].map((cover, i) => (
              <img key={i} src={cover} alt="" className="w-32 h-44 object-cover rounded-xl opacity-80 hover:opacity-100 transition" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}




// Anime Cards for homepage
function AnimeCard({ anime }) {
  return (
    <div className="w-full bg-zinc-900 border border-violet-500/20 hover:border-violet-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-violet-600/30 hover:-translate-y-2 hover:rotate-0 cursor-pointer">
      <div className="w-full h-60 bg-zinc-900 relative">
        <img src={anime.cover} alt={anime.title} className="w-full h-full object-cover" />
        {/*Rating badge ON the poster */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-amber-300 flex items-center gap-1">
          ★ {anime.score}
        </div>
        {/*Year badge */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded-full text-xs text-white">
          {anime.year}
        </div>
      </div>
      <div className="p-3 bg-zinc-900">
        <p className="text-white text-sm font-semibold truncate">{anime.title}</p>
      </div>
    </div>
  );
}