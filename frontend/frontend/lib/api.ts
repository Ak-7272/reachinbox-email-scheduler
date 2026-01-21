import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!baseURL) {
  console.warn("NEXT_PUBLIC_BACKEND_URL is not set");
}

export const api = axios.create({
  baseURL,
});
