import React from 'react';
import { AlertTriangle, Home, Shield, Clock } from 'lucide-react';
import { applyConsequence } from '../utils/storage';

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

function ConsequenceButtons({ profile, activeDate, onUpdate }) {
    const consequences = profile.consequences || DEFAULT_CONSEQUENCES;
    const handleConsequence = async (consequence) => {
        if (window.confirm(`¿Aplicar consecuencia: ${consequence.label} (-${consequence.amount} Min)?`)) {
            await applyConsequence(profile.id, consequence.type, consequence.amount, consequence.label, activeDate);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {consequences.map(consequence => {
                const Icon = ICON_MAP[consequence.icon] || AlertTriangle;
                // Normalizar color si viene de datos antiguos
                const color = consequence.color === '#dc2626' ? 'var(--color-danger)' : consequence.color;

                return (
                    <button
                        key={consequence.type}
                        onClick={() => handleConsequence(consequence)}
                        className="btn"
                        style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                            color: 'white',
                            padding: 'var(--spacing-md)',
                            textAlign: 'left'
                        }}
                    >
                        <Icon size={20} />
                        <div style={{ flex: 1, fontWeight: 600 }}>
                            {consequence.label}
                        </div>
                        <div style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 700
                        }}>
                            -{consequence.amount} Min
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

export default ConsequenceButtons;
