import React from 'react';
import { Coins, Lock } from 'lucide-react';
import { redeemTime } from '../utils/storage';

function BankingModule({ profile, onUpdate }) {
    const isLocked = profile.balance <= 0;

    const handleRedeem = (minutes) => {
        try {
            redeemTime(profile.id, minutes);
            onUpdate();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className={`card ${isLocked ? 'locked' : ''}`}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <Coins size={32} color="var(--color-info)" />
                <div>
                    <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-xs)' }}>
                        🏦 La Banca
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        Canjea tus minutos acumulados
                    </p>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)'
            }}>
                {/* 1 Hour */}
                <button
                    onClick={() => handleRedeem(60)}
                    disabled={isLocked}
                    className="btn btn-lg"
                    style={{
                        flexDirection: 'column',
                        padding: 'var(--spacing-xl)',
                        background: 'linear-gradient(135deg, var(--color-info) 0%, #2563eb 100%)',
                        color: 'white',
                        opacity: isLocked ? 0.5 : 1
                    }}
                >
                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, marginBottom: 'var(--spacing-sm)' }}>
                        1 Hora
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>
                        Canjear 60 Min
                    </div>
                </button>

                {/* 15 Minutes */}
                <button
                    onClick={() => handleRedeem(15)}
                    disabled={isLocked}
                    className="btn btn-lg"
                    style={{
                        flexDirection: 'column',
                        padding: 'var(--spacing-xl)',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        opacity: isLocked ? 0.5 : 1
                    }}
                >
                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, marginBottom: 'var(--spacing-sm)' }}>
                        15 Min
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>
                        Canjear 15 Min
                    </div>
                </button>
            </div>

            {isLocked && (
                <div style={{
                    marginTop: 'var(--spacing-lg)',
                    padding: 'var(--spacing-md)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--color-danger)',
                    textAlign: 'center',
                    color: 'var(--color-danger)',
                    fontWeight: 600
                }}>
                    <Lock size={20} style={{ marginRight: 'var(--spacing-sm)' }} />
                    Privilegios Suspendidos - Saldo insuficiente
                </div>
            )}
        </div>
    );
}

export default BankingModule;
