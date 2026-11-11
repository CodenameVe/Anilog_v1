import { useState, useEffect } from 'react'
import DiaryFeed from './pages/DiaryFeed'
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import PublicProfile from './components/PublicProfile';
import Home from './pages/Home';

function App() {
  const [currentPage, setCurrentPage] = useState("home")
  const [profileUsername, setProfileUsername] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  // Does token exist?
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))

  // Sync page state FROM the URL (used on load + browser Back/Forward)
  const syncPageFromUrl = () => {
    const path = window.location.pathname;
    if (path.startsWith('/u/')) {
      const name = decodeURIComponent(path.split('/u/')[1] || '');
      if (name) {
        setProfileUsername(name);
        setCurrentPage('profile');
        return;
      }
    }
    if (path === '/diary') {
      setProfileUsername(null);
      setCurrentPage('diary');
      return;
    }
    // Default: home
    setProfileUsername(null);
    setCurrentPage('home');
  };

  // Check URL on first load
  useEffect(() => {
    syncPageFromUrl();
  }, []);

  // Listen for browser Back / Forward buttons
  useEffect(() => {
    const onPopState = () => syncPageFromUrl();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Central helper: change page AND URL together
  const goTo = (page, url) => {
    setCurrentPage(page);
    if (page !== 'profile') {
      setProfileUsername(null);
    }
    window.history.pushState({}, '', url);
  };

  // Handle profile and home navigation
  const handleViewProfile = (username) => {
    const cleanName = username.trim();
    setProfileUsername(cleanName);
    setCurrentPage('profile')
    window.history.pushState({}, '', `/u/${cleanName}`); // Makes URL Shareable
  };

  const handleBackFromProfile = () => {
    goTo('home', '/');
  };

  const handleShowHome = () => {
    goTo('home', '/');
  };

  const handleShowDiary = () => {
    goTo('diary', '/diary');
  };

  // Login Function
  const handleLoginSuccess = (data) => {
    setIsLoggedIn(true)
    setIsLoginOpen(false)
    goTo('diary', '/diary');
  }

  // Logout Function
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('avatar_url')
    localStorage.removeItem('username')
    setIsLoggedIn(false)
    goTo('home', '/');
  }

  return (
    <>
      <Navbar
        isLoggedIn={isLoggedIn}
        onViewProfile={(username) => handleViewProfile(username)}
        onShowHome={handleShowHome}
        onShowDiary={handleShowDiary}
        onLoginClick={() => setIsLoginOpen(true)}
        onSignupClick={() => setIsSignupOpen(true)}
        onLogout={handleLogout}
        username={localStorage.getItem('username')}
      />

      {currentPage === 'home' && <Home
        onStartDiary={() => {
          if (isLoggedIn) {
            goTo('diary', '/diary');
          } else {
            setIsSignupOpen(true);
          }
        }}
      />}
      {currentPage === 'diary' && <DiaryFeed />}
      {currentPage === 'profile' && profileUsername && (
        <PublicProfile username={profileUsername} onBack={handleBackFromProfile} />
      )}

      {isLoginOpen && <Login onClose={() => setIsLoginOpen(false)} onLoginSuccess={handleLoginSuccess} />}
      {isSignupOpen && <Signup onClose={() => setIsSignupOpen(false)} />}
    </>
  )
}

export default App
