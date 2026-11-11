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
  // NEW: track if token exists
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))


// Check URL for profile.
useEffect(() => {
  const path = window.location.pathname;
  if (path.startsWith('/u/')) {
    const name = path.split('/u/')[1];
    if (name) {
      setProfileUsername(name);
      setCurrentPage('profile');
    }
  }
}, []);


// Handle profile and home navigation
const handleViewProfile = (username) => {
  const cleanName = username.trim();
  setProfileUsername(cleanName);
  setCurrentPage('profile')
  window.history.pushState({}, '', `/u/${cleanName}`); // Makes URL Shareable
};

const handleBackFromProfile = () => {
  setCurrentPage('home');
  setProfileUsername(null);
  window.history.pushState({}, '', '/'); // Reset URL to home
}




// Login Function
const handleLoginSuccess = (data) => {
  setIsLoggedIn(true)
  setIsLoginOpen(false)
  setCurrentPage('diary')
}

// Logout Function
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('avatar_url')
  localStorage.removeItem('username')
  setIsLoggedIn(false)
  setCurrentPage("home")
}



  return (
    <>
      <Navbar 
        isLoggedIn={isLoggedIn}
        onViewProfile ={(username) => handleViewProfile(username)}
        onShowHome={() => setCurrentPage("home")}
        onShowDiary={() => setCurrentPage("diary")}
        onLoginClick={() => setIsLoginOpen(true)}
        onSignupClick={() => setIsSignupOpen(true)}
        onLogout={handleLogout}
        username={localStorage.getItem('username')}
      />

      {currentPage === 'home' && <Home 
    onStartDiary={() => {
      if (isLoggedIn) {
        setCurrentPage('diary');
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
