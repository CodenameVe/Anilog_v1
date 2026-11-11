import { useState, useRef, useEffect } from 'react'
import { API_URL } from '../api'


function Login({ onClose, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const errorTimeoutRef = useRef(null); // clear timer if modal closed

  useEffect(() => {
      return () => {
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
      };
    }, []); 


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });


      // Login Error
      const data = await res.json();
      if (!res.ok) {
        throw new Error('Invalid email or password');
      }


      // Login Success / Save Token
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('avatar_url', data.user.avatar_url || '');
      console.log('Real login success! Token saved:', data.token);
      if (data.user.avatar_url) {
        localStorage.setItem('avatar_url', data.user.avatar_url);
      }
      if (onLoginSuccess) {
        onLoginSuccess(data); // this will call handleLoginSuccess in App.jsx
      } else {
        onClose();
      }
      } catch (err) {
        // 1. SECURITY DELAY: Wait 800ms before showing error
        // This makes "user not found" and "wrong password" take same time
        await new Promise(resolve => setTimeout(resolve, 800));
        // 2. SHOW ERROR
        setLoginError('Invalid email or password. Please try again.');
        setIsLoading(false);
        // 3. AUTO-HIDE AFTER 10 SECONDS
        errorTimeoutRef.current = setTimeout(() => {
          setLoginError("");
        }, 7000); // 10000ms = 10 seconds
      } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f2028] p-6 rounded-xl w-full max-w-md space-y-4 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-zinc-500">✕</button>
        <h2 className="text-white font-bold text-xl text-left">Login</h2>
        

        {loginError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center mb-4">
            {loginError}
          </div>
        )}

        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm text-gray-400">Email/Username</label>
          <input value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full p-2 rounded bg-[#2a2c36] text-white" />
        </div>
        
        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm text-gray-400">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 rounded bg-[#2a2c36] text-white" />
        </div>

        <button onClick={handleLogin} disabled={isLoading} className="w-full bg-purple-600 p-3 rounded-lg text-white font-bold disabled:opacity-50">
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </div>
  )
}

export default Login;