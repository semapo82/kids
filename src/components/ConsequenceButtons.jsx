import React, { useState, useEffect } from 'react';
import { AlertTriangle, Home, Shield, Clock, CheckSquare, Square, Loader2 } from 'lucide-react';
import { applyConsequence, undoConsequence, subscribeToTransactions } from '../utils/storage';
import { isSameDay } from '../utils/dateUtils';

const DEFAULT_CONSEQUENCES = [
    { type: 'disrespect', label: 'Falta de respeto', amount: 15, icon: 'AlertTriangle', color: 'var(--color-danger)' },
    { type: 'disorder', label: 'Desorden', amount: 5, icon: 'Home', color: 'var(--color-warning)' },
    { type: 'trust', label: 'Confianza', amount: 30, icon: 'Shield', color: 'var(--color-danger)' },
    { type: 'rules', label: 'Reglas Básicas', amount: 15, icon: 'Clock', color: 'var(--color-danger)' }
];

const ICON_MAP = { AlertTriangle, Home, Shield, Clock };

function ConsequenceButtons({ profile, activeDate }) {
    const [transactions, setTransactions] = useState([]);
    const [processingKeys, setProcessingKeys] = useState(new Set()); // Key: consequenceType-session
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

        // Sum amounts. If sum < 0, it's applied.
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
                // UNDO for this specific day
                await undoConsequence(
                    profile.id,
                    consequence.type,
                    consequence.amount,
                    consequence.label,
                    activeDate,
                    session
                );
            } else {
                // APPLY for this specific day
                await applyConsequence(
                    profile.id,
                    consequence.type,
                    consequence.amount,
                    consequence.label,
                    activeDate,
                    session
                );
            }
        } catch (error) {
            console.error("Error toggling consequence:", error);
        } finally {
            setProcessingKeys(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    const DAY_LABELS = {
        friday: 'Vie', saturday: 'Sáb', sunday: 'Dom', monday: 'Lun',
        tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {consequences.map(consequence => {
                const Icon = ICON_MAP[consequence.icon] || AlertTriangle;

                return (
                    <div
                        key={consequence.type}
                        className="card"
                        style={{
                            padding: 'var(--spacing-md)',
                            background: 'var(--bg-secondary)',
                            transition: 'all var(--transition-base)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                padding: '10px',
                                borderRadius: '12px',
                                color: 'var(--color-danger)'
                            }}>
                                <Icon size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>
                                    {consequence.label}
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                    Penalización de {consequence.amount} min
                                </div>
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-danger)' }}>
                                -{consequence.amount}
                            </div>
                        </div>

                        {/* Session Checkboxes */}
                        {plannedDays.length > 0 ? (
                            <div
                                className="mobile-grid-2"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))',
                                    gap: 'var(--spacing-xs)',
                                    paddingTop: 'var(--spacing-md)',
                                    borderTop: '1px solid var(--border-color)'
                                }}
                            >
                                {plannedDays.map(day => {
                                    const key = `${consequence.type}-${day}`;
                                    const isApplied = isSessionApplied(consequence.type, day);
                                    const isProcessing = processingKeys.has(key);

                                    return (
                                        <button
                                            key={day}
                                            disabled={isProcessing}
                                            onClick={() => handleToggle(consequence, day)}
                                            style={{
                                                padding: '10px 8px',
                                                borderRadius: 'var(--border-radius-sm)',
                                                border: '2px solid',
                                                borderColor: isApplied ? 'var(--color-danger)' : 'var(--border-color)',
                                                background: isApplied ? 'var(--color-danger-light)' : 'transparent',
                                                color: isApplied ? 'var(--color-danger)' : 'var(--text-primary)',
                                                cursor: isProcessing ? 'wait' : 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '4px',
                                                transition: 'all var(--transition-fast)',
                                                opacity: isProcessing ? 0.6 : 1
                                            }}
                                        >
                                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>
                                                {DAY_LABELS[day]}
                                            </span>
                                            {isProcessing ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : isApplied ? (
                                                <CheckSquare size={20} />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', opacity: 0.7 }}>
                                Configura sesiones en el perfil para aplicar consecuencias.
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default ConsequenceButtons;
