import axios from "axios";

console.log(process.env.REACT_APP_API_URL)
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5044/api",
});

export default api;
  