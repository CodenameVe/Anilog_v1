import { useState, useEffect } from 'react';
import { API_URL } from '../api'

function Navbar({ onShowHome, onShowDiary, onLoginClick, onSignupClick, isLoggedIn, onLogout, onViewProfile, username }) {
  const displayName = username || localStorage.getItem('username') || 'User';
  const [avatarUrl, setAvatarUrl] = useState(
    localStorage.getItem('avatar_url') || `https://ui-avatars.com/api/?name=${displayName}&background=7c3aed&color=fff`
  );

  useEffect(() => {
    if (!displayName || displayName === 'User') return;
    fetch(`${API_URL}/api/users/${displayName}`)
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.avatar_url) {
          setAvatarUrl(data.user.avatar_url);
          localStorage.setItem('avatar_url', data.user.avatar_url);
        }
      })
      .catch(() => {});
    const handleAvatarUpdate = (e) => { setAvatarUrl(e.detail); };
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate);
  }, [displayName]);

  return (
    <nav className="flex justify-between items-center p-4 max-w-6xl mx-auto">
      <div onClick={onShowHome} className="flex items-center gap-2 cursor-pointer select-none">
        <div className="w-8 h-8 rounded-full border-2 border-violet-400 flex items-center justify-center">
          <svg className="w-4 h-4 text-violet-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3h12a1 1 0 0 1 1 1v18l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
        </div>
        <span className="font-black text-2xl tracking-tight">
          <span className="text-white">Ani</span>
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Log</span>
        </span>
      </div>
      <div className="flex gap-2">
        {isLoggedIn ? (
          <>
            <button onClick={() => onViewProfile(displayName)} className="h-9 pl-1 pr-4 flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full text-sm text-white cursor-pointer hover:border-violet-500">
              <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
              Hi, {displayName}
            </button>
            <button onClick={onShowDiary} className="text-white px-4 py-2 rounded-lg hover:bg-zinc-800 hover:text-purple-300">My Diary</button>
            <button onClick={onLogout} className="text-white px-4 py-2 border border-zinc-700 rounded-lg hover:bg-red-600/20 hover:text-red-400">Sign Out</button>
          </>
        ) : (
          <>
            <button onClick={onLoginClick} className="text-zinc-400 px-4 py-2 rounded-lg hover:text-white hover:bg-zinc-800">Login</button>
            <button onClick={onSignupClick} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500">Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
