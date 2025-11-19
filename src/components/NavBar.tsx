import { NavLink } from 'react-router-dom';

const NavBar = () => {
  return (
    <nav>
      <ul>
        <li>
          <NavLink to="/">Customers</NavLink>
        </li>
        <li>
          <NavLink to="/trainings">Trainings</NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;

