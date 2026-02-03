import axios from "axios"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export const registerUser = async (email, password) => {
  return axios.post(`${API}/register`, { email, password })
}

export const loginUser = async (email, password) => {
  return axios.post(`${API}/login`, { email, password })
}
