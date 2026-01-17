import React, { useState, useEffect } from 'react';
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
        friday: 'VI', saturday: 'SA', sunday: 'DO', monday: 'LU',
        tuesday: 'MA', wednesday: 'MI', thursday: 'JU'
    };

    const calculateSessionStats = (dayKey) => {
        const plannedMinutes = (profile.weeklyPlan[dayKey] || 0) * 60;

        // LOGIC PRESERVED FROM OLD COMMIT:
        // Sum penalties assigned to this session in the CURRENT week
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
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${plannedDays.length}, 1fr)`, gap: '1px', background: 'var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
            {plannedDays.map(([dayKey, hours]) => {
                const stats = calculateSessionStats(dayKey);
                const percentage = stats.planned > 0 ? (stats.available / stats.planned) * 100 : 0;

                // Colors
                const isFull = percentage === 100;
                const strokeColor = isFull ? 'var(--accent-success)' : stats.available === 0 ? 'var(--accent-danger)' : 'var(--accent-warning)';

                return (
                    <div key={dayKey} style={{
                        background: 'var(--bg-card)',
                        padding: '16px 8px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            {DAY_LABELS[dayKey]}
                        </div>

                        <div style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="44" height="44" viewBox="0 0 36 36">
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="var(--bg-app)"
                                    strokeWidth="3"
                                />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth="3"
                                    strokeDasharray={`${percentage}, 100`}
                                    strokeLinecap="round" // Round makes it nicer
                                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                />
                            </svg>
                            <span style={{ position: 'absolute', fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {stats.available}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default WeeklySessions;
