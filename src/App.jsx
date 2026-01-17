import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const getNavColor = (path) => {
    return location.pathname === path ? 'var(--accent-primary)' : 'var(--text-muted)';
  };

  return (
    <>
      {/* Floating Profile/Login Button (Top Right Absolute) */}
      <div style={{ position: 'fixed', top: 'calc(var(--safe-top) + 10px)', right: '20px', zIndex: 100 }}>
        <LoginButton />
      </div>

      <main className="app-container" style={{
        paddingTop: 'calc(var(--safe-top) + 60px)',
        paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 20px)',
        paddingLeft: '20px',
        paddingRight: '20px',
        minHeight: '100vh',
        maxWidth: '480px',
        margin: '0 auto',
        position: 'relative'
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* Note: keeping old routes /new-profile and /family-settings for compatibility, adding aliases just in case */}
          <Route path="/new-profile" element={<ProfileForm />} />
          <Route path="/add-profile" element={<ProfileForm />} />
          <Route path="/edit-profile/:id" element={<ProfileForm />} />
          <Route path="/profile/:id" element={<ProfileDetail />} />
          <Route path="/family-settings" element={<FamilySettings />} />
          <Route path="/settings" element={<FamilySettings />} />
        </Routes>
      </main>

      {/* iOS Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 'calc(var(--nav-height) + var(--safe-bottom))',
        background: 'rgba(28, 28, 30, 0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        paddingTop: '10px',
        zIndex: 1000,
        paddingBottom: 'var(--safe-bottom)'
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Home size={28} color={getNavColor('/')} />
          <span style={{ fontSize: '10px', fontWeight: 500, color: getNavColor('/') }}>Inicio</span>
        </button>
        <button onClick={() => navigate('/new-profile')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Plus size={28} color={getNavColor('/new-profile')} />
          <span style={{ fontSize: '10px', fontWeight: 500, color: getNavColor('/new-profile') }}>Añadir</span>
        </button>
        <button onClick={() => navigate('/family-settings')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Settings size={28} color={getNavColor('/family-settings')} />
          <span style={{ fontSize: '10px', fontWeight: 500, color: getNavColor('/family-settings') }}>Ajustes</span>
        </button>
      </nav>
    </>
  );
}

function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize Google Auth Nativo if in Capacitor
    if (window.hasOwnProperty('Capacitor')) {
      import('@codetrix-studio/capacitor-google-auth').then(mod => {
        mod.GoogleAuth.initialize({
          clientId: '483987459546-gl8vlvq35gi2q4clhtm3n83os1t71rvh.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
      });
    }

    initializeStorage()
      .then(() => {
        setInitialized(true);
      })
      .catch(err => {
        console.error("Initialization error:", err);
      });
  }, []);

  if (!initialized) return <div style={{ background: '#000', height: '100vh' }} />;

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
