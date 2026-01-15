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
        consequences: [],
        weeklyPlan: {
            friday: 0, saturday: 0, sunday: 0, monday: 0,
            tuesday: 0, wednesday: 0, thursday: 0
        }
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
                        consequences: (profile.consequences || getDefaultConsequences()).map(c => ({
                            ...c,
                            color: c.color === '#dc2626' ? 'var(--color-danger)' : c.color
                        })),
                        weeklyPlan: profile.weeklyPlan || {
                            friday: 0, saturday: 0, sunday: 0, monday: 0,
                            tuesday: 0, wednesday: 0, thursday: 0
                        }
                    });
                }
                setLoading(false);
            });
        }
    }, [id, isEdit]);

    const getDefaultConsequences = () => [
        { type: 'disrespect', label: 'Falta de respeto', amount: 15, icon: 'AlertTriangle', color: 'var(--color-danger)' },
        { type: 'disorder', label: 'Desorden', amount: 5, icon: 'Home', color: 'var(--color-warning)' },
        { type: 'trust', label: 'Confianza', amount: 30, icon: 'Shield', color: 'var(--color-danger)' },
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

        // Validate weekly plan sum matches weeklyGoalHours
        const totalPlanned = Object.values(formData.weeklyPlan).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        if (totalPlanned !== parseFloat(formData.weeklyGoalHours)) {
            if (!window.confirm(`La suma de las sesiones (${totalPlanned}h) no coincide con la meta semanal (${formData.weeklyGoalHours}h). ¿Deseas continuar de todas formas?`)) {
                return;
            }
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
                consequences: formData.consequences,
                weeklyPlan: formData.weeklyPlan
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

    const updateWeeklyPlan = (day, value) => {
        setFormData({
            ...formData,
            weeklyPlan: {
                ...formData.weeklyPlan,
                [day]: parseFloat(value) || 0
            }
        });
    };

    const calculateAutomaticTimes = () => {
        if (formData.weeklyGoalHours <= 0) {
            alert('Por favor establece una meta semanal mayor a 0 horas');
            return;
        }

        // 1. Meta semanal total en minutos
        const weeklyGoalMinutes = formData.weeklyGoalHours * 60;

        // 2. Restamos la hora gratis inicial (60 min)
        const INITIAL_BALANCE = 60;
        const netMinutesToEarn = weeklyGoalMinutes - INITIAL_BALANCE;

        if (netMinutesToEarn <= 0) {
            alert('La meta semanal es menor o igual a la hora gratis (60 min). No es necesario hacer tareas.');
            return;
        }

        // 3. Calculamos cuánto aportan las tareas MANUALES a la semana
        const manualTasks = formData.customTasks.filter(t => t.isManual);
        const manualWeeklyContribution = manualTasks.reduce((sum, t) => sum + (t.points * 7), 0);

        // 4. Calculamos cuánto queda por repartir entre las AUTOMÁTICAS
        const remainingToDistribute = netMinutesToEarn - manualWeeklyContribution;
        const automaticTasks = formData.customTasks.filter(t => !t.isManual);
        const totalAutomaticCount = automaticTasks.length;

        if (totalAutomaticCount === 0) {
            if (manualWeeklyContribution >= netMinutesToEarn) {
                alert('Meta cumplida: Las tareas manuales ya cubren o superan el objetivo semanal (+60 min gratis).');
            } else {
                alert(`Atención: Con las tareas manuales actuales no se llega a la meta. Faltan ${netMinutesToEarn - manualWeeklyContribution} min/semana.`);
            }
            return;
        }

        // 5. Calculamos puntos por cada tarea automática
        // (Restante / Tareas / 7 días)
        const pointsPerAutoTask = Math.max(1, Math.round(remainingToDistribute / (totalAutomaticCount * 7)));

        // 6. Actualizamos el estado
        const updatedTasks = formData.customTasks.map(task => {
            if (task.isManual) return task;
            return { ...task, points: pointsPerAutoTask };
        });

        setFormData({ ...formData, customTasks: updatedTasks });
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

                    {/* Weekly Distribution (Sessions) */}
                    <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                        <label className="label">Planificación de Gasto (Sesiones)</label>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                            Distribuye la meta de {formData.weeklyGoalHours}h en los días que se suele gastar el tiempo (ej: 3h viernes, 3h sábado):
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--spacing-sm)' }}>
                            {['friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].map(day => (
                                <div key={day}>
                                    <label className="label" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px', opacity: 0.8 }}>
                                        {day === 'friday' ? 'Viernes' :
                                            day === 'saturday' ? 'Sábado' :
                                                day === 'sunday' ? 'Domingo' :
                                                    day === 'monday' ? 'Lunes' :
                                                        day === 'tuesday' ? 'Martes' :
                                                            day === 'wednesday' ? 'Miércoles' : 'Jueves'}
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input
                                            type="number"
                                            className="input"
                                            style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}
                                            value={formData.weeklyPlan[day]}
                                            onChange={(e) => updateWeeklyPlan(day, e.target.value)}
                                            min="0"
                                            step="0.5"
                                        />
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>h</span>
                                    </div>
                                </div>
                            ))}
                        </div>
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
