import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Home, Plus, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProfileDetail from './components/ProfileDetail';
import ProfileForm from './components/ProfileForm';
import FamilySettings from './components/FamilySettings';
import LoginButton from './components/LoginButton';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initializeStorage } from './utils/storage';
import './index.css';

function AppContent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="header shadow-sm">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Home className="text-primary" size={20} />
            <h1 style={{
              fontSize: 'clamp(1rem, 4vw, 1.25rem)',
              margin: 0,
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-info) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap'
            }}>
              Aprendizaje
            </h1>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            {user && (
              <Link to="/family-settings" className="btn btn-icon btn-secondary" title="Configuración de Familia" style={{ display: 'flex', padding: '8px' }}>
                <Settings size={18} />
              </Link>
            )}
            <LoginButton />
            <Link to="/new-profile" className="btn btn-primary" style={{ padding: '8px' }}>
              <Plus size={18} />
              <span className="hide-mobile">Perfil</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-profile" element={<ProfileForm />} />
          <Route path="/edit-profile/:id" element={<ProfileForm />} />
          <Route path="/profile/:id" element={<ProfileDetail />} />
          <Route path="/family-settings" element={<FamilySettings />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log("App effect: initializing storage");

    // Initialize Google Auth Nativo if in Capacitor
    if (window.hasOwnProperty('Capacitor')) {
      import('@codetrix-studio/capacitor-google-auth').then(mod => {
        mod.GoogleAuth.initialize();
      });
    }

    initializeStorage()
      .then(() => {
        console.log("Storage initialized successfully");
        setInitialized(true);
      })
      .catch(err => {
        console.error("Initialization error:", err);
        alert("Critial initialization error: " + err.message);
      });
  }, []);

  if (!initialized) {
    return (
      <div style={{ padding: '20px', color: 'white', background: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Cargando sistema...</div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
