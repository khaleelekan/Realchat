// SharedMedia.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import "./sharedMedia.css";

const SharedMedia = ({ userId, onClose }) => {
  const [media, setMedia] = useState([]);

  useEffect(() => {
    const fetchMedia = async () => {
      const mediaRef = collection(db, "media"); // Adjust to your media collection
      const q = query(mediaRef, where("userId", "==", userId)); // Filter by user ID
      const querySnapshot = await getDocs(q);
      const mediaItems = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMedia(mediaItems);
    };

    fetchMedia();
  }, [userId]);

  return (
    <div className="sharedMedia">
      <h2>Shared Media</h2>
      <div className="mediaList">
        {media.map((item) => (
          <div key={item.id} className="mediaItem">
            <img src={item.url} alt="" />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default SharedMedia;
