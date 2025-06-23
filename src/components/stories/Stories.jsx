import { useContext, useState } from "react";
import "./stories.scss";
import { AuthContext } from "../../context/authContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios"; // Assuming makeRequest is now the axios instance

const Stories = () => {
  const [file, setFile] = useState(null); // State for the selected story image file
  const { currentUser } = useContext(AuthContext);

  // --- START Change for useQuery v5 ---
  const { isLoading, error, data } = useQuery({
    queryKey: ["stories"],
    queryFn: () =>
      makeRequest.get("/stories").then((res) => {
        return res.data;
      }),
  });
  // --- END Change for useQuery v5 ---

  const queryClient = useQueryClient();

  const upload = async () => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      // This endpoint needs to be implemented in your Spring Boot backend for file uploads.
      const res = await makeRequest.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data; // Assuming res.data is the URL/filename of the uploaded image
    } catch (err) {
      console.error(
        "Error uploading story image:",
        err.response?.data || err.message
      );
      throw err;
    }
  };

  // --- START Change for useMutation v5 ---
  const addStoryMutation = useMutation({
    mutationFn: (newStory) => {
      return makeRequest.post("/stories", newStory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      setFile(null); // Clear the selected file after successful upload
    },
    onError: (err) => {
      console.error("Error creating story:", err.response?.data || err.message);
    },
  });
  // --- END Change for useMutation v5 ---

  const handleAddStory = async (e) => {
    e.preventDefault();
    if (file) {
      try {
        const imgUrl = await upload();
        addStoryMutation.mutate({ img: imgUrl }); // Match Spring Boot's AddStoryRequest DTO
      } catch (uploadError) {
        // Error already logged in upload function
      }
    } else {
      alert("Please select an image for your story.");
    }
  };

  return (
    <div className="stories">
      <div className="story">
        {/* Access profilePic from currentUser.user */}
        <img
          src={
            currentUser.user?.profilePic
              ? "/upload/" + currentUser.user.profilePic
              : "default-profile-pic.jpg"
          }
          alt=""
        />
        {/* Access name from currentUser.user */}
        <span>{currentUser.user?.name}</span>
        {/* File input for adding a story */}
        <input
          type="file"
          id="storyFile"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files[0])}
        />
        <label htmlFor="storyFile">
          <button>+</button>
        </label>
        {file && <button onClick={handleAddStory}>Add Story</button>}{" "}
        {/* Button to trigger upload */}
      </div>
      {error
        ? `Something went wrong! Error: ${
            error.response?.data || error.message
          }`
        : isLoading
        ? "loading"
        : data && data.length > 0
        ? data.map((story) => (
            <div className="story" key={story.id}>
              {/* Ensure story.img path is correct */}
              <img
                src={story.img ? "/upload/" + story.img : "default-story.jpg"}
                alt=""
              />
              <span>{story.name}</span>{" "}
              {/* Assuming story object includes 'name' of the user */}
            </div>
          ))
        : "No stories found."}
    </div>
  );
};

export default Stories;
