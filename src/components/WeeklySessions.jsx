import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { subscribeToTransactions } from '../utils/storage';
import { isCurrentWeek } from '../utils/dateUtils';

function WeeklySessions({ profile }) {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToTransactions(profile.id, (data) => {
            setTransactions(data);
        });
        return () => unsubscribe();
    }, [profile.id]);

    const plannedDays = profile.weeklyPlan ? Object.entries(profile.weeklyPlan)
        .filter(([day, hours]) => hours > 0) : [];

    if (plannedDays.length === 0) return null;

    const DAY_LABELS = {
        friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo', monday: 'Lunes',
        tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves'
    };

    const calculateSessionStats = (dayKey) => {
        const plannedMinutes = (profile.weeklyPlan[dayKey] || 0) * 60;

        // Sum penalties assigned to this session in the CURRENT week
        // Note: For simplicity, we filter transactions that have targetSession === dayKey
        const penalties = transactions
            .filter(tx =>
                tx.targetSession === dayKey &&
                (tx.type === 'consequence' || tx.type === 'consequence_reversal') &&
                isCurrentWeek(new Date(tx.timestamp))
            )
            .reduce((sum, tx) => sum + tx.amount, 0);

        const available = Math.max(0, plannedMinutes + penalties);

        return {
            planned: plannedMinutes,
            penalties: Math.abs(penalties),
            available
        };
    };

    return (
        <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                <Calendar size={24} color="var(--color-primary)" />
                <h3 style={{ fontSize: 'var(--font-size-xl)' }}>Plan de Sesiones Semanal</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-sm)' }}>
                {plannedDays.map(([dayKey, hours]) => {
                    const stats = calculateSessionStats(dayKey);
                    const percentage = (stats.available / stats.planned) * 100;
                    const statusColor = percentage === 100 ? 'var(--color-success)' :
                        percentage > 50 ? 'var(--color-warning)' : 'var(--color-danger)';

                    return (
                        <div key={dayKey} style={{
                            padding: 'var(--spacing-md)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid var(--border-color)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                                <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{DAY_LABELS[dayKey]}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Meta: {hours}h</span>
                            </div>

                            <div style={{ fontSize: '24px', fontWeight: 800, color: statusColor, marginBottom: '2px' }}>
                                {stats.available} <span style={{ fontSize: '14px' }}>Min</span>
                            </div>

                            {stats.penalties > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontSize: '11px', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                    <AlertCircle size={12} />
                                    -{stats.penalties} min de penalización
                                </div>
                            )}

                            <div className="progress-bar" style={{ height: '6px' }}>
                                <div className="progress-fill" style={{
                                    width: `${percentage}%`,
                                    background: statusColor,
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>

                            {stats.available === 0 && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backdropFilter: 'blur(1px)'
                                }}>
                                    <span style={{ color: 'var(--color-danger)', fontWeight: 800, fontSize: '12px', transform: 'rotate(-15deg)', border: '2px solid', padding: '2px 8px', borderRadius: '4px' }}>
                                        AGOTADO
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: 'var(--spacing-md)', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                * El tiempo disponible se calcula restando las penalizaciones asignadas específicamente a cada sesión.
            </div>
        </div>
    );
}

export default WeeklySessions;
