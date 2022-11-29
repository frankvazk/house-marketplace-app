import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase.config";
import { Navigation, Pagination, A11y } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

const Slider = () => {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, orderBy("timestamp", "desc"), limit(5));
      const querySnap = await getDocs(q);
      let listings = [];

      querySnap.forEach((doc) =>
        listings.push({ id: doc.id, data: doc.data() })
      );

      setListings(listings);
      setLoading(false);
    };

    fetchListings();
  }, []);

  if (loading) {
    return <h3>Loading...</h3>;
  }

  return (
    <>
      <p className="exploreHeading">Recomended</p>
      <Swiper
        modules={[Navigation, Pagination, A11y]}
        pagination={{ clickable: true }}
        slidesPerView={1}
      >
        {listings.map(({ id, data }, index) => (
          <SwiperSlide
            key={id}
            onClick={() => navigate(`/category/${data.type}/${id}`)}
          >
            <div
              className="swiperSlideDiv"
              style={{
                background: `url(${data.imgUrls[0]}) center no-repeat`,
                backgroundSize: "cover",
              }}
            >
              <p className="swiperSlideText">{data.name}</p>
              <p className="swiperSlidePrice">
                ${" "}
                {(data.discountedPrice ?? data.regularPrice)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                {data.type === "rent" && " / month"}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
};

export default Slider;
