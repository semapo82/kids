import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createProfile, getProfile, updateProfile } from '../utils/storage';

function ProfileForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState(() => {
        if (isEdit) {
            const profile = getProfile(id);
            return {
                name: profile?.name || '',
                weeklyGoalHours: profile?.weeklyGoalHours || 0,
                customTasks: profile?.tasks?.filter(t => t.id !== 'breathing').map(t => ({
                    name: t.name,
                    points: t.points
                })) || []
            };
        }
        return {
            name: '',
            weeklyGoalHours: 0,
            customTasks: []
        };
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Por favor ingresa un nombre');
            return;
        }

        if (isEdit) {
            updateProfile(id, {
                name: formData.name,
                weeklyGoalHours: formData.weeklyGoalHours
            });
        } else {
            createProfile(formData);
        }

        navigate('/');
    };

    const addTask = () => {
        setFormData({
            ...formData,
            customTasks: [...formData.customTasks, { name: '', points: 5 }]
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
                    {!isEdit && (
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                <label className="label" style={{ marginBottom: 0 }}>Tareas personalizadas</label>
                                <button type="button" onClick={addTask} className="btn btn-sm btn-primary">
                                    + Añadir Tarea
                                </button>
                            </div>

                            {formData.customTasks.map((task, index) => (
                                <div key={index} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto auto',
                                    gap: 'var(--spacing-sm)',
                                    marginBottom: 'var(--spacing-sm)'
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
                                Nota: "Respiración consciente" (+5 Min) se añade automáticamente
                            </small>
                        </div>
                    )}

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
