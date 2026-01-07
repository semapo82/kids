import React, { useState, useEffect } from 'react';
import { subscribeToTransactions } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { TrendingUp, TrendingDown, RotateCcw, Coins } from 'lucide-react';

function ActivityFeed({ profileId }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToTransactions(profileId, (data) => {
            setTransactions(data);
            setLoading(false);
        }, 5);

        return () => unsubscribe();
    }, [profileId, user]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>Cargando actividad...</div>;
    }

    if (transactions.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                No hay actividad reciente
            </div>
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case 'task':
            case 'initiative':
                return TrendingUp;
            case 'consequence':
                return TrendingDown;
            case 'redemption':
                return Coins;
            case 'reset':
                return RotateCcw;
            default:
                return TrendingUp;
        }
    };

    const getColor = (amount) => {
        return amount > 0 ? 'var(--color-success)' : 'var(--color-danger)';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {transactions.map(tx => {
                const Icon = getIcon(tx.type);
                const color = getColor(tx.amount);

                return (
                    <div
                        key={tx.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            padding: 'var(--spacing-md)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--border-radius-sm)',
                            borderLeft: `4px solid ${color}`
                        }}
                    >
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: `${color}22`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Icon size={20} color={color} />
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                {tx.description}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                {formatDate(new Date(tx.timestamp), 'PPp')}
                            </div>
                        </div>

                        <div style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 700,
                            color
                        }}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount} Min
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ActivityFeed;
