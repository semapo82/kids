// Local storage management for profiles and transactions
import { shouldResetWeek, getWeekIdentifier } from './dateUtils';

const STORAGE_KEYS = {
    PROFILES: 'aprendizaje_profiles',
    TRANSACTIONS: 'aprendizaje_transactions',
    LAST_RESET: 'aprendizaje_last_reset',
    VERSION: 'aprendizaje_version'
};

const CURRENT_VERSION = '1.0.0';
const INITIAL_BALANCE = 60; // Minutes

/**
 * Initialize storage and check for weekly reset
 */
export function initializeStorage() {
    // Check version and migrate if needed
    const version = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (!version || version !== CURRENT_VERSION) {
        // Future: Add migration logic here
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    }

    // Check if we need to reset for new week
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    if (shouldResetWeek(lastReset)) {
        performWeeklyReset();
    }
}

/**
 * Perform weekly reset (Friday 00:00)
 */
function performWeeklyReset() {
    const profiles = getProfiles();
    const now = new Date().toISOString();

    profiles.forEach(profile => {
        // Reset balance to initial +60 Min
        profile.balance = INITIAL_BALANCE;
        profile.weeklyGoalProgress = 0;

        // Reset daily tasks
        if (profile.tasks) {
            profile.tasks.forEach(task => {
                task.completedToday = false;
            });
        }

        // Add reset transaction
        addTransaction({
            profileId: profile.id,
            type: 'reset',
            amount: INITIAL_BALANCE,
            description: 'Inicio de semana - Regalo semanal',
            timestamp: now
        });
    });

    saveProfiles(profiles);
    localStorage.setItem(STORAGE_KEYS.LAST_RESET, now);
}

/**
 * Get all profiles
 */
export function getProfiles() {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
    return data ? JSON.parse(data) : [];
}

/**
 * Save profiles
 */
export function saveProfiles(profiles) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

/**
 * Get profile by ID
 */
export function getProfile(id) {
    const profiles = getProfiles();
    return profiles.find(p => p.id === id);
}

/**
 * Create new profile
 */
export function createProfile(profileData) {
    const profiles = getProfiles();

    const newProfile = {
        id: Date.now().toString(),
        name: profileData.name,
        balance: INITIAL_BALANCE,
        weeklyGoalHours: profileData.weeklyGoalHours || 0,
        weeklyGoalProgress: 0,
        tasks: [
            ...(profileData.customTasks || []).map((task, index) => ({
                id: `task_${index}`,
                name: task.name,
                points: task.points || 5,
                completedToday: false
            })),
            {
                id: 'breathing',
                name: 'Respiración consciente',
                points: 5,
                completedToday: false
            }
        ],
        createdAt: new Date().toISOString()
    };

    profiles.push(newProfile);
    saveProfiles(profiles);

    // Add initial balance transaction (record only, don't update balance)
    const transactions = getTransactions();
    transactions.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        profileId: newProfile.id,
        type: 'reset',
        amount: INITIAL_BALANCE,
        description: 'Perfil creado - Regalo inicial',
        timestamp: new Date().toISOString()
    });
    saveTransactions(transactions);

    return newProfile;
}

/**
 * Update profile
 */
export function updateProfile(id, updates) {
    const profiles = getProfiles();
    const index = profiles.findIndex(p => p.id === id);

    if (index !== -1) {
        profiles[index] = { ...profiles[index], ...updates };
        saveProfiles(profiles);
        return profiles[index];
    }

    return null;
}

/**
 * Delete profile
 */
export function deleteProfile(id) {
    const profiles = getProfiles();
    const filtered = profiles.filter(p => p.id !== id);
    saveProfiles(filtered);

    // Also delete related transactions
    const transactions = getTransactions();
    const filteredTransactions = transactions.filter(t => t.profileId !== id);
    saveTransactions(filteredTransactions);
}

/**
 * Get all transactions
 */
export function getTransactions() {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
}

/**
 * Save transactions
 */
function saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

/**
 * Get transactions for a specific profile
 */
export function getProfileTransactions(profileId, limit = null) {
    const transactions = getTransactions();
    const profileTxs = transactions
        .filter(t => t.profileId === profileId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return limit ? profileTxs.slice(0, limit) : profileTxs;
}

/**
 * Add transaction and update profile balance
 */
export function addTransaction(transaction) {
    const transactions = getTransactions();

    const newTransaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...transaction,
        timestamp: transaction.timestamp || new Date().toISOString()
    };

    transactions.push(newTransaction);
    saveTransactions(transactions);

    // Update profile balance
    const profile = getProfile(transaction.profileId);
    if (profile) {
        profile.balance = (profile.balance || 0) + transaction.amount;
        updateProfile(profile.id, { balance: profile.balance });
    }

    return newTransaction;
}

/**
 * Complete a task
 */
export function completeTask(profileId, taskId) {
    const profile = getProfile(profileId);
    if (!profile) return null;

    const task = profile.tasks.find(t => t.id === taskId);
    if (!task || task.completedToday) return null;

    // Mark task as completed
    task.completedToday = true;
    updateProfile(profileId, { tasks: profile.tasks });

    // Add transaction
    return addTransaction({
        profileId,
        type: 'task',
        amount: task.points,
        description: `Tarea completada: ${task.name}`,
        taskId
    });
}

/**
 * Add initiative (custom task)
 */
export function addInitiative(profileId, description) {
    return addTransaction({
        profileId,
        type: 'initiative',
        amount: 5,
        description: `Iniciativa: ${description}`
    });
}

/**
 * Apply consequence
 */
export function applyConsequence(profileId, consequenceType, amount, description) {
    return addTransaction({
        profileId,
        type: 'consequence',
        amount: -Math.abs(amount), // Ensure negative
        description: `Consecuencia: ${description}`,
        consequenceType
    });
}

/**
 * Redeem time from bank
 */
export function redeemTime(profileId, minutes) {
    const profile = getProfile(profileId);
    if (!profile || profile.balance <= 0) {
        throw new Error('Privilegios suspendidos - Saldo insuficiente');
    }

    if (profile.balance < minutes) {
        throw new Error(`Saldo insuficiente. Disponible: ${profile.balance} Min`);
    }

    return addTransaction({
        profileId,
        type: 'redemption',
        amount: -minutes,
        description: `Canjeado: ${minutes} Min`
    });
}

/**
 * Get weekly statistics for a profile
 */
export function getWeeklyStats(profileId) {
    const transactions = getProfileTransactions(profileId);
    const weekId = getWeekIdentifier();

    const weekTransactions = transactions.filter(t => {
        const txWeekId = getWeekIdentifier(new Date(t.timestamp));
        return txWeekId === weekId;
    });

    const stats = {
        totalEarned: 0,
        totalLost: 0,
        tasksCompleted: 0,
        consequences: 0,
        redemptions: 0
    };

    weekTransactions.forEach(tx => {
        if (tx.amount > 0) {
            stats.totalEarned += tx.amount;
            if (tx.type === 'task') stats.tasksCompleted++;
        } else {
            stats.totalLost += Math.abs(tx.amount);
            if (tx.type === 'consequence') stats.consequences++;
            if (tx.type === 'redemption') stats.redemptions++;
        }
    });

    return stats;
}
