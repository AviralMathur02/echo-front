// client/src/components/navbar/Navbar.jsx

import "./navbar.scss";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { DarkModeContext } from "../../context/darkModeContext";
import { AuthContext } from "../../context/authContext";
import { getImageSrc } from "../../utils/imageUtils";
import { makeRequest } from "../../axios";

const Navbar = ({ onOpenComingSoonModal }) => {
  const { toggle, darkMode } = useContext(DarkModeContext);
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- State for Search Functionality ---
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null); // Ref for the search bar container and dropdown

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // MODIFIED: Handle messages click in Navbar - now passes 'messages' type
  const handleMessagesClick = () => {
    onOpenComingSoonModal("messages");
  };

  // Debounce for search input and API call
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 0) {
        try {
          // Fetch search results from backend
          const res = await makeRequest.get(
            `/users/search?query=${searchTerm}`
          );
          setSearchResults(res.data);
          // Only show dropdown if there are actual results
          setShowDropdown(res.data && res.data.length > 0);
        } catch (err) {
          console.error(
            "Error fetching search results:",
            err.response?.data?.message || err.message
          );
          setSearchResults([]); // Clear results on error
          setShowDropdown(false); // Hide dropdown on error
        }
      } else {
        setSearchResults([]); // Clear results if search term is empty
        setShowDropdown(false); // Hide dropdown
      }
    }, 500); // Debounce time: 500ms

    return () => clearTimeout(delayDebounceFn); // Cleanup debounce timer
  }, [searchTerm]);

  // Close dropdown when clicking outside the search area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle input change for search bar
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle focus on search input (to show dropdown if results are ready)
  const handleSearchInputFocus = () => {
    if (searchTerm.length > 0 && searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  // Handle click on a search result item
  const handleSearchResultClick = (userId) => {
    navigate(`/profile/${userId}`);
    setSearchTerm(""); // Clear search term
    setSearchResults([]); // Clear results
    setShowDropdown(false); // Hide dropdown
  };

  return (
    <div className="navbar">
      <div className="left">
        {/* NEW: Apply a class and dynamic class for glow effect based on darkMode */}
        <span
          className={`logo-text ${
            darkMode ? "dark-mode-glow" : "light-mode-glow"
          }`}
        >
          Echo
        </span>
        <Link
          to="/"
          style={{
            color: "inherit",
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <HomeOutlinedIcon
            className="navbar-icon"
            style={{ cursor: "pointer" }}
          />
        </Link>
        {darkMode ? (
          <WbSunnyOutlinedIcon
            onClick={toggle}
            className="navbar-icon"
            style={{ cursor: "pointer" }}
          />
        ) : (
          <DarkModeOutlinedIcon
            onClick={toggle}
            className="navbar-icon"
            style={{ cursor: "pointer" }}
          />
        )}
      </div>

      {/* SEARCH BAR & DROPDOWN CONTAINER */}
      <div className="search-container" ref={searchRef}>
        <div className="search">
          <SearchOutlinedIcon className="navbar-icon" />
          <input
            type="text"
            placeholder="Search by username or name..."
            value={searchTerm}
            onChange={handleSearchInputChange}
            onFocus={handleSearchInputFocus}
          />
        </div>
        {showDropdown && (
          <div className="search-dropdown">
            {searchResults.length > 0
              ? searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(user.id)}
                  >
                    <img
                      src={
                        getImageSrc(user.profilePic) ||
                        "/upload/default-profile-pic.jpg"
                      }
                      alt={user.name}
                    />
                    <span>{user.name}</span>
                  </div>
                ))
              : searchTerm.length > 0 && (
                  <div className="no-results">No users found.</div>
                )}
          </div>
        )}
      </div>
      {/* END SEARCH BAR & DROPDOWN CONTAINER */}

      <div className="right">
        <Link
          to={`/profile/${currentUser.user?.id}`}
          style={{
            color: "inherit",
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <PersonOutlinedIcon
            className="navbar-icon"
            style={{ cursor: "pointer" }}
          />
        </Link>

        {/* MODIFIED: Messages item now triggers modal with 'messages' type */}
        <div
          className="item"
          onClick={handleMessagesClick}
          style={{ cursor: "pointer" }}
        >
          <ChatBubbleOutlineOutlinedIcon className="icon navbar-icon" />
        </div>
        <div className="user">
          <img
            src={
              getImageSrc(currentUser.user?.profilePic) ||
              "/upload/default-profile-pic.jpg"
            }
            alt=""
          />
        </div>
        <div className="item" onClick={handleLogout}>
          <ExitToAppOutlinedIcon className="navbar-icon" />
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
