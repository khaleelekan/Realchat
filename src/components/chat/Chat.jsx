import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {FaUserCircle} from "react-icons/fa"; // Import an arrow icon
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import { toast } from "react-toastify";

const Chat = ({ onShowChatList }) => { // Add a prop to handle showing chat list
  const [chat, setChat] = useState({ messages: [] });
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null);

  // Scroll to the last message when a new message is added
  useEffect(() => {
    if (chat.messages.length > 0 && chat.messages[chat.messages.length - 1]?.senderId !== currentUser?.id) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat.messages]);

  // Listen to chat updates in real-time
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      if (res.exists()) {
        setChat(res.data());
      } else {
        console.log("Chat document does not exist");
      }
    });
    return () => unSub();
  }, [chatId]);

  // Add emoji to the text input
  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  // Handle image capture and size limit (5MB max)
  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5000000) { // 5MB size limit
      setImg({
        file: file,
        url: URL.createObjectURL(file),
      });
    } else {
      toast.error("Image size exceeds 5MB.");
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImg({ file: null, url: "" });
  };

  // Handle message sending
  const handleSend = async () => {
    if (text === "" && !img.file) return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      const userIDs = [currentUser.id, user.id];
      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);
        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);
          if (chatIndex !== -1) {
            userChatsData.chats[chatIndex].lastMessage = text || "Image sent";
            userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
            userChatsData.chats[chatIndex].updatedAt = Date.now();
            await updateDoc(userChatsRef, { chats: userChatsData.chats });
          }
        }
      });

      toast.success("Message sent successfully!");

      // Scroll to the last message after sending
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message!");
    } finally {
      setImg({ file: null, url: "" });
      setText("");
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="User avatar" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>Active now</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone" aria-label="Start phone call" />
          <img src="./video.png" alt="Video" aria-label="Start video call" />
          <img src="./info.png" alt="View chat information" aria-label="Chat info" />
  <FaUserCircle size={20} color="white" />
        </div>
      </div>
      <div className="center">
        {chat.messages.map((message) => (
          <div
            className={message.senderId === currentUser?.id ? "message own" : "message"}
            key={message?.createdAt}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="Message media" />}
              <p>{message.text}</p>
              {message.createdAt && (
                <span>{format(message.createdAt.toDate ? message.createdAt.toDate() : new Date())}</span>
              )}
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="Selected preview" />
              <button onClick={removeImage} className="removeImg">Remove</button>
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="Upload" aria-label="Upload image" />
          </label>
          <input
            type="file"
            id="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageCapture}
          />
          <label htmlFor="camera">
            <img src="./camera.png" alt="Camera" aria-label="Take photo" />
          </label>
          <input
            type="file"
            id="camera"
            accept="image/*"
            capture="camera"
            style={{ display: "none" }}
            onChange={handleImageCapture}
          />
          <img src="./mic.png" alt="Mic" aria-label="Record voice message" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
          aria-label="Type your message"
        />
        <div className="emoji">
          <img src="./emoji.png" alt="Emoji" aria-label="Add emoji" onClick={() => setOpen((prev) => !prev)} />
          {open && <EmojiPicker onEmojiClick={handleEmoji} />}
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;







