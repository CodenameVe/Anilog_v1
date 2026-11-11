import StarRating from './StarRating'
import { useState, useEffect } from 'react'

const LogCard = ({ log, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editRating, setEditRating] = useState(log.rating)
  const [editNote, setEditNote] = useState(log.note)
  const [editFrom, setEditFrom] = useState(log.episodes_from)
  const [editTo, setEditTo] = useState(log.episodes_to)
  const [maxEpisodes, setMaxEpisodes] = useState(null);

// Fetching max episodes from the title so users cant exceed during edits.
const fetchMaxEpisodes = async (title) => {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($search: String){ Media(search: $search, type: ANIME){ episodes } }`,
        variables: { search: title }
      })
    });
    const data = await res.json();
    return data?.data?.Media?.episodes || null; // null = unknown max (movie)
  } catch { return null; }
};

useEffect(() => {
    if (isEditing) {
      setEditFrom(log.episodes_from)
      setEditTo(log.episodes_to)
      setEditRating(log.rating)
      setEditNote(log.note)
      fetchMaxEpisodes(log.animeTitle).then(setMaxEpisodes)
    }
  }, [isEditing, log])


  return (
    <div className="flex gap-4 p-4 bg-[#1f2028] rounded-xl border border-[#2e303a] relative">
      <button onClick={() => setIsEditing(true)} className="text-sm text-purple-400 absolute top-2 right-10 hover:text-purple-300">Edit</button>
      <button onClick={() => onDelete(log.id)} className="absolute top-2 right-2 text-zinc-500 hover:text-red-400">✕</button>
      
      <img src={log.image} alt={log.animeTitle} className="w-24 h-32 object-cover rounded-lg flex-shrink-0" />

      <div className="flex flex-col gap-1 text-left">
        <h2 className="font-bold text-white">{log.animeTitle} - S{log.season}</h2>
        
        <div className="text-yellow-400 text-sm">
          {"★".repeat(log.rating)}{"☆".repeat(5 - log.rating)}
        </div>
        {log.note && (
          <p className="text-sm text-zinc-400 mt-1 italic">"{log.note}"</p>
        )}

        <p className="text-xs text-zinc-500 mt-auto">
          {log.date} • Ep {log.episodes_from}-{log.episodes_to}
        </p>
      </div>

      {/* Editing Log Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2c36] p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="text-white font-bold">Edit Log</h3>
            
            {/* Episodes Edit */}
            <div className="flex flex-col gap-2 text-left">
              <label className="text-sm text-gray-400">
                Episodes {maxEpisodes && <span className="text-[11px] text-zinc-500">(Max: {maxEpisodes})</span>}
              </label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="1"
                  max={maxEpisodes || undefined}
                  value={editFrom} 
                  onChange={e => {
                    let val = parseInt(e.target.value) || 1
                    if (maxEpisodes && val > maxEpisodes) val = maxEpisodes
                    setEditFrom(val)
                    if (editTo < val) setEditTo(val)
                  }}
                  className="w-1/2 p-2 rounded bg-[#1f2028] text-white border border-[#3a3c4a]"
                  placeholder="From"
                />
                <span className="text-gray-500 flex items-center">—</span>
                <input 
                  type="number" 
                  min={editFrom}
                  max={maxEpisodes || undefined}
                  value={editTo} 
                  onChange={e => {
                    let val = parseInt(e.target.value) || 1
                    if (maxEpisodes && val > maxEpisodes) val = maxEpisodes
                    if (val < editFrom) val = editFrom
                    setEditTo(val)
                  }}
                  className="w-1/2 p-2 rounded bg-[#1f2028] text-white border border-[#3a3c4a]"
                  placeholder="To"
                />
              </div>
            </div>

            {/* Rating Edit */}
            <div className="flex flex-col gap-2 text-left">
              <label className="text-sm text-gray-400">Rating</label>
              <StarRating rating={editRating} setRating={setEditRating} />
            </div>

            {/* Thoughts Edit */}
            <div className="flex flex-col gap-2 text-left">
              <label className="text-sm text-gray-400">Thoughts</label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full p-2 rounded bg-[#1f2028] h-24 text-white border border-[#3a3c4a]"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="text-gray-400 px-4 py-2 hover:text-white">Cancel</button>
              <button onClick={() => {
                onEdit(log.id, { 
                  rating: editRating, 
                  note: editNote,
                  episode_start: Number(editFrom),
                  episode_end: Number(editTo)
                })
                setIsEditing(false)
              }} className="bg-purple-600 px-4 py-2 rounded text-white hover:bg-purple-500">Save</button>
            </div>
          </div>
        </div>
      )}
    </div> 
  )
}

export default LogCard