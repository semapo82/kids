import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, UserCircle } from 'lucide-react';

function LoginButton() {
    const { user, loginWithGoogle, logout } = useAuth();

    if (user) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(28, 28, 30, 0.6)',
                backdropFilter: 'blur(10px)',
                padding: '4px 12px 4px 4px',
                borderRadius: '100px',
                border: '0.5px solid rgba(255,255,255,0.1)'
            }}>
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName}
                        referrerPolicy="no-referrer"
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={14} color="var(--text-secondary)" />
                    </div>
                )}

                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '80px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {user.displayName?.split(' ')[0]}
                </span>

                <button
                    onClick={logout}
                    style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--accent-danger)', display: 'flex' }}
                >
                    <LogOut size={16} />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={loginWithGoogle}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '100px',
                border: 'none',
                background: 'rgba(10, 132, 255, 0.15)',
                color: '#0A84FF',
                fontSize: '13px',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                cursor: 'pointer'
            }}
        >
            <UserCircle size={20} />
            <span>Sincronizar</span>
        </button>
    );
}

export default LoginButton;
