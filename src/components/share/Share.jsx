import "./share.scss";
import Image from "../../assets/img.png";
import Map from "../../assets/map.png";
import Friend from "../../assets/friend.png";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/authContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";

const Share = () => {
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState("");

  const upload = async () => {
    console.log("--- Starting file upload process (in Share.jsx) ---");
    console.log("File selected for upload:", file);

    if (!file) {
      console.error("No file to upload. Aborting upload function.");
      throw new Error("No file selected for upload.");
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      console.log("FormData created. Appending file...");

      // Optional: You can inspect FormData content for debugging, but it's not always easy to read directly
      // for (let pair of formData.entries()) {
      //     console.log(pair[0]+ ', ' + pair[1]);
      // }

      console.log("Making POST request to backend endpoint: /posts/upload");
      const res = await makeRequest.post("/posts/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(
        "Upload request completed successfully. Backend response data:",
        res.data
      );
      return res.data; // This is expected to be the S3 URL
    } catch (err) {
      console.error("*** FRONTEND ERROR IN UPLOAD FUNCTION (Share.jsx) ***");
      console.error("Error details:", err); // Log the full error object for more info
      console.error("Error response data (if available):", err.response?.data);
      console.error("Error message:", err.message);
      throw err; // Re-throw to be caught by handleClick's try-catch block
    } finally {
      console.log("--- Finished file upload process attempt ---");
    }
  };

  const { currentUser } = useContext(AuthContext);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newPost) => {
      console.log(
        "Making POST request to backend endpoint: /posts (for new post data)",
        newPost
      );
      return makeRequest.post("/posts", newPost);
    },
    onSuccess: () => {
      console.log(
        "Post creation successful. Invalidating 'posts' query to refetch."
      );
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err) => {
      console.error("*** FRONTEND ERROR IN POST MUTATION (Share.jsx) ***");
      console.error("Error details:", err); // Log the full error object
      console.error("Error creating post:", err.response?.data || err.message);
    },
  });

  const handleClick = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    console.log("Share button clicked.");
    console.log("Current description state:", desc);
    console.log("Current file state:", file);

    let imgUrl = ""; // Initialize imgUrl
    if (file) {
      console.log(
        "File detected. Attempting image upload via 'upload()' function..."
      );
      try {
        imgUrl = await upload(); // Call the upload function and await its result
        console.log("Image upload completed. Received S3 URL:", imgUrl);
      } catch (uploadError) {
        console.error(
          "Image upload failed in handleClick's try-catch. Not proceeding with post creation."
        );
        // Optionally, provide user feedback here (e.g., set an error state to display a message)
        return; // Important: Stop the function if image upload fails
      }
    } else {
      console.log("No file selected. Proceeding with text-only post creation.");
    }

    console.log(
      "Attempting to create post with description and final imgUrl:",
      { description: desc, img: imgUrl }
    );
    mutation.mutate({ description: desc, img: imgUrl }); // Trigger the post creation mutation
    console.log("Post creation mutation triggered. UI should update soon.");

    // Reset form fields after initiating the post
    setDesc("");
    setFile(null);
    console.log("Share input fields reset: description and file cleared.");
  };

  // Helper function for image sources (can be moved to a utility file if needed)
  // This is for displaying existing profile/cover pics, not for the share component's own file preview
  const getImageSrc = (imagePath) => {
    if (!imagePath) {
      return null;
    }
    // If it starts with http/https, it's an S3 URL or external URL
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    // This case should ideally not happen if all images are S3 uploaded and stored as full URLs.
    // If you still have local file paths in DB, keep the /upload/ prefix for backward compatibility.
    // For a full S3 migration, this part could eventually be removed if all DB paths are S3 URLs.
    return "/upload/" + imagePath;
  };

  return (
    <div className="share">
      <div className="container">
        <div className="top">
          <div className="left">
            <img
              src={
                getImageSrc(currentUser.user?.profilePic) ||
                "default-profile-pic.jpg"
              } // Use getImageSrc for user's profile pic
              alt=""
            />
            <input
              type="text"
              placeholder={`What's on your mind ${currentUser.user?.name}?`}
              onChange={(e) => setDesc(e.target.value)}
              value={desc}
            />
          </div>
          <div className="right">
            {file && (
              // Display a preview of the selected image
              <img className="file" alt="" src={URL.createObjectURL(file)} />
            )}
          </div>
        </div>
        <hr />
        <div className="bottom">
          <div className="left">
            <input
              type="file"
              id="file"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0])}
            />
            <label htmlFor="file">
              <div className="item">
                <img src={Image} alt="" />
                <span>Add Image</span>
              </div>
            </label>
            <div className="item">
              <img src={Map} alt="" />
              <span>Add Place</span>
            </div>
            <div className="item">
              <img src={Friend} alt="" />
              <span>Tag Friends</span>
            </div>
          </div>
          <div className="right">
            <button onClick={handleClick}>Share</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Share;
