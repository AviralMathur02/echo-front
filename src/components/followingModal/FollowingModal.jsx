// client/src/components/followingModal/FollowingModal.jsx

import React, { useEffect } from "react";
import "./followingModal.scss";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { Link } from "react-router-dom";
import { getImageSrc } from "../../utils/imageUtils"; // Updated getImageSrc

import CloseIcon from "@mui/icons-material/Close";

const FollowingModal = ({ setOpenModal, userId, type }) => {
  const endpoint =
    type === "followers"
      ? `/relationships/followers/list?userId=${userId}`
      : type === "following"
      ? `/relationships/following/list?userId=${userId}`
      : `/relationships/friends/list?userId=${userId}`;

  const queryKey = [type, userId];

  const title =
    type === "followers"
      ? "Followers"
      : type === "following"
      ? "Following"
      : "Friends";

  const {
    isLoading,
    error,
    data: usersList,
  } = useQuery({
    queryKey: queryKey,
    queryFn: () => makeRequest.get(endpoint).then((res) => res.data),
    enabled: !!userId,
  });

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setOpenModal(false);
      }
    };

    const handleClickOutside = (e) => {
      if (e.target.classList.contains("followingModal")) {
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
      <div className="wrapper">
        <h1>{title}</h1>
        <div className="close-modal-button" onClick={() => setOpenModal(false)}>
          <CloseIcon />
        </div>

        {error ? (
          <p className="error-message">
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
                onClick={() => setOpenModal(false)}
              >
                <div className="userItem">
                  <div className="userInfo">
                    <img
                      src={getImageSrc(user.profilePic)} // This will now always return a valid string
                      alt={user.name}
                      // *** REMOVE THE onError HANDLER FROM HERE ***
                      // onError={(e) => {
                      //   e.target.onerror = null;
                      //   e.target.src = "/upload/default-profile-pic.jpg";
                      // }}
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
              : type === "following"
              ? "Not following anyone yet."
              : "No friends yet."}
          </p>
        )}
      </div>
    </div>
  );
};

export default FollowingModal;
