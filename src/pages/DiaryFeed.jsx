import { useEffect, useState } from "react";
import LogCard from "../components/LogCard";
import LogForm from "../components/LogForm";
import StatsDashboard from "../components/StatsDashboard";
import RatingDistribution from "../components/RatingDistribution";
import { API_URL } from '../api'

function DiaryFeed() {
  const [logs, setLogs] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [ratingFilter, setRatingFilter] = useState(0)
  const [sortBy, setSortBy] = useState("newest")

  // Filtered Logs array
 const filteredLogs = logs
  .filter(log => {
    const matchesSearch = log.animeTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === 0 || log.rating >= ratingFilter;
    return matchesSearch && matchesRating;
  })
  .sort((a, b) => {
    if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
    if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
    if (sortBy === "rating_high") return b.rating - a.rating;
    if (sortBy === "rating_low") return a.rating - b.rating;
    return 0;
  });


  // On Load - READ FROM POSTGRES (not localStorage)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("No token found, please login");
          setIsLoaded(true);
          return;
        }

        const res = await fetch(`${API_URL}/api/logs`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        
        // MAP backend fields (snake_case) to frontend fields (camelCase)
        // Backend: anime_title, anime_image, thoughts, watched_on, episode_start, episode_end
        // Frontend LogCard expects: animeTitle, image, note, date, episodes_from, episodes_to
        const mappedLogs = data.map(row => ({
          id: row.id,
          animeTitle: row.anime_title,
          season: row.season,
          rating: row.rating,
          note: row.thoughts,
          date: row.watched_on,
          episodes_from: row.episode_start,
          episodes_to: row.episode_end,
          image: row.anime_image,
        }));

        setLogs(mappedLogs);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchLogs(); }, []) // <- empty array = run once on page load

  // For now, keep Add/Delete local - we'll make them real in next step
  const handleAddLog = (newLog) => {
    setLogs([newLog, ...logs])
  }

  // Deleting a log
const handleDeleteLog = async (id) => {
  const originalLogs = [...logs];
  setLogs(logs.filter(log => log.id !== id));
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/logs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete');
  } catch (err) {
    console.error(err);
    setLogs(originalLogs);
    alert("Failed to delete: " + err.message);
  }
}

// Editing a log
const handleEditLog = async (id, updatedFields) => {
  // Optimistic update
  const originalLogs = [...logs];
  setLogs(logs.map(log => 
    log.id === id ? { ...log, rating: updatedFields.rating, note: updatedFields.note } : log
  ));

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/logs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        rating: updatedFields.rating,
        thoughts: updatedFields.note,
        episode_start: updatedFields.episode_start,
        episode_end: updatedFields.episode_end
      })
    });

    if (!res.ok) throw new Error('Failed to update');
    
    const updatedRow = await res.json();
    console.log("Updated in Postgres:", updatedRow);
    
    // Sync with real DB data
    setLogs(logs.map(log => 
      log.id === id ? { 
        ...log, 
        rating: updatedFields.rating, 
        note: updatedFields.note,
        episodes_from: updatedFields.episode_start,
        episodes_to: updatedFields.episode_end
      } : log
    ));

      } catch (err) {
        console.error(err);
        setLogs(originalLogs);
        alert("Failed to update: " + err.message);
      }
    }

  if (!isLoaded) {
    return <div className="max-w-2xl mx-auto p-4 text-white">Loading diary...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold text-white text-left">Diary Feed</h1>

      {/* Stats Dashboard + Rating distribtuion*/}
      <div className="lg:flex lg:gap-4">
        <div className="flex-1">
          <StatsDashboard logs={logs} />
        </div>
        <div className="lg:w-[320px]">
          <RatingDistribution logs={logs} />
        </div>
      </div>
      
      {error && <p className="text-red-400 bg-red-900/20 p-2 rounded">{error}</p>}

      <button 
        onClick={() => setIsFormOpen(true)}
        className="w-full p-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700"
      >
          + Add New Log
      </button>

      {/* SearchBar + Rating Dropdown*/}
     <div className="flex gap-2 w-full">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by anime title..."
          className="w-full p-3 pr-10 rounded-xl bg-[#1f2028] text-white border border-[#2e303a] placeholder:text-zinc-500 focus:outline-none focus:border-purple-600"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xl"
          >
            ✕
          </button>
        )}
        </div>
        {/* Filter by Rating */}
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(Number(e.target.value))}
          className="p-3 rounded-xl bg-[#1f2028] text-white border border-[#2e303a] focus:outline-none focus:border-purple-600"
        >
          <option value={0}>All Ratings</option>
          <option value={5}>5 ★ only</option>
          <option value={4}>4+ ★</option>
          <option value={3}>3+ ★</option>
        </select>

        {/* Sort by Date */}
        <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-3 rounded-xl bg-[#1f2028] text-white border border-[#2e303a]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="rating_high">Rating High</option>
            <option value="rating_low">Rating Low</option>
          </select>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f2028] p-6 rounded-xl w-full max-w-2xl max-h-90vh overflow-y-auto relative">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute top-2 right-2 text-zinc-500 hover:text-white text-xl"
            >
              ✕
            </button>
            
            <LogForm 
              onAddLog={(newLog) => {
                handleAddLog(newLog)
                setIsFormOpen(false)
              }} 
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <p className="text-zinc-500 text-center py-10">
            {searchQuery ? `No results for "${searchQuery}"` : "No logs yet. Add your first anime!"}
          </p>
        ) : (
          filteredLogs.map(log => (
            <LogCard 
              key={log.id} 
              log={log} 
              onDelete={handleDeleteLog}
              onEdit={handleEditLog}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default DiaryFeed