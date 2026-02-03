import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"

function App() {
  // Use state to track login status so React re-renders when it changes
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"))
  const location = useLocation()

  // Re-check auth whenever the route changes
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"))
  }, [location])

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn
            ? <Home />
            : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/login"
        element={
          isLoggedIn
            ? <Navigate to="/" replace />
            : <Login />
        }
      />

      <Route
        path="/register"
        element={
          isLoggedIn
            ? <Navigate to="/" replace />
            : <Register />
        }
      />

      {/* Catch-all to redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App











