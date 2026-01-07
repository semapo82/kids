import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToProfiles } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import ProfileCard from './ProfileCard';
import { Users } from 'lucide-react';

function Dashboard() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToProfiles((data) => {
            setProfiles(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '3rem' }}>
                <div className="pulse">Actualizando perfiles...</div>
            </div>
        );
    }

    if (profiles.length === 0) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <Users size={64} style={{ color: 'var(--text-muted)', margin: '0 auto var(--spacing-lg)' }} />
                <h2 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                    No hay perfiles creados
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-xl)' }}>
                    Crea el primer perfil para comenzar
                </p>
                <Link to="/new-profile" className="btn btn-primary btn-lg">
                    Crear Primer Perfil
                </Link>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <h1 style={{ marginBottom: 'var(--spacing-xl)', fontSize: 'var(--font-size-3xl)' }}>
                Perfiles
            </h1>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 'var(--spacing-lg)'
            }}>
                {profiles.map(profile => (
                    <ProfileCard key={profile.id} profile={profile} />
                ))}
            </div>
        </div>
    );
}

export default Dashboard;
