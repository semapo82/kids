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

    const isConsequenceAppliedOnDate = (type) => {
        const entriesOnDate = transactions.filter(tx =>
            (tx.type === 'consequence' || tx.type === 'consequence_reversal') &&
            tx.consequenceType === type &&
            isSameDay(new Date(tx.timestamp), activeDate)
        );

        const netBalance = entriesOnDate.reduce((sum, tx) => {
            return sum + (tx.type === 'consequence' ? 1 : -1);
        }, 0);

        return netBalance > 0;
    };

    const handleToggle = async (consequence, isApplied) => {
        if (processingTypes.has(consequence.type)) return;

        setProcessingTypes(prev => new Set(prev).add(consequence.type));
        try {
            if (isApplied) {
                await undoConsequence(profile.id, consequence.type, consequence.amount, consequence.label, activeDate);
            } else {
                await applyConsequence(profile.id, consequence.type, consequence.amount, consequence.label, activeDate);
            }
        } finally {
            setProcessingTypes(prev => {
                const next = new Set(prev);
                next.delete(consequence.type);
                return next;
            });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {consequences.map(consequence => {
                const Icon = ICON_MAP[consequence.icon] || AlertTriangle;
                const color = consequence.color === '#dc2626' ? 'var(--color-danger)' : consequence.color;
                const isApplied = isConsequenceAppliedOnDate(consequence.type);
                const isProcessing = processingTypes.has(consequence.type);

                return (
                    <div
                        key={consequence.type}
                        onClick={() => handleToggle(consequence, isApplied)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            padding: 'var(--spacing-md)',
                            background: isApplied ? 'var(--color-danger-light)' : 'var(--bg-secondary)',
                            borderRadius: 'var(--border-radius-sm)',
                            cursor: isProcessing ? 'wait' : 'pointer',
                            transition: 'all var(--transition-fast)',
                            border: '2px solid',
                            borderColor: isApplied ? 'var(--color-danger)' : 'transparent',
                            opacity: isProcessing ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-danger)';
                            if (!isApplied) e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isApplied ? 'var(--color-danger)' : 'transparent';
                            if (!isApplied) e.currentTarget.style.transform = 'none';
                        }}
                    >
                        {isProcessing ? (
                            <Loader2 size={24} className="animate-spin" color="var(--color-danger)" />
                        ) : isApplied ? (
                            <CheckSquare size={24} color="var(--color-danger)" fill="white" />
                        ) : (
                            <Square size={24} color="var(--text-muted)" />
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
                );
            })}
        </div>
    );
}

export default ConsequenceButtons;
