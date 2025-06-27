// client/src/App.js

import React, { useState, useContext } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import LeftBar from "./components/leftBar/LeftBar";
import RightBar from "./components/rightBar/RightBar";
import Home from "./pages/home/Home";
import Profile from "./pages/profile/Profile";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import FollowingModal from "./components/followingModal/FollowingModal";
import ComingSoonModal from "./components/comingSoonModal/ComingSoonModal";

import "./style.scss";
import { DarkModeContext } from "./context/darkModeContext";
import { AuthContext } from "./context/authContext";

function App() {
  const { currentUser } = useContext(AuthContext);
  const { darkMode } = useContext(DarkModeContext);

  // State to control the visibility of the FollowingModal
  const [openFollowingModalGlobal, setOpenFollowingModalGlobal] =
    useState(false);
  // NEW: State to store the type of FollowingModal to open ('followers', 'following', 'friends')
  const [followingModalType, setFollowingModalType] = useState("following"); // Default to 'following'

  // States for highlighting sections in RightBar
  const [highlightExplore, setHighlightExplore] = useState(false);
  const [highlightNotifications, setHighlightNotifications] = useState(false);

  // State for Coming Soon Modal now includes its type
  const [comingSoonModalConfig, setComingSoonModalConfig] = useState({
    isOpen: false,
    type: null, // 'messages' or 'sharing'
  });

  // Function to trigger highlight for Explore section in RightBar
  const triggerHighlightExplore = () => {
    setHighlightExplore(true);
    // Remove highlight after 1.5 seconds
    setTimeout(() => setHighlightExplore(false), 1500);
  };

  // Function to trigger highlight for Notifications section in RightBar
  const triggerHighlightNotifications = () => {
    setHighlightNotifications(true);
    // Remove highlight after 1.5 seconds
    setTimeout(() => setHighlightNotifications(false), 1500);
  };

  // MODIFIED: Function to open the FollowingModal for the current user
  // It now accepts a 'type' argument from LeftBar
  const handleOpenFollowingModalForCurrentUser = (type) => {
    if (currentUser && currentUser.user && currentUser.user.id) {
      setFollowingModalType(type); // Set the type passed from LeftBar ('friends', 'followers', 'following')
      setOpenFollowingModalGlobal(true);
    } else {
      console.warn(
        "Attempted to open following modal without a logged-in user or valid ID."
      );
      // If no user, redirect to login (or handle as appropriate for your app)
      window.location.href = "/login";
    }
  };

  // Function to open the Coming Soon Modal, now accepts a 'type' argument
  const handleOpenComingSoonModal = (type = "default") => {
    setComingSoonModalConfig({ isOpen: true, type });
  };

  // Function to close the Coming Soon Modal
  const handleCloseComingSoonModal = () => {
    setComingSoonModalConfig({ isOpen: false, type: null });
  };

  const Layout = () => {
    return (
      // Apply dark/light theme based on darkMode context
      <div className={`theme-${darkMode ? "dark" : "light"}`}>
        {/* Navbar component, passes Coming Soon modal handler */}
        <Navbar onOpenComingSoonModal={handleOpenComingSoonModal} />
        <div style={{ display: "flex" }}>
          {/* LeftBar component */}
          <LeftBar
            // Pass the updated handler for opening FollowingModal (now accepts type)
            onOpenFollowingModal={handleOpenFollowingModalForCurrentUser}
            onTriggerHighlightExplore={triggerHighlightExplore}
            onTriggerHighlightNotifications={triggerHighlightNotifications}
            onOpenComingSoonModal={handleOpenComingSoonModal}
          />
          {/* Outlet for rendering nested routes (Home, Profile) */}
          <div style={{ flex: 6 }}>
            <Outlet />
          </div>
          {/* RightBar component, receives highlight states */}
          <RightBar
            highlightExplore={highlightExplore}
            highlightNotifications={highlightNotifications}
          />
        </div>

        {/* Global FollowingModal conditionally rendered */}
        {openFollowingModalGlobal && currentUser && currentUser.user && (
          <FollowingModal
            setOpenModal={setOpenFollowingModalGlobal}
            userId={currentUser.user.id}
            type={followingModalType} // NEW: Pass the dynamic type here
          />
        )}

        {/* Coming Soon Modal conditionally rendered */}
        {comingSoonModalConfig.isOpen && (
          <ComingSoonModal
            setOpenModal={handleCloseComingSoonModal}
            messageType={comingSoonModalConfig.type} // Pass the type received from Navbar/LeftBar
          />
        )}
      </div>
    );
  };

  // ProtectedRoute component to guard routes requiring authentication
  const ProtectedRoute = ({ children }) => {
    const location = useLocation();

    // If user is not authenticated, redirect to login
    if (!currentUser || !currentUser.user) {
      console.log(
        "ProtectedRoute: User not authenticated. Redirecting to /login."
      );
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user is authenticated and tries to access login/register, redirect to home
    if (
      (location.pathname === "/login" || location.pathname === "/register") &&
      currentUser &&
      currentUser.user
    ) {
      console.log(
        "ProtectedRoute: User already authenticated, redirecting from login/register to /."
      );
      return <Navigate to="/" replace />;
    }

    return children;
  };

  // Define routes using createBrowserRouter
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/",
          element: <Home onOpenComingSoonModal={handleOpenComingSoonModal} />,
        },
        {
          path: "/profile/:id",
          element: (
            <Profile onOpenComingSoonModal={handleOpenComingSoonModal} />
          ),
        },
      ],
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
  ]);

  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
