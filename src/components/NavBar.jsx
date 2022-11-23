import React from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { ReactComponent as OfferIcon } from "../assets/svg/localOfferIcon.svg";
import { ReactComponent as ExploreIcon } from "../assets/svg/exploreIcon.svg";
import { ReactComponent as PersonOutlineIcon } from "../assets/svg/personOutlineIcon.svg";

const NavBar = () => {
  const navigate = useNavigate();

  return (
    <footer className="navbar">
      <nav className="navbarNav">
        <ul className="navbarListItems">
          <li className="navbarListItem">
            <NavLink to="/">
              <ExploreIcon
                className="navbarListIcon"
                width="36px"
                height="36px"
              />
              <p>Explore</p>
            </NavLink>
          </li>
          <li className="navbarListItem">
            <NavLink to="/offers">
              <OfferIcon
                className="navbarListIcon"
                width="36px"
                height="36px"
              />
              <p>Offer</p>
            </NavLink>
          </li>
          <li className="navbarListItem">
            <NavLink to="/sign-in">
              <PersonOutlineIcon
                className="navbarListIcon"
                width="36px"
                height="36px"
              />
              <p>Profile</p>
            </NavLink>
          </li>
        </ul>
      </nav>
    </footer>
  );
};

export default NavBar;
