import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { subscribeToProfile, deleteProfile } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import TaskChecklist from './TaskChecklist';
import ConsequenceButtons from './ConsequenceButtons';
import BankingModule from './BankingModule';
import ActivityFeed from './ActivityFeed';
import HistoryChart from './HistoryChart';

function ProfileDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToProfile(id, (data) => {
            if (!data && !loading) {
                // Profile was deleted
                navigate('/');
                return;
            }
            setProfile(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, user]);

    const handleDelete = async () => {
        if (window.confirm(`¿Estás seguro de eliminar el perfil de ${profile.name}?`)) {
            await deleteProfile(id);
            navigate('/');
        }
    };

    if (loading) {
        return <div className="container">Cargando...</div>;
    }

    if (!profile) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '3rem' }}>
                <p>Perfil no encontrado.</p>
                <button onClick={() => navigate('/')} className="btn btn-primary">Volver al Dashboard</button>
            </div>
        );
    }

    const balanceColor = profile.balance > 0 ? 'var(--color-success)' : 'var(--color-danger)';

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <button onClick={() => navigate('/')} className="btn btn-secondary">
                    <ArrowLeft size={20} />
                    Volver
                </button>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/edit-profile/${id}`} className="btn btn-secondary">
                        <Edit size={20} />
                        Editar
                    </Link>
                    <button onClick={handleDelete} className="btn btn-danger">
                        <Trash2 size={20} />
                        Eliminar
                    </button>
                </div>
            </div>

            {/* Profile Header */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
                <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-md)' }}>
                    {profile.name}
                </h1>
                <div style={{
                    fontSize: 'var(--font-size-4xl)',
                    fontWeight: 800,
                    color: balanceColor,
                    marginBottom: 'var(--spacing-sm)'
                }}>
                    {profile.balance} Min
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                    Saldo Actual
                </div>
            </div>

            {/* Main Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-xl)'
            }}>
                {/* Tasks */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-xl)' }}>
                        ✅ Tareas Diarias
                    </h3>
                    <TaskChecklist profile={profile} />
                </div>

                {/* Consequences */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-xl)' }}>
                        ⚠️ Consecuencias
                    </h3>
                    <ConsequenceButtons profileId={id} />
                </div>
            </div>

            {/* Banking Module */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <BankingModule profile={profile} />
            </div>

            {/* History Chart */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-xl)' }}>
                    📊 Progreso
                </h3>
                <HistoryChart profileId={id} />
            </div>

            {/* Activity Feed */}
            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-xl)' }}>
                    📝 Actividad Reciente
                </h3>
                <ActivityFeed profileId={id} />
            </div>
        </div>
    );
}

export default ProfileDetail;
