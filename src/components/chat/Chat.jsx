import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import { toast } from "react-toastify";

const Chat = () => {
  const [chat, setChat] = useState({ messages: [] });
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [voice, setVoice] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      if (res.exists()) {
        setChat(res.data());
      } else {
        console.log("Chat document does not exist");
      }
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  const handleKeyPress = () => {
    setTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeoutId = setTimeout(() => {
      setTyping(false);
    }, 2000);
    setTypingTimeout(timeoutId);
  };

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if (text === "" && !img.file && !voice) return;

    let imgUrl = null;
    let voiceUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      if (voice) {
        voiceUrl = await upload(voice);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          id: Date.now(),
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
          ...(voiceUrl && { voice: voiceUrl }),
        }),
      });
    } catch (err) {
      console.log(err);
    } finally {
      setImg({ file: null, url: "" });
      setText("");
      setVoice(null);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    toast.info("Recording started...", { autoClose: 2000 });
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (event) => {
        const audioBlob = new Blob([event.data], { type: "audio/wav" });
        setVoice(audioBlob);
      };

      recorder.start();
      recorder.onstop = () => {
        setIsRecording(false);
      };
    });
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  const handleDeleteMessage = async (message) => {
    try {
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayRemove(message),
      });
      setDeleteMessageId(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDoubleClick = (messageId) => {
    setDeleteMessageId(deleteMessageId === messageId ? null : messageId);
  };

  const handleCameraCapture = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handlePhoneClick = () => {
    // Placeholder for phone functionality
    console.log("Phone icon clicked: Initiating call...");
    toast.info("Initiating call...", { autoClose: 2000 });
  };

  const handleVideoClick = () => {
    // Placeholder for video call functionality
    console.log("Video icon clicked: Starting video call...");
    toast.info("Starting video call...", { autoClose: 2000 });
  };

  const handleInfoClick = () => {
    setShowInfoModal(true);
  };

  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>{typing && "User is typing..."}</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" onClick={handlePhoneClick} />
          <img src="./video.png" alt="" onClick={handleVideoClick} />
          <img src="./info.png" alt="" onClick={handleInfoClick} />
        </div>
      </div>
      <div className="center">
        {chat.messages.map((message) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message own" : "message"
            }
            key={message.createdAt}
            onDoubleClick={() => handleDoubleClick(message.id)}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              {message.voice && <audio controls src={message.voice} />}
              <p>{message.text}</p>
              <span>{format(message.createdAt.toDate())}</span>
              {deleteMessageId === message.id && (
                <button onClick={() => handleDeleteMessage(message)}>Delete</button>
              )}
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <label htmlFor="camera">
            <img src="./camera.png" alt="" />
          </label>
          <input
            type="file"
            id="camera"
            style={{ display: "none" }}
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
          />
          <img
            src="./mic.png"
            alt=""
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
          />
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
          onKeyPress={handleKeyPress}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>

      {showInfoModal && (
        <div className="info-modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseInfoModal}>
              &times;
            </span>
            <h2>Chat Info</h2>
            <p>Chat ID: {chatId}</p>
            <p>User: {user?.username}</p>
            {/* Add more information as needed */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;



