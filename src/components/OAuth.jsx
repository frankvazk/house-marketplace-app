import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import googleIcon from "../assets/svg/googleIcon.svg";

const OAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const onGoogleClick = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      //Check for user in Authentication
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      //Check if user exists in DB. If not create it
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          timestamp: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          timestamp: serverTimestamp(),
        });
      }

      navigate("/");
    } catch (error) {
      toast.error("");
    }
  };

  return (
    <div className="socialLogin">
      <p>
        Sign {location.pathname === "/sign-in" ? "In" : "Up"} with
        <button className="socialIconDiv" onClick={onGoogleClick}>
          <img src={googleIcon} alt="Google Icon" className="socialIconImg" />
        </button>
      </p>
    </div>
  );
};

export default OAuth;
