import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { getProfileTransactions, subscribeToFamilyChange } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const VIEW_MODES = { DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly' };

function HistoryChart({ profileId }) {
    const [viewMode, setViewMode] = useState(VIEW_MODES.WEEKLY);
    const [chartData, setChartData] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const unsubscribe = subscribeToFamilyChange(() => {
            loadChartData();
        });
        return () => unsubscribe();
    }, [profileId, viewMode]);

    const loadChartData = async () => {
        const transactions = await getProfileTransactions(profileId);
        let labels = [];
        let data = [];
        const now = new Date();

        if (viewMode === VIEW_MODES.DAILY) {
            for (let i = 6; i >= 0; i--) {
                const date = subDays(now, i);
                labels.push(format(date, 'EEE', { locale: es }));
                const dayTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.timestamp);
                    return txDate >= startOfDay(date) && txDate <= endOfDay(date);
                });
                data.push(dayTransactions.reduce((sum, tx) => sum + tx.amount, 0));
            }
        } else if (viewMode === VIEW_MODES.WEEKLY) {
            for (let i = 3; i >= 0; i--) {
                const weekStart = startOfWeek(subDays(now, i * 7), { weekStartsOn: 5 });
                const weekEnd = endOfWeek(subDays(now, i * 7), { weekStartsOn: 5 });
                labels.push(`Sem ${format(weekStart, 'dd/MM')}`);
                const weekTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.timestamp);
                    return txDate >= weekStart && txDate <= weekEnd;
                });
                data.push(weekTransactions.reduce((sum, tx) => sum + tx.amount, 0));
            }
        } else {
            for (let i = 2; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                labels.push(format(monthDate, 'MMM', { locale: es }));
                const monthTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.timestamp);
                    return txDate >= startOfMonth(monthDate) && txDate <= endOfMonth(monthDate);
                });
                data.push(monthTransactions.reduce((sum, tx) => sum + tx.amount, 0));
            }
        }

        // Apply Apple Blue Gradient Logic
        const ctx = document.createElement('canvas').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(10, 132, 255, 0.5)'); // iOS Blue
        gradient.addColorStop(1, 'rgba(10, 132, 255, 0.0)');

        setChartData({
            labels,
            datasets: [{
                label: 'Minutos',
                data,
                borderColor: '#0A84FF', // iOS Blue
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 0, // Cleaner look
                pointHoverRadius: 6,
                pointBackgroundColor: '#0A84FF',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        });
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(28, 28, 30, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 0.5,
                padding: 10,
                displayColors: false,
                callbacks: { label: (ctx) => `${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y} min` }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                ticks: { color: '#8E8E93', font: { family: '-apple-system', size: 10 } }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#8E8E93', font: { family: '-apple-system', size: 10 } }
            }
        }
    };

    return (
        <div>
            {/* iOS Segmented Control */}
            <div style={{ background: 'var(--bg-app)', padding: '2px', borderRadius: '8px', display: 'flex', marginBottom: '16px' }}>
                {[VIEW_MODES.DAILY, VIEW_MODES.WEEKLY, VIEW_MODES.MONTHLY].map(mode => {
                    const isActive = viewMode === mode;
                    return (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            style={{
                                flex: 1,
                                padding: '6px 0',
                                border: 'none',
                                background: isActive ? 'var(--bg-card)' : 'transparent',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: isActive ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                            }}
                        >
                            {mode === VIEW_MODES.DAILY ? 'Diario' : mode === VIEW_MODES.WEEKLY ? 'Semanal' : 'Mensual'}
                        </button>
                    );
                })}
            </div>

            <div style={{ height: '220px' }}>
                {chartData ? <Line data={chartData} options={options} /> : <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '80px' }}>Cargando datos...</div>}
            </div>
        </div>
    );
}

export default HistoryChart;
