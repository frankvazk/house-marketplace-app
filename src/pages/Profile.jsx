import React, { useState, useEffect } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import {
  updateDoc,
  doc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import arrowRight from "../assets/svg/keyboardArrowRightIcon.svg";
import homeIcon from "../assets/svg/homeIcon.svg";
import ListingItem from "../components/ListingItem";

const Profile = () => {
  const auth = getAuth();
  const [formData, setFormData] = useState({
    name: auth.currentUser.displayName || "",
    email: auth.currentUser.email,
  });

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState(null);

  const { name, email } = formData;

  const [changeDetails, setChangeDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserListings = async () => {
      const listingsRef = collection(db, "listings");
      const q = query(
        listingsRef,
        where("userRef", "==", auth.currentUser.uid),
        orderBy("timestamp", "desc")
      );

      const querySnap = await getDocs(q);
      const listings = [];
      querySnap.forEach((doc) =>
        listings.push({ id: doc.id, data: doc.data() })
      );

      setListings(listings);
      setLoading(false);
    };

    fetchUserListings();
  }, [auth.currentUser.uid]);

  const onLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  const onsubmit = async (e) => {
    try {
      if (auth.currentUser.displayName !== name) {
        //Update profile display name
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
        //Update name in store
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          name,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Could not update profile details");
    }
  };

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  const deleteListing = async (id) => {
    if (window.confirm("Are you sure you want to delete")) {
      try {
        await deleteDoc(doc(db, "listings", id));
        const updatedListing = listings.filter((listing) => listing.id !== id);
        setListings(updatedListing);
        toast.success("Successfully deleted listing");
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="profile">
      <header className="profileHeader">
        <p className="pageHeader">My Profile</p>
        <button type="button" className="logOut" onClick={onLogout}>
          Logout
        </button>
      </header>
      <main>
        <div className="profileDetailsHeader">
          <p className="profileDetailsText">Personal Details</p>
          <p
            className="changePersonalDetails"
            onClick={() => {
              changeDetails && onsubmit();
              setChangeDetails((prevState) => !prevState);
            }}
          >
            {changeDetails ? "done" : "change"}
          </p>
        </div>
        <div className="profileCard">
          <form>
            <input
              type="text"
              id="name"
              className={!changeDetails ? "profileName" : "profileNameActive"}
              disabled={!changeDetails}
              value={name}
              onChange={onChange}
            />
            <input
              type="text"
              id="email"
              className={!changeDetails ? "profileEmail" : "profileEmailActive"}
              disabled={!changeDetails}
              value={email}
              onChange={onChange}
            />
          </form>
        </div>
        <Link to="/create-listing" className="createListing">
          <img src={homeIcon} alt="Home" />
          <p>Sell or Rent your home</p>
          <img src={arrowRight} alt="Arrow Right" />
        </Link>
        {!loading && listings?.length > 0 && (
          <>
            <p className="listingText">Your Listings</p>
            <ul className="listingsList">
              {listings.map(({ id, data }) => (
                <ListingItem
                  id={id}
                  key={id}
                  list={data}
                  onDelete={() => deleteListing(id)}
                />
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;
