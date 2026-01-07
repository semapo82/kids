import React from 'react';
import { AlertTriangle, Home, Shield, Clock } from 'lucide-react';
import { applyConsequence } from '../utils/storage';

const CONSEQUENCES = [
    {
        type: 'disrespect',
        label: 'Falta de respeto',
        description: 'Gritos/Groserías',
        amount: 15,
        icon: AlertTriangle,
        color: 'var(--color-danger)'
    },
    {
        type: 'disorder',
        label: 'Desorden',
        description: 'Zonas comunes',
        amount: 5,
        icon: Home,
        color: 'var(--color-warning)'
    },
    {
        type: 'trust',
        label: 'Confianza',
        description: 'Mentiras',
        amount: 30,
        icon: Shield,
        color: '#dc2626'
    },
    {
        type: 'rules',
        label: 'Reglas Básicas',
        description: 'Saltarse horarios',
        amount: 15,
        icon: Clock,
        color: 'var(--color-danger)'
    }
];

function ConsequenceButtons({ profileId, onUpdate }) {
    const handleConsequence = async (consequence) => {
        if (window.confirm(`¿Aplicar consecuencia: ${consequence.label} (-${consequence.amount} Min)?`)) {
            await applyConsequence(profileId, consequence.type, consequence.amount, consequence.description);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {CONSEQUENCES.map(consequence => {
                const Icon = consequence.icon;
                return (
                    <button
                        key={consequence.type}
                        onClick={() => handleConsequence(consequence)}
                        className="btn"
                        style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            background: `linear-gradient(135deg, ${consequence.color} 0%, ${consequence.color}dd 100%)`,
                            color: 'white',
                            padding: 'var(--spacing-md)',
                            textAlign: 'left'
                        }}
                    >
                        <Icon size={20} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{consequence.label}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.9 }}>
                                {consequence.description}
                            </div>
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
