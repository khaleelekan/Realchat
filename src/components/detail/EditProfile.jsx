
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import "./editProfile.css";

const EditProfile = ({ user, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar || "");

  const handleSave = async () => {
    const userDocRef = doc(db, "users", user.id);
    try {
      await updateDoc(userDocRef, {
        username,
        avatar,
      });
      onClose(); // Close the modal after saving
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="editProfile">
      <h2>Edit Profile</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="text"
        placeholder="Avatar URL"
        value={avatar}
        onChange={(e) => setAvatar(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default EditProfile;
