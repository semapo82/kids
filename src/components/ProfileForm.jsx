import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Calculator, Plus, Trash2 } from 'lucide-react';
import { createProfile, getProfile, updateProfile, deleteProfile } from '../utils/storage';

function ProfileForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    // Initial state uses empty strings to allow clean inputs for the user
    const [formData, setFormData] = useState({
        name: '',
        weeklyGoalHours: '',
        customTasks: [],
        consequences: [],
        weeklyPlan: {
            friday: '', saturday: '', sunday: '', monday: '',
            tuesday: '', wednesday: '', thursday: ''
        }
    });
    const [loading, setLoading] = useState(isEdit);

    useEffect(() => {
        if (isEdit) {
            getProfile(id).then(profile => {
                if (profile) {
                    setFormData({
                        name: profile.name || '',
                        weeklyGoalHours: profile.weeklyGoalHours || '',
                        customTasks: profile.tasks?.filter(t => t.id !== 'breathing').map(t => ({
                            id: t.id,
                            name: t.name,
                            points: t.points,
                            isManual: t.isManual || false
                        })) || [],
                        consequences: (profile.consequences || []).map(c => ({
                            ...c,
                            color: c.color === '#dc2626' ? 'var(--color-danger)' : c.color
                        })),
                        weeklyPlan: profile.weeklyPlan || {
                            friday: '', saturday: '', sunday: '', monday: '',
                            tuesday: '', wednesday: '', thursday: ''
                        }
                    });
                }
                setLoading(false);
            });
        }
    }, [id, isEdit]);

    // Ensure at least one empty task/consequence for new profiles for intuitiveness
    useEffect(() => {
        if (!isEdit) {
            if (formData.customTasks.length === 0) {
                setFormData(prev => ({
                    ...prev,
                    customTasks: [{ name: '', points: '', isManual: false }]
                }));
            }
            if (formData.consequences.length === 0) {
                setFormData(prev => ({
                    ...prev,
                    consequences: [{
                        type: `custom_${Date.now()}`,
                        label: '',
                        amount: '',
                        icon: 'AlertTriangle',
                        color: 'var(--color-danger)'
                    }]
                }));
            }
        }
    }, [isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Por favor ingresa un nombre');
            return;
        }

        // Sanitization Logic: Convert empty strings to 0 for storage
        const goalHours = formData.weeklyGoalHours === '' ? 0 : parseFloat(formData.weeklyGoalHours);

        const sanitizedWeeklyPlan = Object.entries(formData.weeklyPlan).reduce((acc, [day, val]) => ({
            ...acc,
            [day]: val === '' ? 0 : parseFloat(val)
        }), {});

        const totalPlanned = Object.values(sanitizedWeeklyPlan).reduce((a, b) => a + b, 0);

        if (totalPlanned !== goalHours) {
            if (!window.confirm(`La suma de las sesiones (${totalPlanned}h) no coincide con la meta semanal (${goalHours}h). ¿Deseas continuar de todas formas?`)) {
                return;
            }
        }

        const sanitizedData = {
            name: formData.name,
            weeklyGoalHours: goalHours,
            weeklyPlan: sanitizedWeeklyPlan,
            consequences: formData.consequences
                .filter(c => c.label && c.label.trim() !== '') // Filter out empty consequences
                .map(c => ({
                    type: c.type || `consequence_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    label: c.label || 'Nueva Consecuencia',
                    amount: (c.amount === '' || isNaN(parseInt(c.amount))) ? 0 : parseInt(c.amount),
                    icon: c.icon || 'AlertTriangle',
                    color: c.color || 'var(--color-danger)'
                }))
        };

        if (isEdit) {
            const currentProfile = await getProfile(id);
            const breathingTask = currentProfile.tasks?.find(t => t.id === 'breathing');

            const updatedTasks = [
                breathingTask || { id: 'breathing', name: 'Respiración consciente', points: 5 },
                ...formData.customTasks
                    .filter(t => t.name && t.name.trim() !== '') // Filter out empty tasks
                    .map(t => ({
                        id: t.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: t.name,
                        points: (t.points === '' || isNaN(parseInt(t.points))) ? 0 : parseInt(t.points),
                        isManual: t.isManual || false
                    }))
            ];

            await updateProfile(id, {
                ...sanitizedData,
                tasks: updatedTasks
            });
        } else {
            const newTasks = [
                { id: 'breathing', name: 'Respiración consciente', points: 5 },
                ...formData.customTasks
                    .filter(t => t.name && t.name.trim() !== '') // Filter out empty tasks
                    .map(t => ({
                        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: t.name,
                        points: (t.points === '' || isNaN(parseInt(t.points))) ? 0 : parseInt(t.points),
                        isManual: t.isManual || false
                    }))
            ];

            await createProfile({
                ...sanitizedData,
                tasks: newTasks
            });
        }
        navigate('/');
    };

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este perfil? Esta acción no se puede deshacer.')) {
            await deleteProfile(id);
            navigate('/');
        }
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
                [day]: value
            }
        });
    };

    const calculateAutomaticTimes = () => {
        const goal = parseFloat(formData.weeklyGoalHours) || 0;
        if (goal <= 0) {
            alert('Por favor establece una meta semanal mayor a 0 horas');
            return;
        }
        const weeklyGoalMinutes = goal * 60;
        const INITIAL_BALANCE = 60;
        const netMinutesToEarn = weeklyGoalMinutes - INITIAL_BALANCE;

        if (netMinutesToEarn <= 0) {
            alert('La meta semanal es menor o igual a la hora gratis (60 min). No es necesario hacer tareas.');
            return;
        }

        const manualTasks = formData.customTasks.filter(t => t.isManual);
        const manualWeeklyContribution = manualTasks.reduce((sum, t) => sum + (parseFloat(t.points) * 7 || 0), 0);
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

        const pointsPerAutoTask = Math.max(1, Math.round(remainingToDistribute / (totalAutomaticCount * 7)));

        const updatedTasks = formData.customTasks.map(task => {
            if (task.isManual) return task;
            return { ...task, points: pointsPerAutoTask };
        });

        setFormData({ ...formData, customTasks: updatedTasks });
    };

    if (loading) return <div className="fade-in" style={{ paddingTop: '40vh', textAlign: 'center' }}>Cargando...</div>;

    const DAY_LABELS = {
        friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo', monday: 'Lunes',
        tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves'
    };

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '17px' }}>
                    <ChevronLeft size={24} style={{ marginLeft: '-8px' }} /> ATRÁS
                </div>
            </div>

            <h1 className="header-large">{isEdit ? 'Editar Perfil' : 'Nuevo Perfil'}</h1>

            <form id="profile-form" onSubmit={handleSubmit}>
                <div style={{ marginBottom: '32px' }}>
                    <span className="text-label" style={{ paddingLeft: '16px' }}>INFORMACIÓN BÁSICA</span>
                    <div className="card" style={{ padding: '0 0 0 16px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 16px 12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nombre</div>
                            <input
                                className="input"
                                style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '17px', width: '100%' }}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nombre"
                                required
                            />
                        </div>
                        <div style={{ padding: '12px 16px 12px 0' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Meta Semanal (horas)</div>
                            <input
                                type="number"
                                className="input"
                                style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '17px', width: '100%' }}
                                value={formData.weeklyGoalHours}
                                onChange={(e) => setFormData({ ...formData, weeklyGoalHours: e.target.value })}
                                placeholder="Ej: 5"
                            />
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <span className="text-label" style={{ paddingLeft: '16px' }}>PLAN DE SESIONES (HORAS)</span>
                    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                        {Object.entries(DAY_LABELS).map(([key, label], idx, arr) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                <span style={{ fontSize: '17px' }}>{label}</span>
                                <input
                                    type="number"
                                    step="0.5"
                                    placeholder="0"
                                    value={formData.weeklyPlan[key]}
                                    onChange={(e) => updateWeeklyPlan(key, e.target.value)}
                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: 'white', padding: '6px', width: '60px', textAlign: 'center', fontSize: '17px' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px' }}>
                        <span className="text-label" style={{ paddingLeft: '16px' }}>TAREAS</span>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button type="button" onClick={calculateAutomaticTimes} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <Calculator size={14} /> Auto
                            </button>
                            <button type="button" onClick={addTask} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <Plus size={14} /> Añadir
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {formData.customTasks.map((task, index) => (
                            <div key={index} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                                <input
                                    value={task.name}
                                    onChange={(e) => updateTask(index, 'name', e.target.value)}
                                    placeholder="Nombre Tarea"
                                    style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, fontSize: '17px' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={task.points}
                                        onChange={(e) => updateTask(index, 'points', e.target.value)}
                                        style={{ width: '40px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: 'white', padding: '4px', textAlign: 'center' }}
                                    />
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>min</span>
                                </div>
                                <button type="button" onClick={() => removeTask(index)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px' }}>
                        <span className="text-label" style={{ paddingLeft: '16px' }}>CONSECUENCIAS</span>
                        <button type="button" onClick={addConsequence} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <Plus size={14} /> Añadir
                        </button>
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {formData.consequences.map((consequence, index) => (
                            <div key={index} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                                <input
                                    value={consequence.label}
                                    onChange={(e) => updateConsequence(index, 'label', e.target.value)}
                                    placeholder="Nombre"
                                    style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, fontSize: '17px' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={consequence.amount}
                                        onChange={(e) => updateConsequence(index, 'amount', e.target.value)}
                                        style={{ width: '40px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: 'white', padding: '4px', textAlign: 'center' }}
                                    />
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>min</span>
                                </div>
                                <button type="button" onClick={() => removeConsequence(index)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                        type="submit"
                        className="btn"
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: '1px solid var(--accent-success)',
                            color: 'var(--accent-success)',
                            fontSize: '17px',
                            fontWeight: 500,
                            padding: '12px',
                            borderRadius: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        {isEdit ? 'Guardar Cambios' : 'Crear Perfil'}
                    </button>

                    {isEdit && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="btn"
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: '1px solid var(--accent-danger)',
                                color: 'var(--accent-danger)',
                                fontSize: '17px',
                                fontWeight: 500,
                                padding: '12px',
                                borderRadius: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Eliminar Perfil
                        </button>
                    )}
                </div>

                <div style={{ height: '40px' }} />

            </form>
        </div>
    );
}

export default ProfileForm;
