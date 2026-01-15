import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, Home, Shield, Clock, Plus, Trash2, Calculator } from 'lucide-react';
import { createProfile, getProfile, updateProfile } from '../utils/storage';

function ProfileForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        name: '',
        weeklyGoalHours: 0,
        customTasks: [],
        consequences: []
    });
    const [loading, setLoading] = useState(isEdit);

    useEffect(() => {
        if (isEdit) {
            getProfile(id).then(profile => {
                if (profile) {
                    setFormData({
                        name: profile.name || '',
                        weeklyGoalHours: profile.weeklyGoalHours || 0,
                        customTasks: profile.tasks?.filter(t => t.id !== 'breathing').map(t => ({
                            id: t.id,
                            name: t.name,
                            points: t.points,
                            isManual: t.isManual || false
                        })) || [],
                        consequences: profile.consequences || getDefaultConsequences()
                    });
                }
                setLoading(false);
            });
        }
    }, [id, isEdit]);

    const getDefaultConsequences = () => [
        { type: 'disrespect', label: 'Falta de respeto', amount: 15, icon: 'AlertTriangle', color: 'var(--color-danger)' },
        { type: 'disorder', label: 'Desorden', amount: 5, icon: 'Home', color: 'var(--color-warning)' },
        { type: 'trust', label: 'Confianza', amount: 30, icon: 'Shield', color: '#dc2626' },
        { type: 'rules', label: 'Reglas Básicas', amount: 15, icon: 'Clock', color: 'var(--color-danger)' }
    ];

    useEffect(() => {
        if (!isEdit && formData.consequences.length === 0) {
            setFormData(prev => ({ ...prev, consequences: getDefaultConsequences() }));
        }
    }, [isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Por favor ingresa un nombre');
            return;
        }

        if (isEdit) {
            // Get the current profile to preserve the breathing task
            const currentProfile = await getProfile(id);
            const breathingTask = currentProfile.tasks?.find(t => t.id === 'breathing');

            // Rebuild tasks array: breathing task + updated custom tasks
            const updatedTasks = [
                breathingTask || { id: 'breathing', name: 'Respiración consciente', points: 5 },
                ...formData.customTasks.map(t => ({
                    id: t.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: t.name,
                    points: t.points,
                    isManual: t.isManual || false
                }))
            ];

            await updateProfile(id, {
                name: formData.name,
                weeklyGoalHours: formData.weeklyGoalHours,
                tasks: updatedTasks,
                consequences: formData.consequences
            });
        } else {
            await createProfile(formData);
        }

        navigate('/');
    };

    const addTask = () => {
        setFormData({
            ...formData,
            customTasks: [...formData.customTasks, { name: '', points: 5, isManual: false }]
        });
    };

    const updateTask = (index, field, value) => {
        const updated = [...formData.customTasks];
        updated[index][field] = value;
        setFormData({ ...formData, customTasks: updated });
    };

    const removeTask = (index) => {
        const updated = formData.customTasks.filter((_, i) => i !== index);
        setFormData({ ...formData, customTasks: updated });
    };

    const updateConsequence = (index, field, value) => {
        const updated = [...formData.consequences];
        updated[index][field] = value;
        setFormData({ ...formData, consequences: updated });
    };

    const addConsequence = () => {
        setFormData({
            ...formData,
            consequences: [...formData.consequences, {
                type: `custom_${Date.now()}`,
                label: '',
                amount: 10,
                icon: 'AlertTriangle',
                color: 'var(--color-danger)'
            }]
        });
    };

    const removeConsequence = (index) => {
        const updated = formData.consequences.filter((_, i) => i !== index);
        setFormData({ ...formData, consequences: updated });
    };

    const calculateAutomaticTimes = () => {
        if (formData.weeklyGoalHours <= 0) {
            alert('Por favor establece una meta semanal mayor a 0 horas');
            return;
        }

        // Convert weekly goal from hours to minutes
        const weeklyGoalMinutes = formData.weeklyGoalHours * 60;

        // Subtract the initial 60 minutes that are given for free each week
        const INITIAL_BALANCE = 60;
        const minutesToEarn = weeklyGoalMinutes - INITIAL_BALANCE;

        if (minutesToEarn <= 0) {
            alert('La meta semanal es menor o igual a la hora gratis (60 min). No es necesario hacer tareas.');
            return;
        }

        // Count tasks that are not manual (including breathing task)
        const automaticTasks = formData.customTasks.filter(t => !t.isManual);
        const totalAutomaticTasks = automaticTasks.length + 1; // +1 for breathing task

        if (totalAutomaticTasks === 0) {
            alert('Todas las tareas están marcadas como manuales. No hay nada que calcular.');
            return;
        }

        // Calculate points per task: (weeklyGoal - initialBalance) / (tasks * 7 days)
        const pointsPerTask = Math.round(minutesToEarn / (totalAutomaticTasks * 7));

        // Update automatic tasks
        const updatedTasks = formData.customTasks.map(task => {
            if (task.isManual) {
                return task; // Keep manual tasks unchanged
            }
            return { ...task, points: pointsPerTask };
        });

        setFormData({ ...formData, customTasks: updatedTasks });

        alert(`Tiempos calculados automáticamente: ${pointsPerTask} minutos por tarea\n\nCálculo:\nMeta semanal: ${formData.weeklyGoalHours}h = ${weeklyGoalMinutes} min\nMenos hora gratis: -${INITIAL_BALANCE} min\nA ganar con tareas: ${minutesToEarn} min\nTareas automáticas: ${totalAutomaticTasks}\nDías: 7\nResultado: ${minutesToEarn} / ${totalAutomaticTasks} / 7 = ${pointsPerTask} min/tarea`);
    };

    if (loading) {
        return <div className="container">Cargando...</div>;
    }

    return (
        <div className="fade-in">
            <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <ArrowLeft size={20} />
                Volver
            </button>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: 'var(--spacing-xl)', fontSize: 'var(--font-size-2xl)' }}>
                    {isEdit ? 'Editar Perfil' : 'Crear Nuevo Perfil'}
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* Name */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label className="label">Nombre del niño/a</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: María"
                            required
                        />
                    </div>

                    {/* Weekly Goal */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label className="label">Meta semanal (horas)</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.weeklyGoalHours}
                            onChange={(e) => setFormData({ ...formData, weeklyGoalHours: parseInt(e.target.value) || 0 })}
                            placeholder="Ej: 5"
                            min="0"
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                            Horas que quiere acumular esta semana
                        </small>
                    </div>

                    {/* Custom Tasks */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <label className="label" style={{ marginBottom: 0 }}>Tareas personalizadas</label>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button type="button" onClick={calculateAutomaticTimes} className="btn btn-sm btn-secondary">
                                    <Calculator size={16} /> Calcular Automático
                                </button>
                                <button type="button" onClick={addTask} className="btn btn-sm btn-primary">
                                    + Añadir Tarea
                                </button>
                            </div>
                        </div>

                        {formData.customTasks.map((task, index) => (
                            <div key={index} style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto auto auto',
                                gap: 'var(--spacing-sm)',
                                marginBottom: 'var(--spacing-sm)',
                                alignItems: 'center'
                            }}>
                                <input
                                    type="text"
                                    className="input"
                                    value={task.name}
                                    onChange={(e) => updateTask(index, 'name', e.target.value)}
                                    placeholder="Nombre de la tarea"
                                />
                                <input
                                    type="number"
                                    className="input"
                                    value={task.points}
                                    onChange={(e) => updateTask(index, 'points', parseInt(e.target.value) || 5)}
                                    placeholder="Puntos"
                                    min="1"
                                    style={{ width: '100px' }}
                                />
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    fontSize: 'var(--font-size-sm)'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={task.isManual || false}
                                        onChange={(e) => updateTask(index, 'isManual', e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    Manual
                                </label>
                                <button
                                    type="button"
                                    onClick={() => removeTask(index)}
                                    className="btn btn-danger btn-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', display: 'block', marginTop: 'var(--spacing-sm)' }}>
                            Nota: "Respiración consciente" (+5 Min) se añade automáticamente. Marca "Manual" para evitar que el cálculo automático modifique una tarea.
                        </small>
                    </div>

                    {/* Consequences */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <label className="label" style={{ marginBottom: 0 }}>Consecuencias</label>
                            <button type="button" onClick={addConsequence} className="btn btn-sm btn-primary">
                                + Añadir Consecuencia
                            </button>
                        </div>

                        {formData.consequences.map((consequence, index) => (
                            <div key={index} style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto auto',
                                gap: 'var(--spacing-sm)',
                                marginBottom: 'var(--spacing-sm)'
                            }}>
                                <input
                                    type="text"
                                    className="input"
                                    value={consequence.label}
                                    onChange={(e) => updateConsequence(index, 'label', e.target.value)}
                                    placeholder="Nombre de la consecuencia"
                                />
                                <input
                                    type="number"
                                    className="input"
                                    value={consequence.amount}
                                    onChange={(e) => updateConsequence(index, 'amount', parseInt(e.target.value) || 0)}
                                    placeholder="Minutos"
                                    min="1"
                                    style={{ width: '100px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeConsequence(index)}
                                    className="btn btn-danger btn-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <small style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', display: 'block', marginTop: 'var(--spacing-sm)' }}>
                            Penalizaciones en minutos que se restarán del saldo
                        </small>
                    </div>

                    {/* Submit */}
                    <button type="submit" className="btn btn-success btn-lg" style={{ width: '100%' }}>
                        <Save size={20} />
                        {isEdit ? 'Guardar Cambios' : 'Crear Perfil'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProfileForm;
