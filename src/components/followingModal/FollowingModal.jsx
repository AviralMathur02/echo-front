// client/src/components/followingModal/FollowingModal.jsx

import React, { useEffect } from "react";
import "./followingModal.scss"; // Import the SCSS for styling
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { Link } from "react-router-dom"; // For linking to user profiles
import { getImageSrc } from "../../utils/imageUtils"; // Assuming you have this utility

// Material-UI Icon for the close button
import CloseIcon from "@mui/icons-material/Close"; // <--- NEW: Import CloseIcon

const FollowingModal = ({ setOpenModal, userId, type }) => {
  // Determine the endpoint based on the 'type' prop (followers or following)
  // --- FIX: Corrected endpoints to include '/list' as per RelationshipController.java ---
  const endpoint =
    type === "followers"
      ? `/relationships/followers/list?userId=${userId}`
      : `/relationships/following/list?userId=${userId}`;

  const queryKey = [type, userId]; // Query key dynamically changes based on type
  const title = type === "followers" ? "Followers" : "Following";

  // Fetch the list of users (followers or following)
  const {
    isLoading,
    error,
    data: usersList,
  } = useQuery({
    // Renamed 'data' to 'usersList' for clarity
    queryKey: queryKey,
    queryFn: () => makeRequest.get(endpoint).then((res) => res.data),
    enabled: !!userId, // Only fetch if userId is provided
  });

  // Handle closing the modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setOpenModal(false);
      }
    };

    const handleClickOutside = (e) => {
      // Check if the click occurred on the background div, not inside the modal content
      if (e.target.classList.contains("followingModal")) {
        // Use your main modal class name
        setOpenModal(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setOpenModal]);

  return (
    <div className="followingModal">
      {" "}
      {/* Your background modal class */}
      <div className="wrapper">
        {" "}
        {/* Your modal content wrapper class */}
        <h1>{title}</h1>
        {/* --- NEW: Close Button with Red Cross Icon --- */}
        <div className="close-modal-button" onClick={() => setOpenModal(false)}>
          <CloseIcon /> {/* Material-UI Close Icon */}
        </div>
        {/* --- END NEW --- */}
        {error ? (
          <p className="error-message">
            {" "}
            {/* Added a class for potential styling */}
            Error loading {title.toLowerCase()}:{" "}
            {error.response?.data || error.message}
          </p>
        ) : isLoading ? (
          <p>Loading {title.toLowerCase()}...</p>
        ) : usersList && usersList.length > 0 ? (
          <div className="usersList">
            {usersList.map((user) => (
              <Link
                to={`/profile/${user.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
                key={user.id}
                onClick={() => setOpenModal(false)} // Close modal on user click
              >
                <div className="userItem">
                  <div className="userInfo">
                    <img
                      src={
                        getImageSrc(user.profilePic) ||
                        "/upload/default-profile-pic.jpg"
                      }
                      alt={user.name}
                    />
                    <span>{user.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p>
            {type === "followers"
              ? "No followers yet."
              : "Not following anyone yet."}
          </p>
        )}
        {/* Removed the old text "close" button */}
      </div>
    </div>
  );
};

export default FollowingModal;
