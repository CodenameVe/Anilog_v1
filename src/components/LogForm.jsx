import { useState, useEffect } from 'react'
import StarRating from "./StarRating";
import { API_URL } from '../api'

const LogForm = ({ onAddLog }) => {
    // React Hooks
    const [title, setTitle] = useState("")
    const [notes, setNotes] = useState("")
    const [episodesFrom, setEpisodesFrom] = useState("")
    const [episodesTo, setEpisodesTo] = useState("")
    const [rating, setRating] = useState(0)
    const [errors, setErrors] = useState({})
    const [searchResults, setSearchResults] = useState([])
    const [selectedCover, setSelectedCover] = useState("")
    const [maxEpisodes, setMaxEpisodes] = useState(null)


// Debouncing Search Request
useEffect(() => {
  // No search if empty or short
  if (title.trim().length < 2) {
    setSearchResults([])
    return
  }

  // No search if show selected
  if (selectedCover) return

  const debounceTimer = setTimeout(() => {
    searchAnime(title)
  }, 600) 

  // Timer resets if user types more
  return () => clearTimeout(debounceTimer)

}, [title]) 



// Fetch Requet to API
 const searchAnime = async (searchTerm) => {
  const term = searchTerm || title
  if (!term.trim()) {
    setSearchResults([])
    return
  }
  const query = `
    query ($search: String) {
      Page(perPage: 5) {
        media(search: $search, type: ANIME) {
          id
          title { romaji english }
          coverImage { large }
          episodes
        }
      }
    }
  `
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: term } })
    })
    const { data } = await res.json()
    setSearchResults(data.Page.media)
  } catch (err) {
    console.error("Failed:", err)
  }
}



// Handle Submission - Send to Postgres
const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!title.trim()) newErrors.title = "Title is required"
    if (rating === 0) newErrors.rating = "Please select a rating"
    if (!episodesFrom) newErrors.episodesFrom = "Required"
    if (!episodesTo) newErrors.episodesTo = "Required"
    if (episodesFrom && episodesTo && Number(episodesFrom) > Number(episodesTo)) {
        newErrors.episodesTo = "To must be >= From"
    }
    if (maxEpisodes) {
        if (Number(episodesFrom) > maxEpisodes) {
            newErrors.episodesFrom = `Max is ${maxEpisodes}`
        }
        if (Number(episodesTo) > maxEpisodes) {
            newErrors.episodesTo = `Max is ${maxEpisodes}`
        }
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Not logged in");

        // MAP frontend -> backend (reverse of DiaryFeed GET mapping)
        // Frontend: title, notes, episodesFrom, episodesTo, rating, selectedCover
        // Backend: anime_title, thoughts, episode_start, episode_end, rating, anime_image, watched_on, season
        const payload = {
            anime_title: title,
            thoughts: notes,
            season: 1, // you can make this dynamic later
            episode_start: Number(episodesFrom),
            episode_end: Number(episodesTo),
            rating: rating,
            watched_on: new Date().toISOString().split('T')[0],
            anime_image: selectedCover || "https://via.placeholder.com/150"
        };

        const res = await fetch(`${API_URL}/api/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to save log');
        }

        const savedRow = await res.json(); 
        console.log("Saved to Postgres:", savedRow);

        // MAP backend row -> frontend format for DiaryFeed
        const newLogForUI = {
            id: savedRow.id,
            animeTitle: savedRow.anime_title,
            note: savedRow.thoughts,
            season: savedRow.season,
            episodes_from: savedRow.episode_start,
            episodes_to: savedRow.episode_end,
            rating: savedRow.rating,
            date: savedRow.watched_on,
            image: savedRow.anime_image
        };

        onAddLog(newLogForUI);

        // Clear form
        setTitle("")
        setNotes("")
        setRating(0)
        setEpisodesFrom("")
        setEpisodesTo("")
        setSearchResults([])
        setSelectedCover("")
        setMaxEpisodes(null)
        setErrors({})

    } catch (err) {
        console.error(err);
        setErrors({ title: err.message });
    }
}

    return (
  <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 bg-[#1f2028] rounded-xl max-w-md w-full mx-auto border border-[#2e303a]">
    
    {/* --- TITLE + API SEARCH --- */}
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-400 text-left">Title</label>
      <div className="flex gap-2">
            <input
        value={title}
        onChange={(e) => {
        setTitle(e.target.value)
        setSelectedCover("") 
        setMaxEpisodes(null)
        if (errors.title) setErrors({ ...errors, title: null })
        }}
        type="text"
        placeholder="Start typing e.g. apothecary"
        className={`w-full p-2.5 rounded-lg bg-[#2a2c36] text-white border ${errors.title ? 'border-red-500' : 'border-[#3a3c4a]'}`}
        />
      </div>

      {errors.title && <p className="text-xs text-red-400 text-left -mt-1">{errors.title}</p>}

      {/* Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="flex flex-col gap-1 bg-[#2a2c36] border border-[#3a3c4a] p-2 rounded-lg max-h-64 overflow-y-auto">
          {searchResults.map((anime) => (
            <div
              key={anime.id}
              onClick={() => {
                setTitle(anime.title.english || anime.title.romaji)
                setSelectedCover(anime.coverImage.large)
                setMaxEpisodes(anime.episodes)
                setSearchResults([])
                if (errors.title) setErrors({ ...errors, title: null })
              }}
              className="flex gap-3 items-center p-2 hover:bg-[#3a3c4a] cursor-pointer rounded-lg"
            >
              <img src={anime.coverImage.large} alt="" className="w-10 h-14 object-cover rounded" />
              <div className="text-left">
                <p className="text-sm text-white">{anime.title.english || anime.title.romaji}</p>
                <p className="text-xs text-gray-400">{anime.episodes ? `${anime.episodes} eps` : 'Movie / Special'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Show selected cover preview */}
      {selectedCover && (
        <div className="flex gap-2 items-center">
          <img src={selectedCover} alt="selected" className="w-12 h-16 rounded object-cover" />
          <p className="text-xs text-gray-400">Selected cover for your log</p>
        </div>
      )}
    </div>

    {/* --- NOTES --- */}
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-400 text-left">Notes</label>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        type="text"
        placeholder="Thoughts..."
        className="p-2.5 rounded-lg bg-[#2a2c36] text-white border border-[#3a3c4a] placeholder:text-gray-500 focus:outline-none focus:border-violet-500"
      />
    </div>

    {/* --- RATING --- */}
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-400 text-left">Rating</label>
      <StarRating rating={rating} setRating={setRating} />
      {errors.rating && <p className="text-xs text-red-400 text-left -mt-1">{errors.rating}</p>}
    </div>

    {/* --- EPISODES --- */}
    <div className="flex flex-col gap-2">
    <label className="text-sm text-gray-400 text-left">Episodes</label>
    <div className="flex gap-2">
        <div className="flex-1">
        <input
            value={episodesFrom}
            onChange={(e) => {
            const val = Number(e.target.value)
            if (maxEpisodes && val > maxEpisodes) return
            setEpisodesFrom(e.target.value)
            }}
            type="number"
            min="1"
            max={maxEpisodes || undefined}
            required
            placeholder="From"
            className={`w-full p-2.5 rounded-lg bg-[#2a2c36] text-white border placeholder:text-gray-500 focus:outline-none focus:border-violet-500 ${errors.episodesFrom ? 'border-red-500' : 'border-[#3a3c4a]'}`}
        />
        {errors.episodesFrom && <p className="text-xs text-red-400 text-left mt-1">{errors.episodesFrom}</p>}
        </div>
        <div className="flex items-center text-gray-500">—</div>
        <div className="flex-1">
        <input
            value={episodesTo}
            onChange={(e) => {
            const val = Number(e.target.value)
            if (maxEpisodes && val > maxEpisodes) return
            setEpisodesTo(e.target.value)
            }}
            type="number"
            min="1"
            max={maxEpisodes || undefined}
            required
            placeholder="To"
            className={`w-full p-2.5 rounded-lg bg-[#2a2c36] text-white border placeholder:text-gray-500 focus:outline-none focus:border-violet-500 ${errors.episodesTo ? 'border-red-500' : 'border-[#3a3c4a]'}`}
        />
       {errors.episodesTo && <p className="text-xs text-red-400 text-left mt-1">{errors.episodesTo}</p>}
        </div>
    </div>
    
    {/* Helper text */}
    {maxEpisodes && <p className="text-xs text-gray-500 text-left">This anime has {maxEpisodes} episodes</p>}
    </div>

    {/* --- SAVE --- */}
    <button type="submit" className="bg-white text-black p-3 rounded-lg mt-2 font-bold hover:bg-gray-100">
      Save
    </button>
  </form>
)
}

export default LogForm