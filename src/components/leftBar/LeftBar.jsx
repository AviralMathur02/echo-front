// client/src/components/leftBar/LeftBar.jsx

import "./leftBar.scss";
// Material-UI Icons
import HomeIcon from "@mui/icons-material/Home";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";

import { AuthContext } from "../../context/authContext";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { getImageSrc } from "../../utils/imageUtils";

// Accept new highlight trigger functions and Coming Soon modal function as props
const LeftBar = ({
  onOpenFollowingModal, // This function now needs to accept a 'type' argument
  onTriggerHighlightExplore,
  onTriggerHighlightNotifications,
  onOpenComingSoonModal,
}) => {
  const { currentUser } = useContext(AuthContext);

  // MODIFIED: Handle messages click - now opens the ComingSoonModal with 'messages' type
  const handleMessagesClick = () => {
    onOpenComingSoonModal("messages");
  };

  // Handle explore click
  const handleExploreClick = () => {
    onTriggerHighlightExplore(); // Trigger highlight in RightBar
  };

  // Handle notifications click
  const handleNotificationsClick = () => {
    onTriggerHighlightNotifications(); // Trigger highlight in RightBar
  };

  // NEW: Handle Friends click to open FollowingModal with 'friends' type
  const handleFriendsClick = () => {
    // Call onOpenFollowingModal and pass 'friends' as the type
    onOpenFollowingModal("friends");
  };

  return (
    <div className="leftBar">
      <div className="container">
        <div className="menu">
          {/* Link to current user's profile */}
          <Link
            to={`/profile/${currentUser.user?.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="user">
              <img
                src={
                  getImageSrc(currentUser.user?.profilePic) ||
                  "/upload/default-profile-pic.jpg"
                }
                alt=""
              />
              <span>{currentUser.user?.name}</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="item">
              <HomeIcon className="icon" />
              <span>Home</span>
            </div>
          </Link>

          {/* Explore Link - now triggers highlight in RightBar */}
          <div
            className="item"
            onClick={handleExploreClick}
            style={{ cursor: "pointer" }}
          >
            <ExploreOutlinedIcon className="icon" />
            <span>Explore</span>
          </div>

          {/* Notifications Link - now triggers highlight in RightBar */}
          <div
            className="item"
            onClick={handleNotificationsClick}
            style={{ cursor: "pointer" }}
          >
            <NotificationsOutlinedIcon className="icon" />
            <span>Notifications</span>
          </div>

          {/* MODIFIED: Messages Link - now opens ComingSoonModal with 'messages' type */}
          <div
            className="item"
            onClick={handleMessagesClick}
            style={{ cursor: "pointer" }}
          >
            <ChatBubbleOutlineOutlinedIcon className="icon" />
            <span>Messages</span>
          </div>

          {/* Friends Link: Opens the FollowingModal for the current user with 'friends' type */}
          <div
            className="item"
            onClick={handleFriendsClick} // Use the new handler
            style={{ cursor: "pointer" }}
          >
            <PeopleOutlineIcon className="icon" />
            <span>Friends</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftBar;
