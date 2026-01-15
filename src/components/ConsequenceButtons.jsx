import React, { useState, useEffect } from 'react';
import { AlertTriangle, Home, Shield, Clock, CheckSquare, Square, Loader2 } from 'lucide-react';
import { applyConsequence, undoConsequence, subscribeToTransactions } from '../utils/storage';
import { isSameDay } from '../utils/dateUtils';

const DEFAULT_CONSEQUENCES = [
    {
        type: 'disrespect',
        label: 'Falta de respeto',
        amount: 15,
        icon: 'AlertTriangle',
        color: 'var(--color-danger)'
    },
    {
        type: 'disorder',
        label: 'Desorden',
        amount: 5,
        icon: 'Home',
        color: 'var(--color-warning)'
    },
    {
        type: 'trust',
        label: 'Confianza',
        amount: 30,
        icon: 'Shield',
        color: 'var(--color-danger)'
    },
    {
        type: 'rules',
        label: 'Reglas Básicas',
        amount: 15,
        icon: 'Clock',
        color: 'var(--color-danger)'
    }
];

const ICON_MAP = {
    AlertTriangle,
    Home,
    Shield,
    Clock
};

function ConsequenceButtons({ profile, activeDate }) {
    const [transactions, setTransactions] = useState([]);
    const [processingTypes, setProcessingTypes] = useState(new Set());
    const consequences = profile.consequences || DEFAULT_CONSEQUENCES;

    useEffect(() => {
        const unsubscribe = subscribeToTransactions(profile.id, (data) => {
            setTransactions(data);
        });
        return () => unsubscribe();
    }, [profile.id]);

    const getAppliedSession = (type) => {
        const entriesOnDate = transactions.filter(tx =>
            (tx.type === 'consequence' || tx.type === 'consequence_reversal') &&
            tx.consequenceType === type &&
            isSameDay(new Date(tx.timestamp), activeDate)
        );

        const netBalance = entriesOnDate.reduce((sum, tx) => {
            return sum + (tx.type === 'consequence' ? 1 : -1);
        }, 0);

        if (netBalance <= 0) return null;

        // Find the last consequence record to see its targetSession
        const lastRecord = [...entriesOnDate].reverse().find(tx => tx.type === 'consequence');
        return lastRecord?.targetSession || 'general';
    };

    const handleToggle = async (consequence, currentSession, targetSession = null) => {
        const isApplied = Boolean(currentSession);
        if (processingTypes.has(consequence.type)) return;

        setProcessingTypes(prev => new Set(prev).add(consequence.type));
        try {
            if (isApplied) {
                // If clicking the SAME session, undo it.
                // If clicking a DIFFERENT session while applied... we should probably undo old and apply new?
                // For simplicity, if applied, any click on its sessions UNDOES it.
                await undoConsequence(profile.id, consequence.type, consequence.amount, consequence.label, activeDate, currentSession === 'general' ? null : currentSession);
            } else {
                await applyConsequence(profile.id, consequence.type, consequence.amount, consequence.label, activeDate, targetSession === 'general' ? null : targetSession);
            }
        } finally {
            setProcessingTypes(prev => {
                const next = new Set(prev);
                next.delete(consequence.type);
                return next;
            });
        }
    };

    const plannedDays = profile.weeklyPlan ? Object.entries(profile.weeklyPlan)
        .filter(([day, hours]) => hours > 0)
        .map(([day]) => day) : [];

    const DAY_LABELS = {
        friday: 'Vie', saturday: 'Sáb', sunday: 'Dom', monday: 'Lun',
        tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {consequences.map(consequence => {
                const Icon = ICON_MAP[consequence.icon] || AlertTriangle;
                const currentSession = getAppliedSession(consequence.type);
                const isApplied = Boolean(currentSession);
                const isProcessing = processingTypes.has(consequence.type);

                return (
                    <div
                        key={consequence.type}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-xs)',
                            background: isApplied ? 'var(--color-danger-light)' : 'var(--bg-secondary)',
                            borderRadius: 'var(--border-radius-sm)',
                            padding: 'var(--spacing-md)',
                            border: '2px solid',
                            borderColor: isApplied ? 'var(--color-danger)' : 'transparent',
                            opacity: isProcessing ? 0.6 : 1,
                            transition: 'all var(--transition-fast)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: plannedDays.length > 0 ? 'var(--spacing-xs)' : 0 }}>
                            {isProcessing ? (
                                <Loader2 size={24} className="animate-spin" color="var(--color-danger)" />
                            ) : isApplied ? (
                                <CheckSquare size={24} color="var(--color-danger)" fill="white" onClick={() => handleToggle(consequence, currentSession)} style={{ cursor: 'pointer' }} />
                            ) : (
                                <Square size={24} color="var(--text-muted)" onClick={() => handleToggle(consequence, null, 'general')} style={{ cursor: 'pointer' }} />
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: 600,
                                    color: isApplied ? 'var(--color-danger)' : 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)'
                                }}>
                                    <Icon size={18} />
                                    {consequence.label}
                                    {isApplied && currentSession !== 'general' && (
                                        <span className="badge badge-danger" style={{ fontSize: '10px' }}>
                                            EN: {DAY_LABELS[currentSession]}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{
                                fontSize: 'var(--font-size-lg)',
                                fontWeight: 700,
                                color: isApplied ? 'var(--color-danger)' : 'var(--text-muted)'
                            }}>
                                -{consequence.amount} Min
                            </div>
                        </div>

                        {/* Session selection pills if plan exists and not applied or applied to specific day */}
                        {plannedDays.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', marginLeft: '36px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
                                    Afectar a:
                                </span>
                                {['general', ...plannedDays].map(day => {
                                    const active = currentSession === day;
                                    return (
                                        <button
                                            key={day}
                                            disabled={isProcessing}
                                            onClick={(e) => { e.stopPropagation(); handleToggle(consequence, currentSession, day); }}
                                            style={{
                                                padding: '2px 8px',
                                                borderRadius: '99px',
                                                border: '1px solid',
                                                borderColor: active ? 'var(--color-danger)' : 'var(--border-color)',
                                                background: active ? 'var(--color-danger)' : 'transparent',
                                                color: active ? 'white' : 'var(--text-muted)',
                                                fontSize: '10px',
                                                cursor: isProcessing ? 'wait' : 'pointer',
                                                fontWeight: active ? 700 : 400
                                            }}
                                        >
                                            {day === 'general' ? 'Gral' : DAY_LABELS[day]}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default ConsequenceButtons;
