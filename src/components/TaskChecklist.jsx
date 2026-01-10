import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Lightbulb } from 'lucide-react';
import { completeTask, undoTaskCompletion, addInitiative, subscribeToTransactions } from '../utils/storage';
import { isSameDay } from '../utils/dateUtils';

function TaskChecklist({ profile, activeDate }) {
    const [initiativeText, setInitiativeText] = useState('');
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToTransactions(profile.id, (data) => {
            setTransactions(data);
        });
        return () => unsubscribe();
    }, [profile.id]);

    const handleTaskToggle = async (taskId, isCurrentlyCompleted) => {
        if (isCurrentlyCompleted) {
            await undoTaskCompletion(profile.id, taskId, activeDate);
        } else {
            await completeTask(profile.id, taskId, activeDate);
        }
    };

    const handleInitiative = async () => {
        if (!initiativeText.trim()) {
            alert('Por favor describe la iniciativa');
            return;
        }

        await addInitiative(profile.id, initiativeText, activeDate);
        setInitiativeText('');
    };

    const isTaskCompletedOnDate = (taskId) => {
        // Calculate net completion count for this task on this date
        // (number of 'task' entries minus number of 'task_reversal' entries)
        const entriesOnDate = transactions.filter(tx =>
            (tx.type === 'task' || tx.type === 'task_reversal') &&
            tx.taskId === taskId &&
            isSameDay(new Date(tx.timestamp), activeDate)
        );

        const netBalance = entriesOnDate.reduce((sum, tx) => {
            return sum + (tx.type === 'task' ? 1 : -1);
        }, 0);

        return netBalance > 0;
    };

    return (
        <div>
            {/* Regular Tasks */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                {profile.tasks.map(task => {
                    const isCompleted = isTaskCompletedOnDate(task.id);
                    return (
                        <div
                            key={task.id}
                            onClick={() => handleTaskToggle(task.id, isCompleted)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-md)',
                                padding: 'var(--spacing-md)',
                                background: isCompleted ? 'var(--color-success-light)' : 'var(--bg-secondary)',
                                borderRadius: 'var(--border-radius-sm)',
                                marginBottom: 'var(--spacing-sm)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                                border: '2px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                if (!isCompleted) {
                                    e.currentTarget.style.borderColor = 'var(--color-success)';
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'transparent';
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >
                            {isCompleted ? (
                                <CheckCircle size={24} color="var(--color-success)" />
                            ) : (
                                <Circle size={24} color="var(--text-muted)" />
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: 500,
                                    color: isCompleted ? 'var(--color-success)' : 'var(--text-primary)',
                                    textDecoration: isCompleted ? 'line-through' : 'none'
                                }}>
                                    {task.name}
                                </div>
                            </div>
                            <div className="badge badge-success">
                                +{task.points} Min
                            </div>
                        </div>
                    );
                })}
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
