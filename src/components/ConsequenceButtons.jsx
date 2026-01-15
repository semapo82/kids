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

        const lastRecord = entriesOnDate.find(tx => tx.type === 'consequence');
        return lastRecord?.targetSession || null;
    };

    const plannedDays = profile.weeklyPlan ? Object.entries(profile.weeklyPlan)
        .filter(([day, hours]) => hours > 0)
        .map(([day]) => day) : [];

    const handleToggle = async (consequence, targetSession = null) => {
        if (processingTypes.has(consequence.type)) return;

        const currentSession = getAppliedSession(consequence.type);
        const isApplied = Boolean(currentSession);

        // Si no hay sesión destino y hay plan, usamos la primera disponible por defecto.
        // Si no hay plan, no hay targetSession (null).
        const finalTarget = targetSession || (plannedDays.length > 0 ? plannedDays[0] : null);

        setProcessingTypes(prev => new Set(prev).add(consequence.type));

        try {
            if (isApplied) {
                // Si hacemos clic sin especificar sesión (en el check) o en la sesión activa -> Desmarcamos
                if (!targetSession || currentSession === targetSession) {
                    await undoConsequence(
                        profile.id,
                        consequence.type,
                        consequence.amount,
                        consequence.label,
                        activeDate,
                        currentSession
                    );
                } else {
                    // Cambio de sesión (Undo antigua + Apply nueva)
                    await undoConsequence(
                        profile.id,
                        consequence.type,
                        consequence.amount,
                        consequence.label,
                        activeDate,
                        currentSession
                    );
                    await applyConsequence(
                        profile.id,
                        consequence.type,
                        consequence.amount,
                        consequence.label,
                        activeDate,
                        finalTarget
                    );
                }
            } else {
                // Aplicar a la sesión final
                await applyConsequence(
                    profile.id,
                    consequence.type,
                    consequence.amount,
                    consequence.label,
                    activeDate,
                    finalTarget
                );
            }
        } catch (error) {
            console.error("Error toggling consequence:", error);
            alert("Error al procesar la consecuencia");
        } finally {
            setProcessingTypes(prev => {
                const next = new Set(prev);
                next.delete(consequence.type);
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
                const currentSession = getAppliedSession(consequence.type);
                const isApplied = Boolean(currentSession);
                const isProcessing = processingTypes.has(consequence.type);

                return (
                    <div
                        key={consequence.type}
                        className="card"
                        style={{
                            padding: 'var(--spacing-md)',
                            background: isApplied ? 'var(--color-danger-light)' : 'var(--bg-secondary)',
                            border: '2px solid',
                            borderColor: isApplied ? 'var(--color-danger)' : 'transparent',
                            opacity: isProcessing ? 0.7 : 1,
                            transition: 'all var(--transition-base)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                            <div
                                onClick={() => handleToggle(consequence, isApplied ? currentSession : null)}
                                style={{
                                    cursor: isProcessing ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingRight: 'var(--spacing-sm)'
                                }}
                            >
                                {isProcessing ? (
                                    <Loader2 size={24} className="animate-spin" color="var(--color-danger)" />
                                ) : isApplied ? (
                                    <CheckSquare size={24} color="var(--color-danger)" fill="white" />
                                ) : (
                                    <Square size={24} color="var(--text-muted)" />
                                )}
                            </div>

                            <div
                                style={{ flex: 1, cursor: isProcessing ? 'wait' : 'pointer' }}
                                onClick={() => handleToggle(consequence, isApplied ? currentSession : null)}
                            >
                                <div style={{
                                    fontWeight: 700,
                                    color: isApplied ? 'var(--color-danger)' : 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    marginBottom: '2px'
                                }}>
                                    <Icon size={18} />
                                    {consequence.label}
                                </div>
                                <div style={{ fontSize: '12px', color: isApplied ? 'var(--color-danger)' : 'var(--text-muted)', opacity: 0.8 }}>
                                    {isApplied
                                        ? `Penalización activa en: ${DAY_LABELS[currentSession] || 'Saldo General'}`
                                        : 'Haz clic para aplicar penalización'}
                                </div>
                            </div>

                            <div style={{
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 800,
                                color: isApplied ? 'var(--color-danger)' : 'var(--text-muted)'
                            }}>
                                -{consequence.amount}
                            </div>
                        </div>

                        {/* Session Selection Pills */}
                        {plannedDays.length > 0 && (
                            <div style={{
                                marginTop: 'var(--spacing-md)',
                                paddingTop: 'var(--spacing-sm)',
                                borderTop: '1px solid',
                                borderColor: isApplied ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                display: 'flex',
                                gap: 'var(--spacing-sm)',
                                flexWrap: 'wrap',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: isApplied ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                                    {isApplied ? 'Cambiar sesión:' : 'Elegir sesión específica:'}
                                </span>
                                {plannedDays.map(day => {
                                    const isActive = currentSession === day;
                                    return (
                                        <button
                                            key={day}
                                            disabled={isProcessing}
                                            onClick={(e) => { e.stopPropagation(); handleToggle(consequence, day); }}
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: '99px',
                                                border: '1px solid',
                                                borderColor: isActive ? 'var(--color-danger)' : 'var(--border-color)',
                                                background: isActive ? 'var(--color-danger)' : 'transparent',
                                                color: isActive ? 'white' : 'var(--text-primary)',
                                                fontSize: '11px',
                                                cursor: isProcessing ? 'wait' : 'pointer',
                                                fontWeight: isActive ? 700 : 500,
                                                transition: 'all var(--transition-fast)'
                                            }}
                                        >
                                            {DAY_LABELS[day]}
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
