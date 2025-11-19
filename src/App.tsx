import NavBar from './components/NavBar';
import CustomersPage from './pages/CustomersPage';
import TrainingsPage from './pages/TrainingsPage';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { fetchCustomers } from './services/personalTrainerApi';

const loadCustomers = async () => {
  const customers = await fetchCustomers();
  return customers;
};

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
