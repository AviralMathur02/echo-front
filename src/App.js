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

  const [openFollowingModalGlobal, setOpenFollowingModalGlobal] =
    useState(false);
  const [highlightExplore, setHighlightExplore] = useState(false);
  const [highlightNotifications, setHighlightNotifications] = useState(false);
  // MODIFIED: State for Coming Soon Modal now includes its type
  const [comingSoonModalConfig, setComingSoonModalConfig] = useState({
    isOpen: false,
    type: null, // 'messages' or 'sharing'
  });

  const triggerHighlightExplore = () => {
    setHighlightExplore(true);
    setTimeout(() => setHighlightExplore(false), 1500);
  };

  const triggerHighlightNotifications = () => {
    setHighlightNotifications(true);
    setTimeout(() => setHighlightNotifications(false), 1500);
  };

  const handleOpenFollowingModalForCurrentUser = () => {
    if (currentUser && currentUser.user && currentUser.user.id) {
      setOpenFollowingModalGlobal(true);
    } else {
      console.warn(
        "Attempted to open following modal without a logged-in user or valid ID."
      );
      window.location.href = "/login";
    }
  };

  // MODIFIED: Function to open the Coming Soon Modal, now accepts a 'type' argument
  const handleOpenComingSoonModal = (type = "default") => {
    setComingSoonModalConfig({ isOpen: true, type });
  };

  const handleCloseComingSoonModal = () => {
    setComingSoonModalConfig({ isOpen: false, type: null });
  };

  const Layout = () => {
    return (
      <div className={`theme-${darkMode ? "dark" : "light"}`}>
        <Navbar onOpenComingSoonModal={handleOpenComingSoonModal} />
        <div style={{ display: "flex" }}>
          <LeftBar
            onOpenFollowingModal={handleOpenFollowingModalForCurrentUser}
            onTriggerHighlightExplore={triggerHighlightExplore}
            onTriggerHighlightNotifications={triggerHighlightNotifications}
            onOpenComingSoonModal={handleOpenComingSoonModal}
          />
          <div style={{ flex: 6 }}>
            <Outlet />
          </div>
          <RightBar
            highlightExplore={highlightExplore}
            highlightNotifications={highlightNotifications}
          />
        </div>

        {/* Global FollowingModal */}
        {openFollowingModalGlobal && currentUser && currentUser.user && (
          <FollowingModal
            setOpenModal={setOpenFollowingModalGlobal}
            userId={currentUser.user.id}
            type="following"
          />
        )}

        {/* MODIFIED: Coming Soon Modal now receives config */}
        {comingSoonModalConfig.isOpen && (
          <ComingSoonModal
            setOpenModal={handleCloseComingSoonModal}
            messageType={comingSoonModalConfig.type} // Pass the type here
          />
        )}
      </div>
    );
  };

  const ProtectedRoute = ({ children }) => {
    const location = useLocation();

    if (!currentUser || !currentUser.user) {
      console.log(
        "ProtectedRoute: User not authenticated. Redirecting to /login."
      );
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

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
          // Pass handleOpenComingSoonModal to Home
          element: <Home onOpenComingSoonModal={handleOpenComingSoonModal} />,
        },
        {
          path: "/profile/:id",
          // Pass handleOpenComingSoonModal to Profile
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
