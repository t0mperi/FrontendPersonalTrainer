import NavBar from './components/NavBar';
import CustomersPage from './pages/CustomersPage';
import TrainingsPage from './pages/TrainingsPage';
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
        </Routes>
      </main>
    </>
  );
};

export default App;
