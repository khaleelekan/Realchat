import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import upload from "../../lib/upload";

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });

  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState(true); // Track whether to show login or registration

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);

    const { username, email, password } = Object.fromEntries(formData);

    // VALIDATE INPUTS
    if (!username || !email || !password) {
      toast.warn("All fields are required!");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warn("Invalid email format!");
      setLoading(false);
      return;
    }

    // Password validation (min 6 characters)
    if (password.length < 6) {
      toast.warn("Password must be at least 6 characters!");
      setLoading(false);
      return;
    }

    if (!avatar.file) {
      toast.warn("Please upload an avatar!");
      setLoading(false);
      return;
    }

    // VALIDATE UNIQUE USERNAME
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.warn("Select another username");
      setLoading(false);
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const imgUrl = await upload(avatar.file);

      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar: imgUrl,
        id: res.user.uid,
        blocked: [],
      });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success("Account created! You can log in now!");
      e.target.reset(); // Clear form fields on success
      setAvatar({ file: null, url: "" }); // Reset avatar
    } catch (err) {
      console.error(err);
      // Custom error handling for specific cases
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email already in use! Please use a different email.");
      } else if (err.code === "auth/weak-password") {
        toast.error("The password is too weak! Please choose a stronger password.");
      } else {
        toast.error("Registration failed! Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!"); // Indicate successful login
      e.target.reset(); // Clear form fields on success
    } catch (err) {
      console.error(err);
      // Custom error handling for specific cases
      if (err.code === "auth/wrong-password") {
        toast.error("Wrong password! Please try again.");
      } else if (err.code === "auth/user-not-found") {
        toast.error("No user found with this email! Please register.");
      } else {
        toast.error("Login failed! Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="item">
        <h2>{loginMode ? "Welcome back," : "Create an Account"}</h2>
        <form onSubmit={loginMode ? handleLogin : handleRegister}>
          {!loginMode && (
            <label htmlFor="file">
              <img src={avatar.url || "./avatar.png"} alt="avatar" />
              Upload an image
            </label>
          )}
          {!loginMode && (
            <input
              type="file"
              id="file"
              style={{ display: "none" }}
              onChange={handleAvatar}
            />
          )}
          {!loginMode && <input type="text" placeholder="Username" name="username" required />}
          <input type="text" placeholder="Email" name="email" required />
          <input type="password" placeholder="Password" name="password" required />
          <button disabled={loading}>{loading ? "Loading..." : loginMode ? "Sign In" : "Sign Up"}</button>
        </form>
        <button onClick={() => setLoginMode(!loginMode)}>
          {loginMode ? "Create an Account" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
};

export default Login;

