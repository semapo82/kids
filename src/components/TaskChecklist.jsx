import React, { useState, useEffect } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { completeTask, undoTaskCompletion, addInitiative, subscribeToTransactions } from '../utils/storage';
import { isSameDay } from '../utils/dateUtils';

function TaskChecklist({ profile, activeDate }) {
    const [initiativeText, setInitiativeText] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [processingTasks, setProcessingTasks] = useState(new Set());

    useEffect(() => {
        const unsubscribe = subscribeToTransactions(profile.id, (data) => {
            setTransactions(data);
        });
        return () => unsubscribe();
    }, [profile.id]);

    const handleTaskToggle = async (taskId, isCurrentlyCompleted) => {
        if (processingTasks.has(taskId)) return;

        setProcessingTasks(prev => new Set(prev).add(taskId));
        try {
            if (isCurrentlyCompleted) {
                await undoTaskCompletion(profile.id, taskId, activeDate);
            } else {
                await completeTask(profile.id, taskId, activeDate);
            }
        } finally {
            setProcessingTasks(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    };

    const isTaskCompletedOnDate = (taskId) => {
        // LOGIC PRESERVED: Net Balance calculation
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {profile.tasks.map((task, index) => {
                    const isCompleted = isTaskCompletedOnDate(task.id);
                    const isProcessing = processingTasks.has(task.id);
                    const isLast = index === profile.tasks.length - 1;

                    return (
                        <div
                            key={task.id}
                            onClick={() => handleTaskToggle(task.id, isCompleted)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                background: 'var(--bg-card)',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                borderBottom: isLast ? 'none' : '0.5px solid var(--border-subtle)'
                            }}
                        >
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: isCompleted ? 'none' : '2px solid var(--text-tertiary)',
                                background: isCompleted ? 'var(--accent-success)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {isProcessing ? (
                                    <Loader2 size={14} className="animate-spin animate-spin" color={isCompleted ? 'white' : 'var(--text-tertiary)'} />
                                ) : isCompleted && (
                                    <Check size={14} strokeWidth={3} color="white" />
                                )}
                            </div>

                            <div style={{ flex: 1 }}>
                                <span style={{
                                    fontSize: '17px',
                                    fontWeight: 500,
                                    color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                                    textDecoration: isCompleted ? 'line-through' : 'none',
                                    transition: 'color 0.2s'
                                }}>
                                    {task.name}
                                </span>
                            </div>

                            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                +{task.points}m
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Initiative Input - iOS Style */}
            <div className="card" style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                    className="input"
                    value={initiativeText}
                    onChange={(e) => setInitiativeText(e.target.value)}
                    placeholder="Añadir iniciativa..."
                    style={{ border: 'none', background: 'transparent', flex: 1 }}
                />
                <button
                    onClick={async () => {
                        if (!initiativeText.trim()) return;
                        await addInitiative(profile.id, initiativeText, activeDate);
                        setInitiativeText('');
                    }}
                    style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'var(--accent-primary)', color: 'white',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={20} />
                </button>
            </div>
        </div>
    );
}

export default TaskChecklist;
