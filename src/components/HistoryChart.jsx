import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { getProfileTransactions } from '../utils/storage';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const VIEW_MODES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly'
};

function HistoryChart({ profileId }) {
    const [viewMode, setViewMode] = useState(VIEW_MODES.WEEKLY);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        loadChartData();
    }, [profileId, viewMode]);

    const loadChartData = () => {
        const transactions = getProfileTransactions(profileId);

        let labels = [];
        let data = [];
        const now = new Date();

        if (viewMode === VIEW_MODES.DAILY) {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = subDays(now, i);
                labels.push(format(date, 'EEE', { locale: es }));

                const dayStart = startOfDay(date);
                const dayEnd = endOfDay(date);

                const dayTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.timestamp);
                    return txDate >= dayStart && txDate <= dayEnd;
                });

                const balance = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
                data.push(balance);
            }
        } else if (viewMode === VIEW_MODES.WEEKLY) {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekStart = startOfWeek(subDays(now, i * 7), { weekStartsOn: 5 });
                const weekEnd = endOfWeek(subDays(now, i * 7), { weekStartsOn: 5 });

                labels.push(`Sem ${format(weekStart, 'dd/MM', { locale: es })}`);

                const weekTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.timestamp);
                    return txDate >= weekStart && txDate <= weekEnd;
                });

                const balance = weekTransactions.reduce((sum, tx) => sum + tx.amount, 0);
                data.push(balance);
            }
        } else {
            // Last 3 months
            for (let i = 2; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStart = startOfMonth(monthDate);
                const monthEnd = endOfMonth(monthDate);

                labels.push(format(monthDate, 'MMM', { locale: es }));

                const monthTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.timestamp);
                    return txDate >= monthStart && txDate <= monthEnd;
                });

                const balance = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
                data.push(balance);
            }
        }

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Minutos',
                    data,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: data.map(val => val >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        });
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#f1f5f9',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return `${context.parsed.y > 0 ? '+' : ''}${context.parsed.y} Min`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(51, 65, 85, 0.3)'
                },
                ticks: {
                    color: '#94a3b8',
                    callback: function (value) {
                        return value + ' Min';
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#94a3b8'
                }
            }
        }
    };

    return (
        <div>
            {/* View Mode Buttons */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-lg)',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => setViewMode(VIEW_MODES.DAILY)}
                    className={`btn btn-sm ${viewMode === VIEW_MODES.DAILY ? 'btn-primary' : 'btn-secondary'}`}
                >
                    Diario
                </button>
                <button
                    onClick={() => setViewMode(VIEW_MODES.WEEKLY)}
                    className={`btn btn-sm ${viewMode === VIEW_MODES.WEEKLY ? 'btn-primary' : 'btn-secondary'}`}
                >
                    Semanal
                </button>
                <button
                    onClick={() => setViewMode(VIEW_MODES.MONTHLY)}
                    className={`btn btn-sm ${viewMode === VIEW_MODES.MONTHLY ? 'btn-primary' : 'btn-secondary'}`}
                >
                    Mensual
                </button>
            </div>

            {/* Chart */}
            <div style={{ height: '300px' }}>
                {chartData ? (
                    <Line data={chartData} options={options} />
                ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                        Cargando gráfico...
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoryChart;
