import axios from "axios";

console.log(import.meta.env.VITE_API_URL)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5271/api",
});

export default api;
