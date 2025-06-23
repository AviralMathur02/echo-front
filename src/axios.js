// client/src/axios.js

import axios from "axios";

export const makeRequest = axios.create({
  baseURL: "http://localhost:8080/api/", // Your Spring Boot API base URL
  withCredentials: true, // This is crucial for sending HTTP-only cookies
});

// No manual Authorization header setting.
// The browser will automatically send the 'accessToken' cookie
// due to withCredentials: true.
