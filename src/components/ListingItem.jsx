import React from "react";
import { Link } from "react-router-dom";
import { ReactComponent as DeleteIcon } from "../assets/svg/deleteIcon.svg";
import bedIcon from "../assets/svg/bedIcon.svg";
import bathtubIcon from "../assets/svg/bathtubIcon.svg";

const ListingItem = ({ list, id, onDelete }) => {
  return (
    <li className="categoryListing">
      <Link to={`/category/${list.type}/${id}`} className="categoryListingLink">
        <img
          src={list.imageUrls[0]}
          alt={list.name}
          className="categoryListingImg"
        />
        <div className="categoryListingDetails">
          <p className="categoryListingLocation">{list.location}</p>
          <p className="categoryListingName">{list.name}</p>
          <p className="categoryListingPrice">
            $
            {list.offer
              ? list.discountedPrice
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              : list.regularPrice
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            {list.type === "rent" && " /month"}
          </p>
          <div className="categoryListingInfoDiv">
            <img src={bedIcon} alt="bed" />
            <p className="categoryListingInfoText">
              {list.bedrooms > 1 ? `${list.bedrooms} Bedrooms` : "1 Bedroom"}
            </p>
            <img src={bathtubIcon} alt="bath" />
            <p className="categoryListingInfoText">
              {list.bathrooms > 1
                ? `${list.bathrooms} Bathrooms`
                : "1 Bathroom"}
            </p>
          </div>
        </div>
      </Link>
      {onDelete && (
        <DeleteIcon
          fill="rgb(231,76,60)"
          className="removeIcon"
          onClick={() => onDelete(id, list.name)}
        />
      )}
    </li>
  );
};

ListingItem.defaultProps = {
  onDelete: null,
};

export default ListingItem;
