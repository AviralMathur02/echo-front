// client/src/pages/profile/Profile.jsx

import "./profile.scss";
import Posts from "../../components/posts/Posts";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../../context/authContext";
import Update from "../../components/update/Update";
import { getImageSrc } from "../../utils/imageUtils";
import FollowingModal from "../../components/followingModal/FollowingModal";

// Material-UI Imports
import FacebookTwoToneIcon from "@mui/icons-material/FacebookTwoTone";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import PinterestIcon from "@mui/icons-material/Pinterest";
import PlaceIcon from "@mui/icons-material/Place";
import LanguageIcon from "@mui/icons-material/Language";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";

// Accept onOpenComingSoonModal as a prop
const Profile = ({ onOpenComingSoonModal }) => {
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openFollowersModal, setOpenFollowersModal] = useState(false);
  const [openFollowingModal, setOpenFollowingModal] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const userId = parseInt(useLocation().pathname.split("/")[2]); // The ID of the profile currently being viewed

  // --- Start Debugging Aid for Profile ID Logic (KEEP THIS FOR NOW) ---
  useEffect(() => {
    console.log("Profile Page Render - Debug Info:");
    console.log("   currentUser:", currentUser);
    console.log("   userId (from URL):", userId, "(Type:", typeof userId, ")");
    if (currentUser && currentUser.user) {
      console.log(
        "   currentUser.user.id:",
        currentUser.user.id,
        "(Type:",
        typeof currentUser.user.id,
        ")"
      );
      console.log("   Is own profile?", currentUser.user.id === userId);
    } else {
      console.log("   currentUser or currentUser.user is null/undefined.");
    }
  }, [currentUser, userId]);
  // --- End Debugging Aid ---

  const {
    isLoading,
    error,
    data: userData,
  } = useQuery({
    // Renamed 'data' to 'userData'
    queryKey: ["user", userId],
    queryFn: () =>
      makeRequest.get("/users/find/" + userId).then((res) => {
        return res.data;
      }),
    enabled: !!userId, // Only fetch user data if userId is valid
  });

  // Query for Followers Count of the CURRENTLY VIEWED PROFILE
  const { isLoading: followersCountIsLoading, data: followersCountData } =
    useQuery({
      queryKey: ["followersCount", userId], // Key for the viewed user's followers
      queryFn: () =>
        makeRequest
          .get(`/relationships/followers/count?userId=${userId}`)
          .then((res) => res.data), // Assuming backend returns raw long
      initialData: 0, // Ensure it's 0 if no data
      enabled: !!currentUser && !!userId, // Only fetch if user is logged in AND userId is available
      placeholderData: 0, // Show 0 while loading
    });

  // Query for Following Count of the CURRENTLY VIEWED PROFILE
  // This query fetches the 'Following' count displayed on the *viewed profile*.
  const { isLoading: followingCountIsLoading, data: followingCountData } =
    useQuery({
      queryKey: ["followingCount", userId], // Key for the viewed user's following
      queryFn: () =>
        makeRequest
          .get(`/relationships/following/count?userId=${userId}`)
          .then((res) => res.data), // Assuming backend returns raw long
      initialData: 0, // Ensure it's 0 if no data
      enabled: !!currentUser && !!userId, // Always enabled if user is logged in AND userId is available
      placeholderData: 0, // Show 0 while loading
    });

  // Query to check if the CURRENT LOGGED-IN USER is following the VIEWED PROFILE
  const { isLoading: rIsLoading, data: isFollowing } = useQuery({
    // This queryKey should include *both* the current user's ID and the viewed user's ID
    // to correctly identify the relationship from the perspective of the current user.
    queryKey: ["relationship", currentUser?.user?.id, userId], // Updated key with optional chaining
    queryFn: async () => {
      // Made async to handle potential null currentUser.user.id
      // Only make the request if currentUser and userId are defined AND it's not the current user's own profile
      if (currentUser?.user?.id && userId && currentUser.user.id !== userId) {
        try {
          const res = await makeRequest.get(
            "/relationships?followedUserId=" + userId
          );
          return res.data; // Expected to be true or false
        } catch (err) {
          console.error(
            "Error fetching relationship status:",
            err.response?.data?.message || err.message
          );
          // For a 403 on this GET, it means the user is not authorized to check the relationship
          // In many cases, it's safer to just assume 'false' if the check fails due to auth,
          // rather than breaking the UI.
          if (err.response?.status === 403 || err.response?.status === 401) {
            return false; // Assume not following if unauthorized to check
          }
          throw err; // Re-throw other errors
        }
      }
      return false; // Default to false if conditions not met (e.g., not logged in, or own profile)
    },
    // Only enable if current user is logged in AND it's not their own profile
    enabled: !!currentUser?.user?.id && currentUser.user.id !== userId, // Updated enabled condition with optional chaining
  });

  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: (isCurrentlyFollowing) => {
      // This parameter tells us the current state
      if (isCurrentlyFollowing) {
        console.log("Unfollowing user with ID:", userId);
        return makeRequest.delete("/relationships", {
          data: { userId: userId }, // Axios needs 'data' key for DELETE requests with a body
        });
      } else {
        console.log("Following user with ID:", userId);
        return makeRequest.post("/relationships", { userId: userId });
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data for the viewed profile
      // This updates the "Follow"/"Unfollow" button state on the viewed profile
      queryClient.invalidateQueries({
        queryKey: ["relationship", currentUser?.user?.id, userId],
      });

      // Invalidate the viewed user's followers count
      queryClient.invalidateQueries({ queryKey: ["followersCount", userId] });

      // --- CRUCIAL: Invalidate the CURRENT USER'S following count ---
      // This makes sure the 'Following' count on the current user's profile updates
      if (currentUser?.user) {
        // Check if currentUser.user exists
        queryClient.invalidateQueries({
          queryKey: ["followingCount", currentUser.user.id],
        });
        // If you have a general query for the current user's full data (e.g., in Navbar/Layout)
        queryClient.invalidateQueries({
          queryKey: ["user", currentUser.user.id],
        });
      }

      // Invalidate the viewed user's main profile data (if it includes counts directly)
      queryClient.invalidateQueries({ queryKey: ["user", userId] });

      // Invalidate suggestions on the right bar to remove/add followed users
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });

      console.log("Follow/Unfollow successful, queries invalidated.");
    },
    onError: (err) => {
      console.error(
        "Error following/unfollowing:",
        err.response?.data?.message || err.message || "Unknown error"
      );
      alert(
        `Follow/Unfollow failed: ${
          err.response?.data?.message || err.message || "Unknown error"
        }`
      );
    },
  });

  const handleFollow = () => {
    followMutation.mutate(isFollowing); // Pass the current `isFollowing` status to the mutation
  };

  const deleteProfileMutation = useMutation({
    mutationFn: () => {
      return makeRequest.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      logout();
      navigate("/login");
      alert("Your profile has been successfully deleted.");
    },
    onError: (err) => {
      console.error(
        "Error deleting profile:",
        err.response?.data?.message || err.message || "Unknown error"
      );
      alert(
        "Failed to delete profile: " +
          (err.response?.data?.message || "Unknown error")
      );
    },
  });

  const handleDeleteProfile = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your profile? This action cannot be undone."
      )
    ) {
      deleteProfileMutation.mutate();
    }
    setOpenMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="profile">
      {error ? (
        `Something went wrong! Error: ${
          error.response?.data?.message || error.message
        }`
      ) : isLoading ? (
        "loading"
      ) : (
        <>
          <div className="images">
            <img
              src={
                getImageSrc(userData.coverPic) ||
                "/upload/default-cover-pic.jpg"
              }
              alt="Cover"
              className="cover"
            />
            <img
              src={
                getImageSrc(userData.profilePic) ||
                "/upload/default-profile-pic.jpg"
              }
              alt="Profile"
              className="profilePic"
            />
          </div>
          <div className="profileContainer">
            <div className="uInfo">
              <div className="left">
                {/* Social media links */}
                <a
                  href={`https://facebook.com/${userData.facebook || ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FacebookTwoToneIcon fontSize="large" />
                </a>
                <a
                  href={`https://instagram.com/${userData.instagram || ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramIcon fontSize="large" />
                </a>
                <a
                  href={`https://twitter.com/${userData.twitter || ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <TwitterIcon fontSize="large" />
                </a>
                <a
                  href={`https://linkedin.com/in/${userData.linkedin || ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkedInIcon fontSize="large" />
                </a>
                <a
                  href={`https://pinterest.com/${userData.pinterest || ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PinterestIcon fontSize="large" />
                </a>
              </div>
              <div className="center">
                <span>{userData.name}</span>
                <div className="info">
                  {userData.city && userData.city !== "Your city" && (
                    <div className="item">
                      <PlaceIcon />
                      <span>{userData.city}</span>
                    </div>
                  )}
                  {userData.websiteName &&
                    userData.websiteUrl &&
                    userData.websiteName !== "Your website" && (
                      <div className="item">
                        <LanguageIcon />
                        <a
                          href={
                            userData.websiteUrl.startsWith("http")
                              ? userData.websiteUrl
                              : `https://${userData.websiteUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <span>{userData.websiteName}</span>
                        </a>
                      </div>
                    )}
                </div>

                {/* Followers and Following Counts */}
                <div className="followStats">
                  <span
                    className="stat-item"
                    onClick={() => setOpenFollowersModal(true)}
                  >
                    <b>
                      {followersCountIsLoading ? "..." : followersCountData}
                    </b>{" "}
                    Followers
                  </span>

                  {/* Following count only visible on current user's profile */}
                  {currentUser &&
                    currentUser.user &&
                    currentUser.user.id === userId && (
                      <span
                        className="stat-item"
                        onClick={() => setOpenFollowingModal(true)}
                      >
                        <b>
                          {followingCountIsLoading ? "..." : followingCountData}
                        </b>{" "}
                        Following
                      </span>
                    )}
                </div>

                {rIsLoading || followMutation.isPending ? (
                  "loading"
                ) : currentUser &&
                  currentUser.user &&
                  currentUser.user.id === userId ? (
                  <button onClick={() => setOpenUpdate(true)}>Update</button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
              <div className="right">
                <EmailOutlinedIcon />
                {currentUser &&
                  currentUser.user &&
                  currentUser.user.id === userId && (
                    <div className="more-options-container">
                      <MoreVertIcon
                        onClick={() => setOpenMenu(!openMenu)}
                        ref={menuRef}
                        style={{ cursor: "pointer" }}
                      />
                      {openMenu && (
                        <div className="options-menu">
                          <button
                            onClick={handleDeleteProfile}
                            className="delete-button"
                          >
                            Delete Profile
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
            {/* Pass onOpenComingSoonModal to Posts */}
            <Posts
              userId={userId}
              onOpenComingSoonModal={onOpenComingSoonModal}
            />
          </div>
        </>
      )}
      {openUpdate && (
        <Update
          setOpenUpdate={setOpenUpdate}
          user={userData}
          currentUser={currentUser}
        />
      )}
      {openFollowersModal && (
        <FollowingModal
          setOpenModal={setOpenFollowersModal}
          userId={userId}
          type="followers"
        />
      )}
      {openFollowingModal && (
        <FollowingModal
          setOpenModal={setOpenFollowingModal}
          userId={userId}
          type="following"
        />
      )}
    </div>
  );
};

export default Profile;
