import React, { useState, useEffect } from 'react';
import { AlertTriangle, Home, Shield, Clock, Loader2 } from 'lucide-react';
import { applyConsequence, undoConsequence, subscribeToTransactions } from '../utils/storage';
import { isSameDay } from '../utils/dateUtils';

const DEFAULT_CONSEQUENCES = [
    { type: 'disrespect', label: 'Respeto', amount: 15, icon: 'AlertTriangle' },
    { type: 'disorder', label: 'Sin Orden', amount: 5, icon: 'Home' },
    { type: 'trust', label: 'Confianza', amount: 30, icon: 'Shield' },
    { type: 'rules', label: 'Normas', amount: 15, icon: 'Clock' }
];

const ICON_MAP = { AlertTriangle, Home, Shield, Clock };

function ConsequenceButtons({ profile, activeDate }) {
    const [transactions, setTransactions] = useState([]);
    const [processingKeys, setProcessingKeys] = useState(new Set());
    const consequences = profile.consequences || DEFAULT_CONSEQUENCES;

    useEffect(() => {
        const unsubscribe = subscribeToTransactions(profile.id, (data) => {
            setTransactions(data);
        });
        return () => unsubscribe();
    }, [profile.id]);

    const isSessionApplied = (type, session) => {
        const entriesOnDate = transactions.filter(tx =>
            (tx.type === 'consequence' || tx.type === 'consequence_reversal') &&
            tx.consequenceType === type &&
            tx.targetSession === session &&
            isSameDay(new Date(tx.timestamp), activeDate)
        );
        return entriesOnDate.reduce((sum, tx) => sum + Number(tx.amount || 0), 0) < 0;
    };

    const plannedDays = profile.weeklyPlan ? Object.entries(profile.weeklyPlan)
        .filter(([day, hours]) => hours > 0)
        .map(([day]) => day) : [];

    const handleToggle = async (consequence, session) => {
        const key = `${consequence.type}-${session}`;
        if (processingKeys.has(key)) return;

        const isApplied = isSessionApplied(consequence.type, session);
        setProcessingKeys(prev => new Set(prev).add(key));

        try {
            if (isApplied) {
                // UNDO
                await undoConsequence(profile.id, consequence.type, consequence.amount, consequence.label, activeDate, session);
            } else {
                // APPLY
                await applyConsequence(profile.id, consequence.type, consequence.amount, consequence.label, activeDate, session);
            }
        } finally {
            setProcessingKeys(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    const DAY_LABELS = {
        friday: 'VI', saturday: 'SA', sunday: 'DO', monday: 'LU',
        tuesday: 'MA', wednesday: 'MI', thursday: 'JU'
    };

    const plannedDayKeys = Object.keys(DAY_LABELS).filter(day => plannedDays.includes(day));

    if (consequences.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {consequences.map(consequence => {
                const Icon = ICON_MAP[consequence.icon] || AlertTriangle;

                return (
                    <div key={consequence.type} className="card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(255, 69, 58, 0.15)', padding: '6px', borderRadius: '8px' }}>
                                    <Icon size={18} color="var(--accent-danger)" />
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '15px' }}>{consequence.label}</span>
                            </div>
                            <span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>-{consequence.amount}m</span>
                        </div>

                        {/* Day Toggles */}
                        {plannedDayKeys.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {plannedDayKeys.map(day => {
                                    const isApplied = isSessionApplied(consequence.type, day);
                                    const isProcessing = processingKeys.has(`${consequence.type}-${day}`);

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => handleToggle(consequence, day)}
                                            style={{
                                                flex: 1,
                                                height: '32px',
                                                background: isApplied ? 'var(--accent-danger)' : 'var(--bg-app)',
                                                border: isApplied ? 'none' : '1px solid var(--border-subtle)',
                                                borderRadius: '6px',
                                                color: isApplied ? 'white' : 'var(--text-secondary)',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : DAY_LABELS[day]}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                Sin sesiones activas
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default ConsequenceButtons;
