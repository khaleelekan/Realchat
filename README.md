#RealChat
RealChat is a fully functional chat application built with React, Firebase Authentication, Firestore, and Zustand for state management. Users can register, log in, and engage in real-time conversations with other users. The app also features avatar upload, unique username validation, and seamless real-time updates.
It was developed as the final portfolio project for the ALX Software Engineering program in collaboration with Gugu Mthembu. Users can register, log in, and engage in real-time conversations, with features like avatar upload and unique username validation.


Table of Contents

Features
Tech Stack
Usage
Project Structure
Contributing

Features
User Authentication: Sign up and log in using email and password.
Real-time Chat: Engage in real-time chat with other users.
Unique Username Validation: Ensure no duplicate usernames.
Avatar Upload: Upload and display user avatars.
Firestore Integration: Save user data and chat history in Firestore.
Notifications: Receive user-friendly notifications for events like errors or successful actions.
Loading States: Proper feedback during login, registration, and data loading processes.

Tech Stack
Frontend: React, Zustand, React Toastify, CSS
Backend: Firebase Authentication, Firebase Firestore
State Management: Zustand
Notifications: React Toastify

Chat Interface

Project Structure
bash
Copy code
├── public
│   └── index.html
├── src
│   ├── components
│   │   ├── chat
│   │   │   └── Chat.js
│   │   ├── detail
│   │   │   └── Detail.js
│   │   ├── list
│   │   │   └── List.js
│   │   └── login
│   │       └── Login.js
│   ├── lib
│   │   ├── firebase.js
│   │   ├── userStore.js
│   │   └── chatStore.js
│   ├── App.js
│   ├── index.js
│   └── styles
│       └── login.css
└── package.json

Key Folders:
components: Contains the UI components for chat, login, chat details, and chat listing.
lib: Firebase configuration and state management logic (e.g., userStore.js and chatStore.js).
styles: Contains CSS styles for different components.
Contributing
Contributions are welcome! Feel free to open issues or submit pull requests for new features, improvements, or bug fixes.

Steps to Contribute
Fork the repository.
Create a new branch for your changes.
Make your changes.
Open a pull request with a description of the changes.

