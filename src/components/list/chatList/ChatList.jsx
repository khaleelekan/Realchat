import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import {  setDoc } from "firebase/firestore";

const updateUserChat = async (userId, chatData) => {
  const userChatsRef = doc(db, "userchats", userId);

  // Check if the document exists
  const docSnap = await getDoc(userChatsRef);
  
  if (docSnap.exists()) {
    // If the document exists, update it
    try {
      await updateDoc(userChatsRef, {
        chats: chatData,
      });
      console.log("Document successfully updated!");
    } catch (err) {
      console.error("Error updating document:", err);
    }
  } else {
    // If the document does not exist, create it with setDoc
    try {
      await setDoc(userChatsRef, {
        chats: chatData,
      });
      console.log("Document successfully created!");
    } catch (err) {
      console.error("Error creating document:", err);
    }
  }
};

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const data = res.data();
        
        // Check if the data and chats exist
        if (data && data.chats) {
          const items = data.chats;
  
          const promises = items.map(async (item) => {
            const userDocRef = doc(db, "users", item.receiverId);
            const userDocSnap = await getDoc(userDocRef);
            const user = userDocSnap.data();
            return { ...item, user };
          });
  
          const chatData = await Promise.all(promises);
          setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        } else {
          // Fallback to empty array if chats is undefined
          setChats([]);
        }
      }
    );
  
    return () => {
      unSub();
    };
  }, [currentUser.id]);
  

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });
  
    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );
  
    userChats[chatIndex].isSeen = true;
  
    try {
      // Call the updateUserChat function here
      await updateUserChat(currentUser.id, userChats);
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log(err);
    }
  };
  

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
          }}
        >
          <img
            src={
              chat.user.blocked.includes(currentUser.id)
                ? "./avatar.png"
                : chat.user.avatar || "./avatar.png"
            }
            alt=""
          />
          <div className="texts">
            <span>
              {chat.user.blocked.includes(currentUser.id)
                ? "User"
                : chat.user.username}
            </span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;
