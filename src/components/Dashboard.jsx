import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscribeToProfiles, subscribeToFamilyChange } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import ProfileCard from './ProfileCard';
import { Plus, Users } from 'lucide-react';

function Dashboard() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let unsubscribeProfiles = () => { };

        const unsubscribeFamily = subscribeToFamilyChange((newFamilyId) => {
            setLoading(true);
            unsubscribeProfiles(); // Clean up previous subscription if any
            unsubscribeProfiles = subscribeToProfiles((data) => {
                setProfiles(data);
                setLoading(false);
            });
        });

        return () => {
            unsubscribeFamily();
            unsubscribeProfiles();
        };
    }, []);

    if (loading) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', paddingTop: '45vh' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--text-muted)', margin: 'auto' }} className="animate-spin" />
            </div>
        );
    }

    if (profiles.length === 0) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                }}>
                    <Users size={32} color="var(--text-secondary)" />
                </div>
                <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
                    Comienza tu viaje
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                    Crea el primer perfil para empezar.
                </p>
                <Link to="/new-profile" className="btn-primary" style={{ maxWidth: '200px', margin: '0 auto', textDecoration: 'none' }}>
                    Crear Perfil
                </Link>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <h1 className="header-large">Perfiles</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {profiles.map(profile => (
                    <ProfileCard key={profile.id} profile={profile} />
                ))}

                {/* Add Profile Row Item */}
                <button
                    onClick={() => navigate('/new-profile')}
                    className="card"
                    style={{
                        background: 'transparent',
                        border: '1px dashed var(--border-subtle)',
                        height: '70px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <Plus size={20} />
                    <span style={{ fontSize: '17px', fontWeight: 500 }}>Añadir otro perfil</span>
                </button>
            </div>
        </div>
    );
}

export default Dashboard;
