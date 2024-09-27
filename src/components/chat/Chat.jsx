import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import { toast } from "react-toastify";
import { FaUserCircle } from "react-icons/fa"; // Contact icon
import ChatList from "../list/chatList/ChatList"; // Assuming ChatList component is in the same directory

const Chat = () => {
  const [chat, setChat] = useState({ messages: [] });
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [showChatList, setShowChatList] = useState(false); // State to control modal visibility

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
    if (file && file.size <= 5000000) {
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
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>Active now</p>
          </div>
        </div>
        <div className="icons">
          <FaUserCircle
            size={20}
            color="white"
            style={{ cursor: "pointer" }}
            onClick={() => setShowChatList(true)} // Show modal on icon click
            className="chatlist-icon" // Add class for media query control
          />
          <img src="./phone.png" alt="Phone" />
          <img src="./video.png" alt="Video" />
          <img src="./info.png" alt="Info" />
        </div>
      </div>

      {/* Modal for ChatList */}
      {showChatList && (
        <div className="chatlist-modal">
          <div className="modal-overlay" onClick={() => setShowChatList(false)}></div> {/* Background overlay */}
          <div className="modal-content">
            <span className="close" onClick={() => setShowChatList(false)}>×</span> {/* Close button */}
            <ChatList /> {/* Chat list component */}
          </div>
        </div>
      )}

      <div className="center">
        {chat.messages.map((message) => (
          <div
            className={message.senderId === currentUser?.id ? "message own" : "message"}
            key={message?.createdAt}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="message media" />}
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
            <img src="./img.png" alt="Upload" />
          </label>
          <input
            type="file"
            id="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageCapture}
          />
          <label htmlFor="camera">
            <img src="./camera.png" alt="Camera" />
          </label>
          <input
            type="file"
            id="camera"
            accept="image/*"
            capture="camera"
            style={{ display: "none" }}
            onChange={handleImageCapture}
          />
          <img src="./mic.png" alt="Mic" />
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
        />
        <div className="emoji">
          <img src="./emoji.png" alt="Emoji" onClick={() => setOpen((prev) => !prev)} />
          {open && <EmojiPicker onEmojiClick={handleEmoji} />}
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;








