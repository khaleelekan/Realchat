import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css";
import { useState } from "react";
import EditProfile from "./EditProfile"; // Create a separate component for editing profile
import SharedMedia from "./SharedMedia"; // Create a separate component for viewing shared media
import ConfirmDialog from "./ConfirmDialog"; // Create a confirmation dialog component

const Detail = () => {
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, resetChat } =
    useChatStore();
  const { currentUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isMediaVisible, setIsMediaVisible] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleBlock = async () => {
    if (!user) return;

    const userDocRef = doc(db, "users", currentUser.id);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    resetChat();
  };

  const toggleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  const toggleSharedMedia = () => {
    setIsMediaVisible(!isMediaVisible);
  };

  const handleConfirmBlock = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmBlockAction = async (confirm) => {
    if (confirm) {
      await handleBlock();
    }
    setShowConfirmDialog(false);
  };

  if (!user) return null; // Prevent rendering if user does not exist

  return (
    <div className="detail">
      <div className="user">
        <img src={user.avatar || "./avatar.png"} alt={`${user.username}'s avatar`} />
        <h2>{user.username}</h2>
        <p>
    {user.isOnline
      ? "Online"
      : user.lastSeen
      ? `Last seen: ${new Date(user.lastSeen.seconds * 1000).toLocaleString()}`
      : "Offline"}
  </p> {/* Show online status */}
      </div>
      <div className="info">
        <div className="option" onClick={toggleEditProfile}>
          <div className="title">
            <span>Edit Profile</span>
            <img src="./arrowUp.png" alt="Toggle edit profile" />
          </div>
        </div>
        <div className="option" onClick={toggleSharedMedia}>
          <div className="title">
            <span>Shared Media</span>
            <img src="./arrowDown.png" alt="Toggle shared media" />
          </div>
        </div>
        <button onClick={handleConfirmBlock}>
          {isCurrentUserBlocked
            ? "You are Blocked!"
            : isReceiverBlocked
            ? "Unblock User"
            : "Block User"}
        </button>
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      {isEditing && <EditProfile user={user} onClose={toggleEditProfile} />}
      {isMediaVisible && <SharedMedia userId={user.id} onClose={toggleSharedMedia} />}
      {showConfirmDialog && (
        <ConfirmDialog
          message="Are you sure you want to block this user?"
          onConfirm={handleConfirmBlockAction}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
    </div>
  );
};

export default Detail;

