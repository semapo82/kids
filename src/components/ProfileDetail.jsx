import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { subscribeToProfile, deleteProfile, subscribeToFamilyChange } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import TaskChecklist from './TaskChecklist';
import ConsequenceButtons from './ConsequenceButtons';
import BankingModule from './BankingModule';
import ActivityFeed from './ActivityFeed';
import HistoryChart from './HistoryChart';
import WeeklySessions from './WeeklySessions';
import { formatDate, isSameDay, isFutureDate } from '../utils/dateUtils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

function ProfileDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeDate, setActiveDate] = useState(new Date());
    const { user } = useAuth();

    useEffect(() => {
        let unsubscribeProfile = () => { };

        const unsubscribeFamily = subscribeToFamilyChange(() => {
            setLoading(true);
            unsubscribeProfile();
            unsubscribeProfile = subscribeToProfile(id, (data) => {
                if (!data && !loading) {
                    navigate('/');
                    return;
                }
                setProfile(data);
                setLoading(false);
            });
        });

        return () => {
            unsubscribeFamily();
            unsubscribeProfile();
        };
    }, [id]);

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', gap: 'var(--spacing-sm)' }} className="mobile-stack">
                <button onClick={() => navigate('/')} className="btn btn-secondary">
                    <ArrowLeft size={20} />
                    <span className="hide-mobile">Volver</span>
                </button>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to={`/edit-profile/${id}`} className="btn btn-secondary" style={{ flex: 1 }}>
                        <Edit size={18} />
                        Editar
                    </Link>
                    <button onClick={handleDelete} className="btn btn-danger" style={{ flex: 1 }}>
                        <Trash2 size={18} />
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
                <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                    Saldo Actual
                </div>

                {/* Date Selector */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--spacing-md)',
                    paddingTop: 'var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    <button
                        onClick={() => {
                            const newDate = new Date(activeDate);
                            newDate.setDate(newDate.getDate() - 1);
                            setActiveDate(newDate);
                        }}
                        className="btn btn-icon btn-secondary"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                    }}>
                        <CalendarIcon size={18} className="text-primary" />
                        {isSameDay(activeDate, new Date()) ? 'Hoy' : formatDate(activeDate, 'EEEE, d MMM')}
                    </div>

                    <button
                        onClick={() => {
                            const newDate = new Date(activeDate);
                            newDate.setDate(newDate.getDate() + 1);
                            if (!isFutureDate(newDate)) {
                                setActiveDate(newDate);
                            }
                        }}
                        className="btn btn-icon btn-secondary"
                        disabled={isFutureDate(new Date(new Date(activeDate).setDate(activeDate.getDate() + 1)))}
                        style={{ opacity: isFutureDate(new Date(new Date(activeDate).setDate(activeDate.getDate() + 1))) ? 0.3 : 1 }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Weekly Sessions Plan */}
            <WeeklySessions profile={profile} />

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
                    <TaskChecklist profile={profile} activeDate={activeDate} />
                </div>

                {/* Consequences */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-xl)' }}>
                        ⚠️ Consecuencias
                    </h3>
                    <ConsequenceButtons profile={profile} activeDate={activeDate} />
                </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <BankingModule profile={profile} activeDate={activeDate} />
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
