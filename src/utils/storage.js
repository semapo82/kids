// Local storage and Firebase Firestore management for profiles and transactions
import { shouldResetWeek, getWeekIdentifier } from './dateUtils';
import { db, auth } from '../config/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    limit as firestoreLimit,
    serverTimestamp,
    collectionGroup
} from 'firebase/firestore';

const STORAGE_KEYS = {
    PROFILES: 'aprendizaje_profiles',
    TRANSACTIONS: 'aprendizaje_transactions',
    LAST_RESET: 'aprendizaje_last_reset',
    VERSION: 'aprendizaje_version'
};

const CURRENT_VERSION = '1.0.0';
const INITIAL_BALANCE = 60; // Minutes

let currentUser = null;

/**
 * Set the current authenticated user and trigger sync
 */
export async function setAuthUser(user) {
    const previousUser = currentUser;
    currentUser = user;

    if (user && !previousUser) {
        // Just logged in, sync local data if any
        await syncLocalDataToCloud();
    }
}

/**
 * Migrate local data to Firestore
 */
async function syncLocalDataToCloud() {
    if (!currentUser) return;

    try {
        console.log("Synchronizing local data to cloud...");

        // 1. Sync Profiles
        const localProfilesData = localStorage.getItem(STORAGE_KEYS.PROFILES);
        const localProfiles = localProfilesData ? JSON.parse(localProfilesData) : [];

        for (const profile of localProfiles) {
            const docRef = doc(db, 'users', currentUser.uid, 'profiles', profile.id);
            // Use setDoc with merge: true to avoid overwriting existing cloud data if IDs match
            await setDoc(docRef, profile, { merge: true });
        }

        // 2. Sync Transactions
        const localTxsData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const localTxs = localTxsData ? JSON.parse(localTxsData) : [];

        for (const tx of localTxs) {
            const docRef = doc(db, 'users', currentUser.uid, 'transactions', tx.id);
            await setDoc(docRef, tx, { merge: true });
        }

        if (localProfiles.length > 0 || localTxs.length > 0) {
            console.log(`Successfully migrated ${localProfiles.length} profiles and ${localTxs.length} transactions.`);
            // Optionally clear local storage after sync to avoid clutter
            // But keeping it as fallback is safer for now.
        }
    } catch (error) {
        console.error("Error during data migration:", error);
    }
}

/**
 * Initialize storage and check for weekly reset
 */
export async function initializeStorage() {
    // Check version and migrate if needed
    const version = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (!version || version !== CURRENT_VERSION) {
        // Future: Add migration logic here
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    }

    // Check if we need to reset for new week
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    if (shouldResetWeek(lastReset)) {
        await performWeeklyReset();
    }
}

/**
 * Perform weekly reset (Friday 00:00)
 */
async function performWeeklyReset() {
    const profiles = await getProfiles();
    const now = new Date().toISOString();

    for (const profile of profiles) {
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
        await addTransaction({
            profileId: profile.id,
            type: 'reset',
            amount: INITIAL_BALANCE,
            description: 'Inicio de semana - Regalo semanal',
            timestamp: now
        });
    }

    await saveProfiles(profiles);
    localStorage.setItem(STORAGE_KEYS.LAST_RESET, now);
}

/**
 * Get all profiles
 */
export async function getProfiles() {
    if (currentUser) {
        const q = collection(db, 'users', currentUser.uid, 'profiles');
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
    return data ? JSON.parse(data) : [];
}

/**
 * Subscribe to profiles for real-time updates
 */
export function subscribeToProfiles(callback) {
    if (currentUser) {
        const q = collection(db, 'users', currentUser.uid, 'profiles');
        return onSnapshot(q, (snapshot) => {
            const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(profiles);
        }, (error) => {
            console.error("Firestore SubscribeToProfiles Error:", error);
            // Fallback to local if desired, or just log
            getProfiles().then(callback);
        });
    } else {
        // For localStorage, we just call it once or use a simple interval for "pseudo-sync"
        getProfiles().then(callback);
        return () => { }; // No-op unsubscribe
    }
}

/**
 * Save profiles
 */
export async function saveProfiles(profiles) {
    if (currentUser) {
        // In Firestore, we usually update individual docs, 
        // but if we need a bulk save (like in the reset):
        for (const profile of profiles) {
            const docRef = doc(db, 'users', currentUser.uid, 'profiles', profile.id);
            await setDoc(docRef, profile, { merge: true });
        }
    }
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

/**
 * Get profile by ID
 */
export async function getProfile(id) {
    if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'profiles', id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    }
    const profiles = await getProfiles();
    return profiles.find(p => p.id === id);
}

/**
 * Subscribe to a specific profile
 */
export function subscribeToProfile(id, callback) {
    if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'profiles', id);
        return onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: snapshot.id, ...snapshot.data() });
            } else {
                callback(null);
            }
        }, (error) => {
            console.error("Firestore SubscribeToProfile Error:", error);
            getProfile(id).then(callback);
        });
    } else {
        getProfile(id).then(callback);
        return () => { };
    }
}

/**
 * Create new profile
 */
export async function createProfile(profileData) {
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

    if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'profiles', newProfile.id);
        await setDoc(docRef, newProfile);
    } else {
        const profiles = await getProfiles();
        profiles.push(newProfile);
        await saveProfiles(profiles);
    }

    // Add initial balance transaction (record only, don't update balance)
    await addTransaction({
        profileId: newProfile.id,
        type: 'reset',
        amount: INITIAL_BALANCE,
        description: 'Perfil creado - Regalo inicial',
        timestamp: new Date().toISOString()
    }, true); // Silent skip update because we already set initial balance

    return newProfile;
}

/**
 * Update profile
 */
export async function updateProfile(id, updates) {
    if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'profiles', id);
        await updateDoc(docRef, updates);
        return { id, ...updates }; // Partial return is fine for local state
    }
    const profiles = await getProfiles();
    const index = profiles.findIndex(p => p.id === id);

    if (index !== -1) {
        profiles[index] = { ...profiles[index], ...updates };
        await saveProfiles(profiles);
        return profiles[index];
    }

    return null;
}

/**
 * Delete profile
 */
export async function deleteProfile(id) {
    if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'profiles', id);
        await deleteDoc(docRef);

        // Delete related transactions in Firestore
        const txsQ = query(collection(db, 'users', currentUser.uid, 'transactions'), where('profileId', '==', id));
        const txsSnapshot = await getDocs(txsQ);
        for (const txDoc of txsSnapshot.docs) {
            await deleteDoc(txDoc.ref);
        }
    } else {
        const profiles = await getProfiles();
        const filtered = profiles.filter(p => p.id !== id);
        await saveProfiles(filtered);

        // Also delete related transactions
        const transactions = await getTransactions();
        const filteredTransactions = transactions.filter(t => t.profileId !== id);
        await saveTransactions(filteredTransactions);
    }
}

/**
 * Get all transactions
 */
export async function getTransactions() {
    if (currentUser) {
        const q = collection(db, 'users', currentUser.uid, 'transactions');
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
}

/**
 * Save transactions
 */
async function saveTransactions(transactions) {
    if (currentUser) {
        for (const tx of transactions) {
            const docRef = doc(db, 'users', currentUser.uid, 'transactions', tx.id);
            await setDoc(docRef, tx, { merge: true });
        }
    }
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

/**
 * Get transactions for a specific profile
 */
export async function getProfileTransactions(profileId, limit = null) {
    if (currentUser) {
        let q = query(
            collection(db, 'users', currentUser.uid, 'transactions'),
            where('profileId', '==', profileId),
            orderBy('timestamp', 'desc')
        );
        if (limit) {
            q = query(q, firestoreLimit(limit));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    const transactions = await getTransactions();
    const profileTxs = transactions
        .filter(t => t.profileId === profileId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return limit ? profileTxs.slice(0, limit) : profileTxs;
}

/**
 * Subscribe to profile transactions
 */
export function subscribeToTransactions(profileId, callback, limit = null) {
    if (currentUser) {
        let q = query(
            collection(db, 'users', currentUser.uid, 'transactions'),
            where('profileId', '==', profileId),
            orderBy('timestamp', 'desc')
        );
        if (limit) {
            q = query(q, firestoreLimit(limit));
        }
        return onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(txs);
        }, (error) => {
            console.error("Firestore SubscribeToTransactions Error:", error);
            getProfileTransactions(profileId, limit).then(callback);
        });
    } else {
        getProfileTransactions(profileId, limit).then(callback);
        return () => { };
    }
}

/**
 * Add transaction and update profile balance
 */
export async function addTransaction(transaction, skipProfileUpdate = false) {
    const newTransaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...transaction,
        timestamp: transaction.timestamp || new Date().toISOString()
    };

    if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'transactions', newTransaction.id);
        await setDoc(docRef, newTransaction);
    } else {
        const transactions = await getTransactions();
        transactions.push(newTransaction);
        await saveTransactions(transactions);
    }

    // Update profile balance
    if (!skipProfileUpdate) {
        const profile = await getProfile(transaction.profileId);
        if (profile) {
            const newBalance = (profile.balance || 0) + transaction.amount;
            await updateProfile(profile.id, { balance: newBalance });
        }
    }

    return newTransaction;
}

/**
 * Complete a task
 */
export async function completeTask(profileId, taskId) {
    const profile = await getProfile(profileId);
    if (!profile) return null;

    const task = profile.tasks.find(t => t.id === taskId);
    if (!task || task.completedToday) return null;

    // Mark task as completed
    const updatedTasks = profile.tasks.map(t =>
        t.id === taskId ? { ...t, completedToday: true } : t
    );
    await updateProfile(profileId, { tasks: updatedTasks });

    // Add transaction
    return await addTransaction({
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
export async function addInitiative(profileId, description) {
    return await addTransaction({
        profileId,
        type: 'initiative',
        amount: 5,
        description: `Iniciativa: ${description}`
    });
}

/**
 * Apply consequence
 */
export async function applyConsequence(profileId, consequenceType, amount, description) {
    return await addTransaction({
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
export async function redeemTime(profileId, minutes) {
    const profile = await getProfile(profileId);
    if (!profile || (profile.balance || 0) <= 0) {
        throw new Error('Privilegios suspendidos - Saldo insuficiente');
    }

    if (profile.balance < minutes) {
        throw new Error(`Saldo insuficiente. Disponible: ${profile.balance} Min`);
    }

    return await addTransaction({
        profileId,
        type: 'redemption',
        amount: -minutes,
        description: `Canjeado: ${minutes} Min`
    });
}

/**
 * Get weekly statistics for a profile
 */
export async function getWeeklyStats(profileId) {
    const transactions = await getProfileTransactions(profileId);
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
