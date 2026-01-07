import React from 'react';
import { Link } from 'react-router-dom';
import { User, TrendingUp, Clock } from 'lucide-react';

function ProfileCard({ profile }) {
    const { id, name, balance, weeklyGoalHours } = profile;

    // Calculate progress percentage
    const goalMinutes = weeklyGoalHours * 60;
    const progress = goalMinutes > 0 ? Math.min((balance / goalMinutes) * 100, 100) : 0;

    // Determine color based on balance
    const balanceColor = balance > 0 ? 'var(--color-success)' : 'var(--color-danger)';
    const isLocked = balance <= 0;

    return (
        <Link to={`/profile/${id}`} style={{ textDecoration: 'none' }}>
            <div className={`card ${isLocked ? 'locked' : ''}`} style={{
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-info) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <User size={24} color="white" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-xs)' }}>
                            {name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            <Clock size={14} />
                            Meta: {weeklyGoalHours}h semanales
                        </div>
                    </div>
                </div>

                {/* Balance */}
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-lg)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--border-radius)',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                        Saldo Actual
                    </div>
                    <div style={{
                        fontSize: 'var(--font-size-4xl)',
                        fontWeight: 800,
                        color: balanceColor,
                        marginBottom: 'var(--spacing-xs)'
                    }}>
                        {balance}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        Minutos
                    </div>
                </div>

                {/* Progress Bar */}
                {goalMinutes > 0 && (
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--spacing-sm)',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                <TrendingUp size={14} />
                                Progreso Semanal
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--color-info)' }}>
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>
        </Link>
    );
}

export default ProfileCard;
