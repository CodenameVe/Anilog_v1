import { useState, useEffect } from 'react';
import { API_URL } from '../api'


export default function PublicProfile({ username, onBack }) {
const [user, setUser] = useState(null);
const [stats, setStats] = useState(null);
const [logs, setLogs] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

// Editing Profile Picture
const [showEdit, setShowEdit] = useState(false);
const [newAvatarUrl, setNewAvatarUrl] = useState('');
const [isSaving, setIsSaving] = useState(false);

// Is this my own profile?
const currentUser = localStorage.getItem('username');
const isOwnProfile = currentUser && currentUser.toLowerCase() === username.toLowerCase();


const handleSaveAvatar = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in');
    return;
  }
  if (!newAvatarUrl.startsWith('http')) {
    alert('Please paste a valid image URL');
    return;
  }

  setIsSaving(true);
  try {
    const res = await fetch(`${API_URL}/api/users/me/avatar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ avatar_url: newAvatarUrl })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Update UI instantly
    setUser({ ...user, avatar_url: data.avatar_url });
    localStorage.setItem('avatar_url', data.avatar_url);
    window.dispatchEvent(new CustomEvent('avatar-updated', { detail: data.avatar_url }));
    setShowEdit(false);
    setNewAvatarUrl('');
  } catch (err) {
    alert(err.message);
  } finally {
    setIsSaving(false);
  }
};



useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch user profile and stats
            const userRes = await fetch(`${API_URL}/api/users/${username}`);
            if (!userRes.ok) throw new Error('Failed to fetch user profile');
            const userData = await userRes.json();
            setUser(userData.user);
            setStats(userData.stats);


            // Fetch user logs
            const logsRes = await fetch(`${API_URL}/api/users/${username}/logs`);
            if (!logsRes.ok) throw new Error('Failed to fetch user logs');
            const logsData = await logsRes.json();
            

            // Map logs data
            const mappedLogs = logsData.map(log => ({
                 id: log.id,
                animeTitle: log.anime_title,
                image: log.anime_image,
                season: log.season,
                episodes_from: log.episode_start,
                episodes_to: log.episode_end,
                date: log.watched_on,
                rating: log.rating,
                note: log.thoughts,
                }));
                setLogs(mappedLogs);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    fetchProfile();
}, [username]);

 if (isLoading) {
    return <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-white">Loading {username}'s profile...</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4 text-white">
        <h1 className="text-2xl font-bold">{error}</h1>
        <button onClick={onBack} className="bg-violet-600 px-4 py-2 rounded-lg">Go Home</button>
      </div>
    );
  }

 return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back + Share */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="text-zinc-400 hover:text-white">← Back</button>
          <button 
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="text-sm bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-700"
          >
            Copy link
          </button>
        </div>
        {/* Header */}
       <div className="flex items-center gap-6 mb-10">
        {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="w-20 h-20 rounded-full object-cover border border-violet-500/30" />
        ) : (
            <div className="w-20 h-20 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-2xl font-bold text-violet-300">
            {user.username[0].toUpperCase()}
            </div>
        )}
        <div>
            <h1 className="text-3xl font-black">{user.username}</h1>
            <p className="text-zinc-400 text-sm mt-1">Member since {new Date(user.created_at).toLocaleDateString()}</p>
            {isOwnProfile && (
            <button onClick={() => setShowEdit(true)} className="mt-2 text-xs bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg hover:bg-zinc-700">
                Edit Avatar
            </button>
            )}
        </div>
        </div>

        {/* Stats - reuse your StatsDashboard style */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-[#1f2028] border border-[#2e303a] rounded-xl p-4">
            <p className="text-zinc-500 text-xs">Total Logs</p>
            <p className="text-xl font-bold">{stats.total_logs}</p>
          </div>
          <div className="bg-[#1f2028] border border-[#2e303a] rounded-xl p-4">
            <p className="text-zinc-500 text-xs">Episodes</p>
            <p className="text-xl font-bold">{stats.total_episodes}</p>
          </div>
          <div className="bg-[#1f2028] border border-[#2e303a] rounded-xl p-4">
            <p className="text-zinc-500 text-xs">Avg Rating</p>
            <p className="text-xl font-bold">{Number(stats.avg_rating).toFixed(1)}★</p>
          </div>
        </div>
        
        {/* Edit Picture Modal */}
        {showEdit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1f2028] p-6 rounded-xl w-full max-w-md space-y-4">
            <h3 className="text-white font-bold">Change Profile Picture</h3>
            <p className="text-xs text-zinc-400">Paste an image URL (e.g. from MyAnimeList, Imgur, Discord)</p>
            <input
                value={newAvatarUrl}
                onChange={e => setNewAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 rounded bg-[#2a2c36] text-white"
            />
            {newAvatarUrl && (
                <img src={newAvatarUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover mx-auto" />
            )}
            <div className="flex gap-2 justify-end">
                <button onClick={() => setShowEdit(false)} className="text-zinc-400 px-4 py-2">Cancel</button>
                <button onClick={handleSaveAvatar} disabled={isSaving} className="bg-violet-600 px-4 py-2 rounded-lg text-white disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>
            </div>
        </div>
        )}

        {/* Logs Grid - read-only */}
        {logs.length === 0 ? (
          <p className="text-zinc-500">No logs yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {logs.map(log => (
              <div key={log.id} className="flex gap-4 p-4 bg-[#1f2028] rounded-xl border border-[#2e303a]">
                <img src={log.image} alt={log.animeTitle} className="w-20 h-28 object-cover rounded-lg" />
                <div className="flex flex-col gap-1 text-left">
                  <h2 className="font-bold text-white text-sm">{log.animeTitle}</h2>
                  <div className="text-yellow-400 text-xs">{"★".repeat(log.rating)}{"☆".repeat(5-log.rating)}</div>
                  {log.note && <p className="text-xs text-zinc-400 italic">"{log.note}"</p>}
                  <p className="text-[11px] text-zinc-500 mt-auto">Ep {log.episodes_from}-{log.episodes_to}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );



}