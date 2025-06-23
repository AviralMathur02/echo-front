// client/src/context/authContext.js

import { createContext, useState, useEffect } from "react";
import { makeRequest } from "../axios";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  // We'll manage currentUser and initialization state more explicitly
  const [currentUser, setCurrentUser] = useState(null);
  // This state tracks if the initial authentication check (from localStorage/sessionStorage) has completed.
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Function to initialize user from localStorage, checking for active session
  const initializeUserFromStorage = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // Basic check if the parsed object looks like our user structure (has token, user, and user.id)
        if (parsed && parsed.token && parsed.user && parsed.user.id) {
          // *** Crucial Logic for "Fresh Start" vs. "Refresh" ***
          // sessionStorage clears when the browser tab/window is closed completely.
          // If 'activeSession' is NOT found in sessionStorage, it's a fresh app start.
          if (!sessionStorage.getItem("activeSession")) {
            console.log(
              "AuthContext: No active session marker found in sessionStorage. Assuming fresh start, clearing localStorage for re-login."
            );
            localStorage.removeItem("user"); // Clear persistent token to force re-login
            return null; // No user for this fresh session
          }
          console.log(
            "AuthContext: Active session detected. Restoring user from localStorage."
          );
          return parsed; // Restore user for active session
        }
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      localStorage.removeItem("user"); // Clear corrupted data in localStorage
    }
    return null; // No valid user or active session found
  };

  // useEffect to run once on component mount for initial authentication check
  useEffect(() => {
    const userFromStorage = initializeUserFromStorage();
    setCurrentUser(userFromStorage); // Set currentUser based on the initialization logic
    setIsAuthInitialized(true); // Mark authentication as initialized
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to handle user login
  const login = async (inputs) => {
    console.log("AuthContext - login function called with inputs:", inputs);
    try {
      const res = await makeRequest.post("auth/login", inputs);
      const jwtToken = res.data; // Assuming backend sends just the JWT string directly
      console.log("AuthContext - API response received (raw JWT):", jwtToken);

      // Decode the JWT to extract user details from its payload
      const decodedUser = jwtDecode(jwtToken);
      console.log("AuthContext - Decoded JWT payload:", decodedUser);

      // Construct the structured user object to store in state and localStorage
      const userToStore = {
        token: jwtToken, // Store the raw JWT token
        user: {
          id: decodedUser.id, // Assuming 'id' is a claim in your JWT payload
          username: decodedUser.sub, // 'sub' (subject) is typically used for username
          name: decodedUser.name || decodedUser.sub, // Use 'name' claim if available, fallback to 'sub'
          profilePic: decodedUser.profilePic || decodedUser.profilePicUrl || "", // Get profile pic URL from JWT claims, if available
        },
      };

      setCurrentUser(userToStore); // Update the React state
      localStorage.setItem("user", JSON.stringify(userToStore)); // Persist to localStorage
      sessionStorage.setItem("activeSession", "true"); // Set active session marker for current browser session
      console.log(
        "AuthContext - currentUser state updated and session marked as active:",
        userToStore
      );
    } catch (error) {
      // Log and re-throw the error to allow the calling component (e.g., Login.jsx) to handle it
      console.error(
        "AuthContext - Login API call failed:",
        error.response?.data || error.message || error
      );
      throw error;
    }
  };

  // Function to handle user logout
  const logout = async () => {
    console.log("AuthContext - logout function called");
    try {
      // Optional: If you have a backend logout endpoint that invalidates tokens/sessions
      // await makeRequest.post("auth/logout"); // Uncomment if you have a logout API
      setCurrentUser(null); // Clear the currentUser state
      console.log("AuthContext - currentUser set to null after logout.");
    } catch (err) {
      console.error("Logout failed:", err.response?.data || err.message);
    } finally {
      // Always ensure localStorage and sessionStorage are cleared on explicit logout
      localStorage.removeItem("user");
      sessionStorage.removeItem("activeSession");
      console.log("AuthContext - localStorage and sessionStorage cleared.");
    }
  };

  // Render a loading state until authentication initialization is complete.
  // This prevents ProtectedRoute from redirecting prematurely.
  if (!isAuthInitialized) {
    return <div>Loading authentication...</div>; // You can replace this with a more sophisticated spinner/component
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
