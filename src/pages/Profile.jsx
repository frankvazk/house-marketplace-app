import React, { useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const Profile = () => {
  const auth = getAuth();
  const [userName, setUserName] = useState(null);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setUserName(user);
    }
  });

  return userName ? <h1>{userName.displayName}</h1> : <h1>Profile</h1>;
};

export default Profile;
