import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MoreHorizontal, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { subscribeToProfile, deleteProfile, subscribeToFamilyChange } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import TaskChecklist from './TaskChecklist';
import ConsequenceButtons from './ConsequenceButtons';
import BankingModule from './BankingModule';
import ActivityFeed from './ActivityFeed';
import HistoryChart from './HistoryChart';
import WeeklySessions from './WeeklySessions';
import { formatDate, isSameDay, isFutureDate } from '../utils/dateUtils';

function ProfileDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeDate, setActiveDate] = useState(new Date());
    const { user } = useAuth(); // Keeping hook even if unused for logic consistency

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

    if (loading) return <div className="fade-in" style={{ textAlign: 'center', paddingTop: '40vh' }}><div className="animate-spin" style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--text-muted)', margin: 'auto' }} /></div>;

    if (!profile) return null;

    const balanceColor = profile.balance > 0 ? 'var(--accent-success)' : 'var(--accent-danger)';

    return (
        <div className="fade-in">
            {/* iOS Navigation Bar Wrapper */}
            {/* iOS Navigation Bar Wrapper */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    <ChevronLeft size={20} />
                </button>

                <Link to={`/edit-profile/${id}`} style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                }}>
                    <Edit3 size={18} />
                </Link>
            </div>

            {/* Large Title Header */}
            <h1 className="header-large" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {profile.photoURL && <img src={profile.photoURL} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />}
                {profile.name}
            </h1>

            {/* Date Selector Segmented Control Look */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '4px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
            }}>
                <button
                    onClick={() => {
                        const newDate = new Date(activeDate);
                        newDate.setDate(newDate.getDate() - 1);
                        setActiveDate(newDate);
                    }}
                    style={{ background: 'none', border: 'none', height: '32px', width: '32px', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <ChevronLeft size={20} />
                </button>

                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isSameDay(activeDate, new Date()) ? 'Hoy' : formatDate(activeDate, 'd MMM')}
                </span>

                <button
                    onClick={() => {
                        const newDate = new Date(activeDate);
                        newDate.setDate(newDate.getDate() + 1);
                        if (!isFutureDate(newDate)) {
                            setActiveDate(newDate);
                        }
                    }}
                    disabled={isFutureDate(new Date(new Date(activeDate).setDate(activeDate.getDate() + 1)))}
                    style={{
                        background: 'none', border: 'none', height: '32px', width: '32px',
                        color: isFutureDate(new Date(new Date(activeDate).setDate(activeDate.getDate() + 1))) ? 'var(--text-muted)' : 'var(--accent-primary)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Balance Hero */}
            <div style={{ marginBottom: '32px' }}>
                <span className="text-label" style={{ paddingLeft: '16px' }}>SALDO DISPONIBLE</span>
                <div className="card" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 24px' }}>
                    <div>
                        <span style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-1px', color: 'var(--text-primary)' }}>
                            {profile.balance}
                        </span>
                        <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '6px' }}>min</span>
                    </div>
                    <div style={{
                        padding: '6px 12px',
                        borderRadius: '100px',
                        background: profile.balance >= 0 ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 69, 58, 0.15)',
                        color: balanceColor,
                        fontWeight: 600,
                        fontSize: '13px'
                    }}>
                        {profile.balance >= 0 ? 'Positivo' : 'Negativo'}
                    </div>
                </div>
            </div>

            {/* Modules Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* Weekly Plan */}
                <div>
                    <span className="text-label" style={{ paddingLeft: '16px' }}>PLAN DE JUEGO</span>
                    <WeeklySessions profile={profile} />
                </div>

                {/* Tasks */}
                <div>
                    <span className="text-label" style={{ paddingLeft: '16px' }}>TAREAS DIARIAS</span>
                    <TaskChecklist profile={profile} activeDate={activeDate} />
                </div>

                {/* Consequences */}
                <div>
                    <span className="text-label" style={{ paddingLeft: '16px' }}>PENALIZACIONES</span>
                    <ConsequenceButtons profile={profile} activeDate={activeDate} />
                </div>

                {/* Banking */}
                <div>
                    <span className="text-label" style={{ paddingLeft: '16px' }}>LA BANCA</span>
                    <BankingModule profile={profile} activeDate={activeDate} />
                </div>

                {/* History */}
                <div>
                    <span className="text-label" style={{ paddingLeft: '16px' }}>PROGRESO</span>
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <h3 style={{ fontSize: '17px', margin: '0 0 16px 0', fontWeight: 600 }}>Tendencia</h3>
                        <HistoryChart profileId={id} />
                    </div>
                </div>

                {/* Activity */}
                <div>
                    <span className="text-label" style={{ paddingLeft: '16px' }}>ACTIVIDAD</span>
                    <div className="card">
                        <ActivityFeed profileId={id} />
                    </div>
                </div>
            </div>

            <div style={{ height: '40px' }} /> {/* Spacing for bottom nav */}
        </div>
    );
}

export default ProfileDetail;
