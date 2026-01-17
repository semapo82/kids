import React from 'react';
import { Lock } from 'lucide-react';
import { redeemTime } from '../utils/storage';

function BankingModule({ profile, activeDate }) {
    const isLocked = (profile.balance || 0) <= 0;

    const handleRedeem = async (minutes) => {
        try {
            await redeemTime(profile.id, minutes, activeDate);
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                    onClick={() => handleRedeem(60)}
                    disabled={isLocked}
                    className="card"
                    style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, #0A84FF 0%, #007AFF 100%)',
                        color: 'white',
                        border: 'none',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.5 : 1,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        height: '120px'
                    }}
                >
                    <span style={{ fontSize: '32px', fontWeight: 800 }}>60</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>Minutos</span>
                </button>

                <button
                    onClick={() => handleRedeem(15)}
                    disabled={isLocked}
                    className="card"
                    style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, #BF5AF2 0%, #AF52DE 100%)',
                        color: 'white',
                        border: 'none',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.5 : 1,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        height: '120px'
                    }}
                >
                    <span style={{ fontSize: '32px', fontWeight: 800 }}>15</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>Minutos</span>
                </button>
            </div>

            {isLocked && (
                <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(255, 69, 58, 0.15)',
                    borderRadius: '12px',
                    color: 'var(--accent-danger)',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}>
                    <Lock size={16} />
                    <span>Privilegios Suspendidos</span>
                </div>
            )}
        </div>
    );
}

export default BankingModule;
