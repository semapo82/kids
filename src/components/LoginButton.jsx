import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, LogOut, User } from 'lucide-react';

function LoginButton() {
    const { user, loginWithGoogle, logout } = useAuth();

    if (user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    {user.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--primary-color)' }}
                        />
                    ) : (
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <User size={18} />
                        </div>
                    )}
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, display: 'none', md: 'block' }}>
                        {user.displayName}
                    </span>
                </div>
                <button
                    onClick={logout}
                    className="btn btn-sm btn-secondary"
                    title="Cerrar sesión"
                    style={{ padding: '6px 8px' }}
                >
                    <LogOut size={16} />
                    <span className="hide-mobile" style={{ marginLeft: '6px' }}>Salir</span>
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={loginWithGoogle}
            className="btn btn-sm btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: '6px 8px' }}
        >
            <LogIn size={18} />
            <span className="hide-mobile">Sincronizar</span>
        </button>
    );
}

export default LoginButton;
