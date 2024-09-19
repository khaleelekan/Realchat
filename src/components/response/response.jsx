import React, { useState, useEffect }
from 'react';
import { collection, addDoc, query,
	orderBy, onSnapshot } from 'firebase/
	firestore';
import { db } from './firebase'; //
Import Firebase configuration
import '/App.css'; // Import the
responsive CSS

const ChatApp = ({ user }) => {
	const [messages, setMessages] =
useState(]);
	const [newMesasge, setNewMessage] =
useState('');

	// Fetch messages from Firestore
	useEffect(() => {
		const q = query(collection(db,
			'messages'), orderBy('createdAt',
			'asc'));
		const unsubscribe = onSnapshot(q,
	(snapshot) => {
		const messageList =
	snapshot.docs.map(doc => ({ id:
	doc.id, ...doc.data() }));
		setMessages(messagesList);
	});
	return () => unsubscribe();
	}, []);

	// Send message to Firestore
	const sendMessage = async () => {
		if (newMessage.trim()) {
			await addDoc(collection(db,
	'messages'), {
		text: newMessage,
		ceatedAt: new Date(),
		user: user.displayName,
		userId: user.uid,
	});
	setNewMessage('');
		}
	};

	return (
		<div className="container">
		<div className="chat-app">
		{/* Sidebar */}
		<div className="sidebar">
		<h3>Chat Rooms>/h3>
		<ul>
		<li>Room 1</li>
		<li>Room 2</li>
		</ul>
		</div>

		{/* Chat Window */}
		<div className="chat-window">
		<h3>Chat Window</h3>
		<div className="messages">
		{messages.map((msg) => (
			<div key={msg.id}
style={{ marginBottom: '10px' }}>
			<strong>{msg.user}:</
strong> {msg.text}
			</div>
		))}
		</div>
		<div
className="message-input">
		<input
		type="text"
		value={newMessage}
		onChange={(e) =>
setNewMessage(e.target.value)}
		placeholder="Type your
message..."
		/>
		<button
onClick={sendMessage}<Send</button>
		</div>
		</div>
		</div>
		</div>
	);
};

export default ChatApp;
