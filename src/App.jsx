import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home, Plus } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProfileDetail from './components/ProfileDetail';
import ProfileForm from './components/ProfileForm';
import LoginButton from './components/LoginButton';
import { AuthProvider } from './contexts/AuthContext';
import { initializeStorage } from './utils/storage';
import './index.css';

function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize storage and check for weekly reset
    initializeStorage();
    setInitialized(true);
  }, []);

  if (!initialized) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <div className="pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router basename="/kids">{/* Match the base path from vite.config.js */}
        <div className="app">
          <header style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <div className="container" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Link to="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-xl)',
                fontWeight: 700
              }}>
                <Home size={24} />
                Aprendizaje por Refuerzo
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <LoginButton />
                <Link to="/new-profile" className="btn btn-primary">
                  <Plus size={20} />
                  Nuevo Perfil
                </Link>
              </div>
            </div>
          </header>

          <main className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile/:id" element={<ProfileDetail />} />
              <Route path="/new-profile" element={<ProfileForm />} />
              <Route path="/edit-profile/:id" element={<ProfileForm />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
