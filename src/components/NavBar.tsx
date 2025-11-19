import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Customers', end: true },
  { to: '/trainings', label: 'Trainings' },
];

const NavBar = () => {
  return (
    <header className="navbar">
      <div className="navbar__brand">Frontend Personal Trainer</div>
      <nav className="navbar__nav">
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `navbar__link${isActive ? ' navbar__link--active' : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default NavBar;

