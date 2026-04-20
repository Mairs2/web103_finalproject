import { NavLink } from 'react-router';
import './NavBar.css';

const NavBar = () => {
    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar-brand">
                🌸 FlowerHunt
            </NavLink>
            <ul className="navbar-links">
                <li><NavLink to="/" end>Home</NavLink></li>
                <li><NavLink to="/dictionary">Flower Dictionary</NavLink></li>
                <li><NavLink to="/scan">Scan-A-Flower</NavLink></li>
                <li><NavLink to="/gallery">Flower Gallery</NavLink></li>
                {/* <li><NavLink to="/about">About</NavLink></li>
                <li><NavLink to="/contact">Contact</NavLink></li> */}
            </ul>
        </nav>
    );
};

export default NavBar;
