import { useState, useRef, useEffect } from 'react'
import { API_URL } from '../api'

function Signup({ onClose, onSwitchToLogin }) {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("") // NEW
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [signupError, setSignupError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const errorTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if(errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  const handleSignup = async (e) => {
    e.preventDefault()
    setSignupError("")
    setIsLoading(true)

    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
      
    // 1. Frontend validation - username
    if (!username || username.length < 3 || username.length > 20) {
      setSignupError("Username must be between 3 and 20 characters")
      setIsLoading(false)
      errorTimeoutRef.current = setTimeout(() => setSignupError(""), 10000)
      return
    }

    // 2. Frontend validation - confirm password
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match")
      setIsLoading(false)
      errorTimeoutRef.current = setTimeout(() => setSignupError(""), 10000)
      return
    }
    if (password.length < 6) {
      setSignupError("Password must be at least 6 characters")
      setIsLoading(false)
      errorTimeoutRef.current = setTimeout(() => setSignupError(""), 10000)
      return
    }

    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          username // CHANGED - was email.split('@')[0]
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed')
      }
      console.log('✅ User created in Postgres:', data.user)
      // Success - save token + username so auto-login works
      localStorage.setItem('username', data.user.username);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      alert(`Account created for ${data.user.username}! Please log in.`)
      onClose()
      if (onSwitchToLogin) onSwitchToLogin()
    } catch (err) {
      await new Promise(r => setTimeout(r, 500))
      setSignupError(err.message)
      errorTimeoutRef.current = setTimeout(() => setSignupError(""), 10000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f2028] p-6 rounded-xl w-full max-w-md space-y-4 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-zinc-500">✕</button>
        <h2 className="text-white font-bold text-xl text-left">Sign Up</h2>

        {signupError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
            {signupError}
          </div>
        )}

        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm text-gray-400">Email</label>
          <input 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full p-2 rounded bg-[#2a2c36] text-white" 
            placeholder="you@example.com"
          />
        </div>

        {/* NEW - Username field */}
        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm text-gray-400">Username</label>
          <input 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            className="w-full p-2 rounded bg-[#2a2c36] text-white" 
            placeholder="Choose a username (3-20 chars)"
            minLength={3}
            maxLength={20}
          />
        </div>

        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm text-gray-400">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full p-2 rounded bg-[#2a2c36] text-white" 
            placeholder="Min 6 chars"
          />
        </div>
        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm text-gray-400">Confirm Password</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            className="w-full p-2 rounded bg-[#2a2c36] text-white" 
          />
        </div>
        <button 
          onClick={handleSignup} 
          disabled={isLoading}
          className="w-full bg-purple-600 p-3 rounded-lg text-white font-bold disabled:opacity-50"
        >
          {isLoading ? 'Creating account...' : 'Register'}
        </button>
      </div>
    </div>
  )
}
export default Signup;