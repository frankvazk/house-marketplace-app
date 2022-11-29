import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import {
  getStorage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

const EditListing = () => {
  const { listingId } = useParams();
  // eslint-disable-next-line
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [formData, setFormData] = useState({
    type: "rent",
    name: "",
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: "",
    offer: false,
    regularPrice: 0.0,
    discountedPrice: 0.0,
    images: {},
    lat: 0,
    lng: 0,
  });

  const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    offer,
    regularPrice,
    discountedPrice,
    images,
    lat,
    lng,
  } = formData;

  const auth = getAuth();
  const isMounted = useRef(true);
  const navigate = useNavigate();

  //User Authentication
  useEffect(() => {
    const validateUser = () => {
      if (isMounted) {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            setFormData((prevState) => ({ ...prevState, userRef: user.uid }));
          } else {
            navigate("/sign-in");
          }
        });
      }
    };

    validateUser();
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, navigate]);

  //Fetch Listing Data
  useEffect(() => {
    const fetchListing = async () => {
      const docRef = doc(db, "listings", listingId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const formDataCopy = { ...docSnap.data() };
        formDataCopy.lat = formDataCopy.geolocation.lat;
        formDataCopy.lng = formDataCopy.geolocation.lng;
        formDataCopy.address = formDataCopy.location;
        delete formDataCopy.geolocation;
        delete formDataCopy.location;
        setListing(docSnap.data());
        setFormData((prevState) => ({ ...prevState, ...formDataCopy }));
        setLoading(false);
      } else {
        navigate(-1);
        toast.error("Listing does not exist!");
      }
    };
    fetchListing();
  }, [listingId, navigate]);

  //User Authorization
  useEffect(() => {
    if (listing?.userRef && listing.userRef !== auth.currentUser.uid) {
      toast.error("You cannot edit this listing");
      navigate("/");
    }
  }, [listing?.userRef, auth.currentUser.uid, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (offer && discountedPrice > regularPrice) {
        toast.error(
          "Discounted price should not be greater than Regular Price"
        );
        return;
      }

      if (images.length > 6) {
        toast.error("You exceeded max number of images (6)");
        return;
      }

      let geolocation = {};
      let location = null;
      if (geolocationEnabled) {
        const q = new URLSearchParams({
          key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
          address: address,
        });

        const response = await fetch(
          `${process.env.REACT_APP_GOOGLE_MAPS_API_URL}?${q}`
        );
        const data = await response.json();
        if (data.status === "OK") {
          geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
          geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;
          location = data.results[0].formatted_address ?? undefined;
        }

        if (location === undefined || location === null) {
          toast.error("Please enter a correct address");
          return;
        }
      } else {
        geolocation.lat = lat;
        geolocation.lng = lng;
      }

      //Store Images in Firebase
      const storeImage = (image) => {
        return new Promise((resolve, reject) => {
          const storage = getStorage();
          const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;
          const storageRef = ref(storage, `images/${fileName}`);
          const uploadTask = uploadBytesResumable(storageRef, image);

          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log("Upload is " + progress + "% done");
              switch (snapshot.state) {
                case "paused":
                  console.log("Upload is paused");
                  break;
                case "running":
                  console.log("Upload is running");
                  break;
                default:
                  break;
              }
            },
            (error) => {
              reject(error);
              // A full list of error codes is available at
              // https://firebase.google.com/docs/storage/web/handle-errors
              /*switch (error.code) {
                case "storage/unauthorized":
                  // User doesn't have permission to access the object
                  break;
                case "storage/canceled":
                  // User canceled the upload
                  break;

                // ...

                case "storage/unknown":
                  // Unknown error occurred, inspect error.serverResponse
                  break;
              }*/
            },
            () => {
              // Upload completed successfully, now we can get the download URL
              getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                console.log("File available at", downloadURL);
                resolve(downloadURL);
              });
            }
          );
        });
      };

      let imgUrls = null;
      if (images.length !== 0 && images.length !== undefined) {
        imgUrls = await Promise.all(
          [...images].map((image) => storeImage(image))
        ).catch(() => {
          toast.error("Images not uploaded");
          return;
        });

        if (listing.imgUrls.length !== 0) {
          imgUrls = [...listing.imgUrls, ...imgUrls];
        }
      } else {
        imgUrls = listing.imgUrls;
      }

      const formDataCopy = {
        ...formData,
        imgUrls,
        location,
        geolocation,
        timestamp: serverTimestamp(),
      };

      //Set address to location key
      formDataCopy.location = address;

      //Clean Up Json Object
      delete formDataCopy.images;
      delete formDataCopy.address;
      if (!formDataCopy.offer) {
        formDataCopy.discountedPrice = deleteField();
      }

      const docRef = doc(db, "listings", listingId);
      await updateDoc(docRef, formDataCopy);
      toast.success("Listing Saved!!!");
      navigate(`/category/${formDataCopy.type}/${docRef.id}`);
    } catch (error) {
      console.log(error);
      toast.error("The Listing could not been created.");
    }
  };

  const onMutate = (e) => {
    let boolean = null;
    if (e.target.value === "true") {
      boolean = true;
    }

    if (e.target.value === "false") {
      boolean = false;
    }

    //File Input State Handling
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        images: e.target.files,
      }));
    }

    //Text/Number/Boolean Input State Handling
    /**
     * ?? Nullish coalescing operator -  is a logical operator that returns
     * its right-hand side operand when its left-hand side operand is null
     * or undefined, and otherwise returns its left-hand side operand.
     */
    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  };

  if (loading) {
    return <h3>Loading...</h3>;
  }

  return (
    <div className="profile">
      <header>
        <p className="pageHeader">Edit Listing</p>
      </header>
      <main>
        <form onSubmit={onSubmit}>
          <label className="formLabel">Sell / Rent</label>
          <div className="formButtons">
            <button
              type="button"
              className={type === "sale" ? "formButtonActive" : "formButton"}
              id="type"
              value="sale"
              onClick={onMutate}
            >
              Sell
            </button>
            <button
              type="button"
              className={type === "rent" ? "formButtonActive" : "formButton"}
              id="type"
              value="rent"
              onClick={onMutate}
            >
              Rent
            </button>
          </div>
          <label className="formLabel">Name</label>
          <input
            type="text"
            className="formInputName"
            id="name"
            value={name}
            onChange={onMutate}
            maxLength="32"
            minLength="10"
            required={true}
          />
          <div className="formRooms flex">
            <div>
              <label className="formLabel">Bedrooms</label>
              <input
                className="formInputSmall"
                type="number"
                id="bedrooms"
                value={bedrooms}
                onChange={onMutate}
                min="1"
                max="50"
                required={true}
              />
            </div>
            <div>
              <label className="formLabel">Bathrooms</label>
              <input
                className="formInputSmall"
                type="number"
                id="bathrooms"
                value={bathrooms}
                onChange={onMutate}
                min="1"
                max="50"
                required={true}
              />
            </div>
          </div>
          <label className="formLabel">Parking spot</label>
          <div className="formButtons">
            <button
              className={parking ? "formButtonActive" : "formButton"}
              type="button"
              id="parking"
              value={true}
              onClick={onMutate}
              min="1"
              max="50"
            >
              Yes
            </button>
            <button
              className={!parking ? "formButtonActive" : "formButton"}
              type="button"
              id="parking"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>

          <label className="formLabel">Furnished</label>
          <div className="formButtons">
            <button
              className={furnished ? "formButtonActive" : "formButton"}
              type="button"
              id="furnished"
              value={true}
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              className={
                !furnished && furnished !== null
                  ? "formButtonActive"
                  : "formButton"
              }
              type="button"
              id="furnished"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>

          <label className="formLabel">Address</label>
          <textarea
            className="formInputAddress"
            type="text"
            id="address"
            value={address}
            onChange={onMutate}
            required={true}
          />
          {!geolocationEnabled && (
            <div className="formLatLng flex">
              <div>
                <label className="formLabel">Latitude</label>
                <input
                  className="formInputSmall"
                  type="number"
                  id="lat"
                  value={lat}
                  onChange={onMutate}
                  required={true}
                />
              </div>
              <div>
                <label className="formLabel">Longitude</label>
                <input
                  className="formInputSmall"
                  type="number"
                  id="lng"
                  value={lng}
                  onChange={onMutate}
                  required={true}
                />
              </div>
            </div>
          )}
          <label className="formLabel">Offer</label>
          <div className="formButtons">
            <button
              className={offer ? "formButtonActive" : "formButton"}
              type="button"
              id="offer"
              value={true}
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              className={
                !offer && offer !== null ? "formButtonActive" : "formButton"
              }
              type="button"
              id="offer"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>

          <label className="formLabel">Regular Price</label>
          <div className="formPriceDiv">
            <input
              className="formInputSmall"
              type="number"
              id="regularPrice"
              value={regularPrice}
              onChange={onMutate}
              min="50"
              max="750000000"
              required={true}
            />
            {type === "rent" && <p className="formPriceText">$ / Month</p>}
          </div>

          {offer && (
            <>
              <label className="formLabel">Discounted Price</label>
              <input
                className="formInputSmall"
                type="number"
                id="discountedPrice"
                value={discountedPrice}
                onChange={onMutate}
                min="50"
                max="750000000"
                required={offer}
              />
            </>
          )}

          <label className="formLabel">Images</label>
          <p className="imagesInfo">
            The first image will be the cover (max 6).
          </p>
          <input
            className="formInputFile"
            type="file"
            id="images"
            onChange={onMutate}
            max="6"
            accept=".jpg,.png,.jpeg"
            multiple
            required={listing?.imgUrls?.length === 0 ?? true}
          />
          <button type="submit" className="primaryButton createListingButton">
            Edit Listing
          </button>
        </form>
      </main>
    </div>
  );
};

export default EditListing;
