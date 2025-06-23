// client/src/components/rightBar/RightBar.jsx

import "./rightBar.scss";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/authContext";
import { Link } from "react-router-dom";
import { getImageSrc } from "../../utils/imageUtils";

// Accept highlight state as props
const RightBar = ({ highlightExplore, highlightNotifications }) => {
  const { currentUser } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [localSuggestions, setLocalSuggestions] = useState([]);

  const {
    isLoading: suggestionsLoading,
    error: suggestionsError,
    data: suggestionsData,
  } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () =>
      makeRequest.get("/users/suggestions").then((res) => res.data),
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (suggestionsData) {
      setLocalSuggestions(
        suggestionsData.map((user) => ({
          ...user,
          animating: false, // Ensure this is false initially
          localId: user.id + "_" + Date.now(),
        }))
      );
    }
  }, [suggestionsData]);

  // Mutation for following from suggestions
  const followMutation = useMutation({
    mutationFn: (followedUserId) => {
      // Send userId as an object, matching backend's RelationshipRequest DTO
      return makeRequest.post("/relationships", { userId: followedUserId });
    },
    onSuccess: (data, followedUserId) => {
      // 'followedUserId' is the variable passed to mutate
      // --- Step 1: Trigger animation for the followed user (client-side removal) ---
      setLocalSuggestions((prev) =>
        prev.map((user) =>
          user.id === followedUserId ? { ...user, animating: true } : user
        )
      );

      // --- Step 2: Invalidate queries to refresh counts and other relevant data ---

      // Invalidate relationship status for the current user and the followed user
      // This is primarily for the Profile page button state if the user navigates there
      if (currentUser?.user) {
        // Use optional chaining for safety
        queryClient.invalidateQueries({
          queryKey: ["relationship", currentUser.user.id, followedUserId],
        });
      }

      // Invalidate the followed user's followers count
      queryClient.invalidateQueries({
        queryKey: ["followersCount", followedUserId],
      });

      // Invalidate the CURRENT USER'S following count
      // This will ensure the 'Following' count on the current user's profile updates
      if (currentUser?.user) {
        // Use optional chaining for safety
        queryClient.invalidateQueries({
          queryKey: ["followingCount", currentUser.user.id],
        });
        // If you have a query that fetches the current user's *full* profile data which includes counts
        queryClient.invalidateQueries({
          queryKey: ["user", currentUser.user.id],
        });
      }

      // Also invalidate the followed user's main profile data if it includes counts directly
      queryClient.invalidateQueries({ queryKey: ["user", followedUserId] });

      // Invalidate the main "suggestions" query to allow new suggestions to be fetched
      // The onTransitionEnd will trigger a delayed refetch, but an immediate invalidate
      // can ensure consistency if the user navigates away and back quickly.
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });

      console.log("Follow from RightBar successful, queries invalidated.");
    },
    onError: (err) => {
      console.error(
        "Error following user from RightBar:",
        err.response?.data?.message || err.message || "Unknown error"
      );
      alert(
        `Failed to follow: ${
          err.response?.data?.message || err.message || "Unknown error"
        }`
      );
    },
  });

  const handleFollow = (userIdToFollow) => {
    followMutation.mutate(userIdToFollow);
  };

  const handleDismiss = (userIdToDismiss) => {
    setLocalSuggestions((prev) =>
      prev.map((user) =>
        user.id === userIdToDismiss ? { ...user, animating: true } : user
      )
    );
  };

  return (
    <div className="rightBar">
      <div className="container">
        {/* Suggestions For You */}
        <div className="item">
          <span>Suggestions For You</span>
          <div className="suggestions-list">
            {suggestionsError
              ? `Error loading suggestions: ${
                  suggestionsError.response?.data?.message ||
                  suggestionsError.message
                }`
              : suggestionsLoading
              ? "Loading suggestions..."
              : localSuggestions?.map(
                  (
                    user // Use localSuggestions
                  ) => (
                    <div
                      className={`user ${user.animating ? "animate-out" : ""}`}
                      key={user.localId}
                      onTransitionEnd={(e) => {
                        // Only remove from local state AFTER the opacity transition completes
                        if (e.propertyName === "opacity" && user.animating) {
                          setLocalSuggestions((prev) =>
                            prev.filter((u) => u.id !== user.id)
                          );
                          // Debounce to prevent rapid re-fetches.
                          // This will refetch the "suggestions" query, ensuring new suggestions appear.
                          // This is where the actual backend re-fetch for new suggestions happens.
                          setTimeout(
                            () =>
                              queryClient.invalidateQueries({
                                queryKey: ["suggestions"],
                              }),
                            100
                          );
                        }
                      }}
                    >
                      <div className="userInfo">
                        <img
                          src={
                            getImageSrc(user.profilePic) ||
                            "/upload/default-profile-pic.jpg"
                          }
                          alt=""
                        />
                        <Link
                          to={`/profile/${user.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <span>{user.name}</span>
                        </Link>
                      </div>
                      <div className="buttons">
                        <button
                          onClick={() => handleFollow(user.id)}
                          disabled={followMutation.isPending}
                        >
                          {followMutation.isPending ? "..." : "follow"}
                        </button>
                        <button onClick={() => handleDismiss(user.id)}>
                          dismiss
                        </button>
                      </div>
                    </div>
                  )
                )}
            {(!localSuggestions || localSuggestions.length === 0) &&
              !suggestionsLoading &&
              !suggestionsError && <p>No new suggestions at the moment.</p>}
          </div>
        </div>

        {/* Explore Section - Now for Trending Topics in a Grid */}
        <div className={`item ${highlightExplore ? "highlighted" : ""}`}>
          {" "}
          {/* Added conditional class */}
          <span>Explore: Trending Topics</span>
          <div className="explore-content">
            <div className="trending-tag-list">
              <span className="tag">#AIAdvancements</span>
              <span className="tag">#FutureTech</span>
              <span className="tag">#GlobalEconomy</span>
              <span className="tag">#ClimateAction</span>
              <span className="tag">#SpaceExploration</span>
              <span className="tag">#HealthInnovation</span>
              <span className="tag">#SustainableLiving</span>
              <span className="tag">#GamingWorld</span>
              <span className="tag">#DigitalArt</span>
              <span className="tag">#NewMusic</span>
              <span className="tag">#StartupLife</span>
              <span className="tag">#CyberSecurity</span>
              <span className="tag">#EduTech</span>
              <span className="tag">#FoodTrends</span>
              <span className="tag">#TravelAdventures</span>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className={`item ${highlightNotifications ? "highlighted" : ""}`}>
          {" "}
          {/* Added conditional class */}
          <span>Notifications</span>
          <div className="notifications-content">
            <p className="placeholder-text">
              Your notifications will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightBar;
