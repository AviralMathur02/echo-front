// client/src/components/post/Post.jsx

import "./post.scss";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import TextsmsOutlinedIcon from "@mui/icons-material/TextsmsOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Link } from "react-router-dom";
import Comments from "../comments/Comments";
import { useState } from "react";
import moment from "moment";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import { getImageSrc } from "../../utils/imageUtils";

// Accept onOpenComingSoonModal as a prop
const Post = ({ post, onOpenComingSoonModal }) => {
  const [commentOpen, setCommentOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { currentUser } = useContext(AuthContext);

  const { isLoading, data } = useQuery({
    queryKey: ["likes", post.id],
    queryFn: () =>
      makeRequest.get("/likes?postId=" + post.id).then((res) => {
        return res.data;
      }),
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (liked) => {
      if (liked) return makeRequest.delete("/likes?postId=" + post.id);
      return makeRequest.post("/likes", { postId: post.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["likes"] });
    },
    onError: (err) => {
      console.error(
        "Error liking/unliking post:",
        err.response?.data || err.message
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId) => {
      return makeRequest.delete("/posts/" + postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err) => {
      console.error("Error deleting post:", err.response?.data || err.message);
    },
  });

  const handleLike = () => {
    if (!currentUser || !currentUser.user) {
      console.warn("Attempted to like/unlike without current user data.");
      return;
    }
    mutation.mutate(data?.includes(currentUser.user.id));
  };

  const handleDelete = () => {
    if (!currentUser || !currentUser.user) {
      console.warn("Attempted to delete post without current user data.");
      return;
    }
    deleteMutation.mutate(post.id);
  };

  // Handle Share button click - now passes 'sharing' as the message type
  const handleShareClick = () => {
    onOpenComingSoonModal("sharing"); // Pass 'sharing' to indicate the message type
  };

  return (
    <div className="post">
      <div className="container">
        <div className="user">
          <div className="userInfo">
            <img
              src={
                getImageSrc(post.profilePic) ||
                "/upload/default-profile-pic.jpg"
              }
              alt=""
            />
            <div className="details">
              <Link
                to={`/profile/${post.userId}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span className="name">{post.name}</span>
              </Link>
              <span className="date">{moment(post.createdAt).fromNow()}</span>
            </div>
          </div>
          <MoreHorizIcon onClick={() => setMenuOpen(!menuOpen)} />
          {menuOpen &&
            currentUser &&
            currentUser.user &&
            post.userId === currentUser.user.id && (
              <button onClick={handleDelete}>delete</button>
            )}
        </div>
        <div className="content">
          <p>{post.description}</p>
          <img src={getImageSrc(post.img)} alt="" />
        </div>
        <div className="info">
          <div className="item">
            {isLoading ? (
              "loading"
            ) : data &&
              currentUser &&
              currentUser.user &&
              data.includes(currentUser.user.id) ? (
              <FavoriteOutlinedIcon
                style={{ color: "red" }}
                onClick={handleLike}
              />
            ) : (
              <FavoriteBorderOutlinedIcon onClick={handleLike} />
            )}
            {data?.length} Likes
          </div>
          <div className="item" onClick={() => setCommentOpen(!commentOpen)}>
            <TextsmsOutlinedIcon />
            See Comments
          </div>
          {/* MODIFIED: Share item now triggers modal with 'sharing' type */}
          <div
            className="item"
            onClick={handleShareClick}
            style={{ cursor: "pointer" }}
          >
            <ShareOutlinedIcon />
            Share
          </div>
        </div>
        {commentOpen && <Comments postId={post.id} />}
      </div>
    </div>
  );
};

export default Post;
