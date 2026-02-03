import { useState } from "react"
import { registerUser } from "../services/auth"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async () => {
    if (!email || !password) return
    try {
      setLoading(true)
      await registerUser(email, password)
      alert("Account created! Please log in.")
      navigate("/login")
    } catch (err) {
      const message = err.response?.data?.detail || "An error occurred during registration"
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 dashboard-bg relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 rounded-3xl w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2 leading-tight">Join Us</h2>
          <p className="text-slate-400">Start breaking tasks down with AI</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
            <input
              type="email"
              className="w-full p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
            <input
              type="password"
              className="w-full p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              placeholder="Create a strong password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full neo-button bg-indigo-600 hover:bg-indigo-500 p-4 rounded-2xl text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Register Now"}
          </button>
        </div>

        <p className="text-slate-400 text-sm text-center mt-8">
          Already have an account?{" "}
          <span
            className="text-indigo-400 font-semibold cursor-pointer hover:text-indigo-300 transition-colors"
            onClick={() => navigate("/login")}
          >
            Login here
          </span>
        </p>
      </motion.div>
    </div>
  )
}

export default Register
