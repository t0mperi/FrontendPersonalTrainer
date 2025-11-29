import NavBar from './components/NavBar';
import CustomersPage from './pages/CustomersPage';
import TrainingsPage from './pages/TrainingsPage';
import CalendarPage from './pages/CalendarPage';
import './App.css';
import { Routes, Route } from 'react-router-dom';

const App = () => {
  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<CustomersPage />} />
          <Route path="/trainings" element={<TrainingsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
