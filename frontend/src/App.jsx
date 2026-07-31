import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import NewCase from './pages/NewCase';
import Settings from './pages/Settings';
import PatientDetail from './pages/PatientDetail';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Landing from './pages/Landing';

export default function App() {
  const [stage, setStage] = useState(
    localStorage.getItem('clinic_pin') ? 'app' : 'landing'
  );

  if (stage === 'landing') return <Landing onEnter={() => setStage('login')} />;
  if (stage === 'login') return <Login onLogin={() => setStage('app')} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onLogout={() => { localStorage.removeItem('clinic_pin'); setStage('landing'); }} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/new-case" element={<NewCase />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
