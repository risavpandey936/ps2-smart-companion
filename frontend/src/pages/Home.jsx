import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { generatePlan } from "../services/api"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

function Home() {
  const navigate = useNavigate()
  const user = localStorage.getItem("user")

  const [taskInput, setTaskInput] = useState("")
  const [steps, setSteps] = useState([])
  const [stepIndex, setStepIndex] = useState(0)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const [focusMode, setFocusMode] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)

  // Load user tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get(`${API}/user-tasks`, {
          params: { email: user }
        })
        setHistory(res.data)
      } catch { }
    }
    fetchTasks()
  }, [user])

  // Focus timer
  useEffect(() => {
    let timer
    if (focusMode && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    }

    if (timeLeft === 0) {
      setFocusMode(false)
      setTimeLeft(300)
      nextStep()
    }

    return () => clearTimeout(timer)
  }, [focusMode, timeLeft])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  const saveTaskToDB = async (task) => {
    await axios.post(`${API}/save-task`, null, {
      params: { content: task, email: user }
    })
  }

  const handleGenerate = async () => {
    if (!taskInput.trim()) return

    try {
      setLoading(true)
      const data = await generatePlan(taskInput)
      setSteps(data[0].all_steps)
      setStepIndex(0)

      await saveTaskToDB(taskInput)
      setHistory(prev => [taskInput, ...prev])
      setTaskInput("")
    } catch {
      alert("Error generating task. Please try a different query.")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(prev => prev + 1)
    }
  }

  const restartSteps = () => setStepIndex(0)

  const startFocus = () => {
    setFocusMode(true)
    setTimeLeft(300)
    // Read the step aloud when focus mode starts
    speakText(steps[stepIndex])
  }

  // --- Voice Input (STT) ---
  const [isListening, setIsListening] = useState(false)

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setTaskInput(transcript)
    }

    recognition.start()
  }

  // --- Voice Output (TTS) ---
  const speakText = (text) => {
    if (!window.speechSynthesis) return
    // Cancel any previous speaking
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9 // Slightly slower for better executive function
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  const progress = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 0

  return (
    <div className="flex min-h-screen bg-slate-950 text-white dashboard-bg font-['Outfit']">

      {/* Sidebar - Enhanced */}
      <aside className="w-80 bg-slate-900/40 backdrop-blur-xl border-r border-white/5 p-8 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <span className="font-bold text-xl">S</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Smart Companion</h2>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest">Active session</span>
          </div>
          <p className="text-slate-400 text-sm truncate">{user}</p>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-4 pr-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Task History</h3>
          {history.length === 0 ? (
            <p className="text-slate-600 text-xs italic">No history yet...</p>
          ) : (
            history.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={index}
                className="group glass-card p-4 rounded-2xl text-sm hover:bg-slate-800/80 cursor-pointer transition-all border-transparent hover:border-indigo-500/30"
                onClick={() => setTaskInput(item)}
              >
                <span className="text-slate-300 group-hover:text-white transition-colors block truncate">{item}</span>
              </motion.div>
            ))
          )}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-8 flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/5 text-slate-400 text-sm font-semibold"
        >
          Logout Session
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-indigo-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-purple-600/10 blur-[150px] rounded-full" />

        <div className="w-full max-w-2xl z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-[2.5rem] p-10 lg:p-14 overflow-hidden relative"
          >
            {/* Intro Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight leading-tight">
                Break any <span className="text-gradient">giant task</span> into slices.
              </h1>
              <p className="text-slate-400 text-lg">Input your goal and let AI create an executive function-friendly plan.</p>
            </div>

            {/* Input Section - Enhanced with Voice */}
            <div className="relative mb-10 group flex gap-3">
              <div className="relative flex-1">
                <input
                  className="w-full p-6 lg:p-7 pr-12 lg:pr-14 rounded-[1.5rem] bg-slate-800/40 border-2 border-slate-700/50 text-white text-lg lg:text-xl focus:outline-none focus:border-indigo-500 transition-all shadow-inner group-hover:bg-slate-800/60"
                  placeholder="What do you need to do?"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                {/* Voice Input Trigger */}
                <button
                  onClick={startListening}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-700/50 hover:bg-slate-600'}`}
                >
                  {isListening ? (
                    <div className="flex gap-1">
                      <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                      <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                      <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                    </div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-8 lg:px-10 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-500 transition-all font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Analyze"}
              </button>
            </div>

            {/* Result Section */}
            <AnimatePresence mode="wait">
              {steps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="space-y-8"
                >
                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 px-1">
                      <span>Step {stepIndex + 1} of {steps.length}</span>
                      <span>{Math.round(progress)}% Focused</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Current Step Card */}
                  <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden group min-h-[160px] flex items-center justify-center"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    <p className="text-2xl lg:text-3xl font-semibold text-center leading-relaxed text-indigo-50">
                      {steps[stepIndex]}
                    </p>

                    {/* Speak Button for individual step */}
                    <button
                      onClick={() => speakText(steps[stepIndex])}
                      className="absolute bottom-4 right-4 p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-full text-indigo-400 transition-all border border-indigo-500/20"
                      title="Read step aloud"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  </motion.div>


                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={startFocus}
                      className="group flex items-center justify-center gap-3 p-5 rounded-2xl bg-white text-slate-950 font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl shadow-white/5"
                    >
                      <span>Start Focus Mode</span>
                      <div className="w-2 h-2 rounded-full bg-indigo-600 group-hover:scale-150 transition-transform" />
                    </button>

                    <button
                      onClick={nextStep}
                      className="p-5 rounded-2xl bg-slate-800 border-2 border-slate-700 hover:border-indigo-500/50 transition-all font-bold text-lg flex items-center justify-center gap-2 group"
                    >
                      Next Step
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>

                    <button
                      onClick={restartSteps}
                      className="sm:col-span-2 py-3 text-slate-500 hover:text-slate-300 font-semibold transition-colors text-sm"
                    >
                      Reset Plan sequence
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* Focus Mode - Full Screen Overlay */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center z-50 p-6 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-900">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 300, ease: "linear" }}
                className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]"
              />
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-4xl space-y-12 text-center"
            >
              <div className="space-y-4">
                <h2 className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-sm">Now Focusing On</h2>
                <motion.p
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="text-4xl lg:text-6xl font-bold text-white px-4 leading-tight"
                >
                  {steps[stepIndex]}
                </motion.p>
              </div>

              <div className="relative inline-block">
                <svg className="w-64 h-64 -rotate-90">
                  <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                  <motion.circle
                    cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="691"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 691 - (timeLeft / 300) * 691 }}
                    className="text-indigo-500 shadow-neon"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl font-bold font-mono tracking-tighter">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </div>
                </div>
              </div>

              <div className="flex gap-6 justify-center">
                <button
                  onClick={() => setFocusMode(false)}
                  className="px-10 py-4 bg-slate-800 border-2 border-slate-700 rounded-2xl hover:bg-slate-700 transition-all font-bold text-slate-300"
                >
                  Exit Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home
