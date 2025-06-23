import { useContext, useState } from "react";
import "./comments.scss";
import { AuthContext } from "../../context/authContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios"; // Assuming makeRequest is now the axios instance
import moment from "moment";

const Comments = ({ postId }) => {
  const [desc, setDesc] = useState("");
  const { currentUser } = useContext(AuthContext);

  // --- START Change for useQuery v5 ---
  const { isLoading, error, data } = useQuery({
    queryKey: ["comments", postId], // Add postId to query key
    queryFn: () =>
      makeRequest.get("/comments?postId=" + postId).then((res) => {
        return res.data;
      }),
  });
  // --- END Change for useQuery v5 ---

  const queryClient = useQueryClient();

  // --- START Change for useMutation v5 ---
  const mutation = useMutation({
    mutationFn: (newComment) => {
      // Ensure 'description' key matches Spring Boot DTO (AddCommentRequest)
      return makeRequest.post("/comments", newComment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] }); // Invalidate with postId
    },
    onError: (err) => {
      console.error("Error adding comment:", err.response?.data || err.message);
    },
  });
  // --- END Change for useMutation v5 ---

  const handleClick = async (e) => {
    e.preventDefault();
    // Ensure 'description' key for the request body
    mutation.mutate({ description: desc, postId });
    setDesc("");
  };

  return (
    <div className="comments">
      <div className="write">
        {/* Access profilePic from currentUser.user */}
        <img
          src={
            currentUser.user?.profilePic
              ? "/upload/" + currentUser.user.profilePic
              : "default-profile-pic.jpg" // Fallback image
          }
          alt=""
        />
        <input
          type="text"
          placeholder="write a comment"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button onClick={handleClick}>Send</button>
      </div>
      {error
        ? `Something went wrong! Error: ${
            error.response?.data || error.message
          }`
        : isLoading
        ? "loading"
        : data && data.length > 0
        ? data.map((comment) => (
            <div className="comment" key={comment.id}>
              {" "}
              {/* Add key for list rendering */}
              {/* Ensure comment.profilePic path is correct */}
              <img
                src={
                  comment.profilePic
                    ? "/upload/" + comment.profilePic
                    : "default-profile-pic.jpg"
                }
                alt=""
              />
              <div className="info">
                <span>{comment.name}</span>
                <p>{comment.description}</p>{" "}
                {/* Changed from comment.desc to comment.description */}
              </div>
              <span className="date">
                {moment(comment.createdAt).fromNow()}
              </span>
            </div>
          ))
        : "No comments yet."}{" "}
      {/* Handle empty comments case */}
    </div>
  );
};

export default Comments;
