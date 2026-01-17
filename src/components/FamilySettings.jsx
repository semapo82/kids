import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Copy, Check, Smartphone } from 'lucide-react';
import { getActiveFamilyId, joinFamily } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

function FamilySettings() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [familyId, setFamilyId] = useState('');
    const [newFamilyId, setNewFamilyId] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const id = getActiveFamilyId();
        if (id) {
            setFamilyId(id);
        }
    }, [user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(familyId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!newFamilyId.trim()) return;

        if (window.confirm('¿Estás seguro de que quieres unirte a esta familia? Dejarás de ver tus perfiles actuales.')) {
            setLoading(true);
            try {
                await joinFamily(newFamilyId.trim());
                alert('¡Te has unido a la familia con éxito!');
                navigate('/');
            } catch (error) {
                alert('Error al unirse a la familia: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    if (!user) {
        return (
            <div className="fade-in" style={{ paddingTop: '40vh', textAlign: 'center', padding: '0 20px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-primary)' }}>Inicia sesión para gestionar tu familia</h2>
                <button
                    onClick={() => navigate('/')}
                    className="btn-primary"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            <h1 className="header-large">Sincronización</h1>

            {/* My Family Code Section */}
            <div style={{ marginBottom: '32px' }}>
                <span className="text-label" style={{ paddingLeft: '16px' }}>TU CÓDIGO ACTUAL</span>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: 'rgba(10, 132, 255, 0.15)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-primary)'
                        }}>
                            <Users size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 600 }}>Familia Activa</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Comparte este código para sincronizar</div>
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '16px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontSize: '16px',
                        wordBreak: 'break-all',
                        letterSpacing: '0.5px',
                        fontWeight: 700,
                        color: 'var(--accent-primary)'
                    }}>
                        {familyId || 'Cargando...'}
                    </div>

                    <button
                        onClick={handleCopy}
                        disabled={!familyId}
                        style={{
                            background: copied ? 'var(--accent-success)' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '10px',
                            color: copied ? 'white' : 'var(--text-primary)',
                            padding: '12px',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copiado al portapapeles' : 'Copiar Código'}
                    </button>
                </div>
            </div>

            {/* Join Family Section */}
            <div>
                <span className="text-label" style={{ paddingLeft: '16px' }}>UNIRSE A OTRA FAMILIA</span>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            background: 'rgba(48, 209, 88, 0.15)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-success)'
                        }}>
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 600 }}>Sincronizar Dispositivo</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ingresa el código de otro dispositivo</div>
                        </div>
                    </div>

                    <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input
                            type="text"
                            className="input"
                            style={{ fontSize: '15px' }}
                            placeholder="Pega el código aquí..."
                            value={newFamilyId}
                            onChange={(e) => setNewFamilyId(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading || !newFamilyId.trim()}
                            style={{
                                background: 'var(--accent-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '14px',
                                fontSize: '17px',
                                fontWeight: 600,
                                width: '100%',
                                cursor: loading ? 'default' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Sincronizando...' : 'Unirse ahora'}
                        </button>
                    </form>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', paddingLeft: '16px', marginTop: '8px', lineHeight: '1.4' }}>
                    Al unirte, reemplazarás los datos actuales por los de la familia a la que te unes.
                </p>
            </div>
        </div>
    );
}

export default FamilySettings;
