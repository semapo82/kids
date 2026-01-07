import React, { useState } from 'react';
import { CheckCircle, Circle, Lightbulb } from 'lucide-react';
import { completeTask, addInitiative } from '../utils/storage';

function TaskChecklist({ profile, onUpdate }) {
    const [initiativeText, setInitiativeText] = useState('');

    const handleTaskComplete = (taskId) => {
        completeTask(profile.id, taskId);
        onUpdate();
    };

    const handleInitiative = () => {
        if (!initiativeText.trim()) {
            alert('Por favor describe la iniciativa');
            return;
        }

        addInitiative(profile.id, initiativeText);
        setInitiativeText('');
        onUpdate();
    };

    return (
        <div>
            {/* Regular Tasks */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                {profile.tasks.map(task => (
                    <div
                        key={task.id}
                        onClick={() => !task.completedToday && handleTaskComplete(task.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            padding: 'var(--spacing-md)',
                            background: task.completedToday ? 'var(--color-success-light)' : 'var(--bg-secondary)',
                            borderRadius: 'var(--border-radius-sm)',
                            marginBottom: 'var(--spacing-sm)',
                            cursor: task.completedToday ? 'default' : 'pointer',
                            transition: 'all var(--transition-fast)',
                            border: '2px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                            if (!task.completedToday) {
                                e.currentTarget.style.borderColor = 'var(--color-success)';
                                e.currentTarget.style.transform = 'translateX(4px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                    >
                        {task.completedToday ? (
                            <CheckCircle size={24} color="var(--color-success)" />
                        ) : (
                            <Circle size={24} color="var(--text-muted)" />
                        )}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontWeight: 500,
                                color: task.completedToday ? 'var(--color-success)' : 'var(--text-primary)',
                                textDecoration: task.completedToday ? 'line-through' : 'none'
                            }}>
                                {task.name}
                            </div>
                        </div>
                        <div className="badge badge-success">
                            +{task.points} Min
                        </div>
                    </div>
                ))}
            </div>

            {/* Initiative Button */}
            <div style={{
                padding: 'var(--spacing-md)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
                borderRadius: 'var(--border-radius)',
                border: '2px dashed var(--color-warning)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--color-warning)',
                    fontWeight: 600
                }}>
                    <Lightbulb size={20} />
                    Iniciativa
                </div>
                <input
                    type="text"
                    className="input"
                    value={initiativeText}
                    onChange={(e) => setInitiativeText(e.target.value)}
                    placeholder="Describe tu iniciativa..."
                    maxLength={255}
                    style={{ marginBottom: 'var(--spacing-sm)' }}
                />
                <button
                    onClick={handleInitiative}
                    className="btn btn-sm"
                    style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, var(--color-warning) 0%, #d97706 100%)',
                        color: 'white'
                    }}
                >
                    <Lightbulb size={16} />
                    Registrar Iniciativa (+5 Min)
                </button>
            </div>
        </div>
    );
}

export default TaskChecklist;
