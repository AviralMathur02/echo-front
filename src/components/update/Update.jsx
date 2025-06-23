import { useState } from "react";
import { makeRequest } from "../../axios";
import "./update.scss";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
 
// IMPORTANT CHANGE: Accept currentUser as a prop
const Update = ({ setOpenUpdate, user, currentUser }) => {
  const [cover, setCover] = useState(null);
  const [profile, setProfile] = useState(null);
 
  // Initialize texts with id from currentUser.user.id
  // Pre-fill existing user data for editing
  const [texts, setTexts] = useState({
    id: currentUser.user.id, // Ensure the correct ID is always sent for backend authorization
    email: user.email,
    password: "", // Password typically handled separately or left blank for no change
    name: user.name,
    city: user.city,
    websiteName: user.websiteName || "", // Initialize with existing data or empty string
    websiteUrl: user.websiteUrl || "", // Initialize with existing data or empty string
  });
 
  // Function to upload a file to S3 and return ONLY the S3 key/path.
  // This assumes your backend's /upload endpoint returns a string like:
  // "File uploaded successfully. File path: <S3_OBJECT_KEY_HERE>"
  const upload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await makeRequest.post("/upload", formData);
      const responseString = res.data; // Get the full response string
 
      // --- FIX: Extract only the S3 object key from the response string ---
      const prefix = "File uploaded successfully. File path: ";
      if (responseString.startsWith(prefix)) {
        return responseString.substring(prefix.length); // Return only the S3 key
      }
      console.warn("Upload response did not match expected format:", responseString);
      return responseString; // Fallback: return the original response if format unexpected
    } catch (err) {
      console.error("Error during file upload:", err);
      // It's good practice to re-throw or return a specific error here
      throw err; // Re-throw the error so handleSubmit can catch it
    }
  };
 
  const handleChange = (e) => {
    setTexts((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
 
  const queryClient = useQueryClient();
 
  const mutation = useMutation({
    mutationFn: (userUpdateData) => { // Renamed 'user' to 'userUpdateData' for clarity
      return makeRequest.put("/users", userUpdateData);
    },
    onSuccess: () => {
      // Invalidate and refetch user query to reflect changes on profile page
      queryClient.invalidateQueries({ queryKey: ["user", currentUser.user.id] }); // Invalidate specific user's data
      // Also invalidate the currentUser data in AuthContext if it's the current user's profile being updated
      // This is important if profilePic/coverPic are cached in AuthContext for navbar/leftbar
      queryClient.invalidateQueries({ queryKey: ["currentUser"] }); // Assuming AuthContext user is part of 'currentUser' query
      setOpenUpdate(false); // Close the update modal
      alert("Profile updated successfully!"); // Provide success feedback
    },
    onError: (error) => {
      console.error(
        "Error updating profile:",
        error.response?.data?.message || error.message
      );
      alert(
        "Failed to update profile: " + (error.response?.data?.message || "Unknown error occurred.")
      );
    },
  });
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    let coverUrl = user.coverPic;
    let profileUrl = user.profilePic;
 
    try {
      // Only upload if a new file is selected
      if (cover) {
        console.log("Uploading new cover picture...");
        coverUrl = await upload(cover);
        console.log("New cover URL/Key obtained:", coverUrl);
      }
      if (profile) {
        console.log("Uploading new profile picture...");
        profileUrl = await upload(profile);
        console.log("New profile URL/Key obtained:", profileUrl);
      }
 
      // Ensure the correct ID is passed with the update
      const updatePayload = {
        ...texts,
        coverPic: coverUrl,
        profilePic: profileUrl,
        // Make sure `id` is part of the payload, it's already in `texts`
      };
      console.log("Sending update payload:", updatePayload);
      mutation.mutate(updatePayload);
    } catch (uploadError) {
      console.error("Image upload failed:", uploadError);
      alert("Image upload failed. Please try again.");
      // Do not proceed with profile update if image upload fails
    }
  };
 
  return (
    <div className="update">
      <div className="wrapper">
        <h1>Update Your Profile</h1>
        <form>
          <div className="files">
            <label htmlFor="cover">
              <span>Cover Picture</span>
              <div className="imgContainer">
                <img
                  src={
                    cover
                      ? URL.createObjectURL(cover) // Preview new local file
                      : user.coverPic // Use existing S3 key
                      ? `https://echobackendstorage.s3.ap-south-1.amazonaws.com/${user.coverPic}` // Construct full URL for existing S3 key
                      : "https://images.pexels.com/photos/13440765/pexels-photo-13440765.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // Default placeholder
                  }
                  alt=""
                />
                <CloudUploadIcon className="icon" />
              </div>
            </label>
            <input
              type="file"
              id="cover"
              style={{ display: "none" }}
              onChange={(e) => setCover(e.target.files[0])}
            />
            <label htmlFor="profile">
              <span>Profile Picture</span>
              <div className="imgContainer">
                <img
                  src={
                    profile
                      ? URL.createObjectURL(profile) // Preview new local file
                      : user.profilePic // Use existing S3 key
                      ? `https://echobackendstorage.s3.ap-south-1.amazonaws.com/${user.profilePic}` // Construct full URL for existing S3 key
                      : "https://images.pexels.com/photos/14028501/pexels-photo-14028501.jpeg?auto=compress&cs=tinysrgb&w=1600&lazy=load" // Default placeholder
                  }
                  alt=""
                />
                <CloudUploadIcon className="icon" />
              </div>
            </label>
            <input
              type="file"
              id="profile"
              style={{ display: "none" }}
              onChange={(e) => setProfile(e.target.files[0])}
            />
          </div>
          <label>Email</label>
          <input
            type="text"
            value={texts.email}
            name="email"
            onChange={handleChange}
            disabled // Email usually not updatable via this form without re-authentication
          />
          <label>Password</label>
          <input
            type="password"
            value={texts.password}
            name="password"
            onChange={handleChange}
            placeholder="Leave blank to keep current password"
          />
          <label>Name</label>
          <input
            type="text"
            value={texts.name}
            name="name"
            onChange={handleChange}
          />
          <label>Country / City</label>
          <input
            type="text"
            name="city"
            value={texts.city}
            onChange={handleChange}
          />
          <label>Website Name</label>
          <input
            type="text"
            name="websiteName"
            value={texts.websiteName}
            onChange={handleChange}
            placeholder="e.g., My Portfolio"
          />
          <label>Website URL</label>
          <input
            type="text"
            name="websiteUrl"
            value={texts.websiteUrl}
            onChange={handleChange}
            placeholder="e.g., https://www.example.com"
          />
          <button onClick={handleSubmit}>Update</button>
        </form>
        <button className="close" onClick={() => setOpenUpdate(false)}>
          close
        </button>
      </div>
    </div>
  );
};
 
export default Update;