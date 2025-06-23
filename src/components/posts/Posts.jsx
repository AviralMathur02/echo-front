// client/src/components/posts/Posts.jsx

import Post from "../post/Post";
import "./posts.scss";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../../axios";

// Accept onOpenComingSoonModal as a prop
const Posts = ({ userId, onOpenComingSoonModal }) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ["posts", userId],
    queryFn: () =>
      makeRequest
        .get("/posts" + (userId ? "?userId=" + userId : ""))
        .then((res) => {
          return res.data;
        }),
  });

  return (
    <div className="posts">
      {error ? (
        <span className="no-posts-message">
          Error loading posts: {error.response?.data?.message || error.message}
        </span>
      ) : isLoading ? (
        <span className="no-posts-message">Loading posts...</span>
      ) : data.length === 0 ? (
        <span className="no-posts-message">No posts found.</span>
      ) : (
        // Pass onOpenComingSoonModal to each Post
        data.map((post) => (
          <Post
            post={post}
            key={post.id}
            onOpenComingSoonModal={onOpenComingSoonModal}
          />
        ))
      )}
    </div>
  );
};

export default Posts;
