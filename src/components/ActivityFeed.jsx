import React, { useState, useEffect } from 'react';
import { subscribeToTransactions, subscribeToFamilyChange } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { TrendingUp, TrendingDown, RotateCcw, Coins } from 'lucide-react';

function ActivityFeed({ profileId }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        let unsubscribeTransactions = () => { };
        const unsubscribeFamily = subscribeToFamilyChange(() => {
            setLoading(true);
            unsubscribeTransactions();
            unsubscribeTransactions = subscribeToTransactions(profileId, (data) => {
                setTransactions(data);
                setLoading(false);
            }, 50);
        });
        return () => {
            unsubscribeFamily();
            unsubscribeTransactions();
        };
    }, [profileId]);

    if (loading) return <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>Cargando actividad...</div>;
    if (transactions.length === 0) return <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>Sin actividad reciente</div>;

    const getIcon = (type) => {
        switch (type) {
            case 'task': case 'initiative': return TrendingUp;
            case 'consequence': return TrendingDown;
            case 'redemption': return Coins;
            case 'reset': return RotateCcw;
            default: return TrendingUp;
        }
    };

    return (
        <div style={{ padding: '0 16px', overflowY: 'auto', maxHeight: '300px' }}>
            {transactions.map((tx, idx) => {
                const Icon = getIcon(tx.type);
                const isPositive = tx.amount > 0;
                const color = isPositive ? 'var(--accent-success)' : 'var(--accent-danger)';

                return (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: idx < transactions.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isPositive ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 69, 58, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={16} color={color} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{tx.description}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(new Date(tx.timestamp), 'd MMM, HH:mm')}</div>
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: color }}>
                            {isPositive ? '+' : ''}{tx.amount}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default ActivityFeed;
