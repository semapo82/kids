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
    increment,
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
let currentFamilyId = null;
let familyChangeListeners = [];
let dataChangeListeners = [];

/**
 * Get the current family ID
 */
export function getActiveFamilyId() {
    return currentFamilyId;
}

/**
 * Subscribe to family ID changes
 */
export function subscribeToFamilyChange(callback) {
    familyChangeListeners.push(callback);
    callback(currentFamilyId);
    return () => {
        familyChangeListeners = familyChangeListeners.filter(l => l !== callback);
    };
}

function notifyFamilyChange() {
    familyChangeListeners.forEach(l => l(currentFamilyId));
}

/**
 * Subscribe to generic data changes (for local reactivity)
 */
export function subscribeToDataChange(callback) {
    dataChangeListeners.push(callback);
    return () => {
        dataChangeListeners = dataChangeListeners.filter(l => l !== callback);
    };
}

function notifyDataChange() {
    dataChangeListeners.forEach(l => l());
}

/**
 * Set the current authenticated user and trigger sync
 */
export async function setAuthUser(user) {
    const previousUser = currentUser;
    currentUser = user;

    if (user && !previousUser) {
        // 1. Ensure user has a familyId config
        await ensureFamilyConfig();

        // 2. Sync local data if any (now to the family collection)
        await syncLocalDataToCloud();

        // 3. Check for weekly reset immediately after auth/sync
        await checkWeeklyReset();
    } else if (!user) {
        currentFamilyId = null;
        notifyFamilyChange();
    }
}

/**
 * Ensures the user has a familyId in Firestore, creating one if necessary.
 * Also handles migration from old user-centric path if needed.
 */
async function ensureFamilyConfig() {
    if (!currentUser) return;

    const userConfigRef = doc(db, 'users', currentUser.uid);
    const configSnap = await getDoc(userConfigRef);

    if (configSnap.exists() && configSnap.data().familyId) {
        currentFamilyId = configSnap.data().familyId;
    } else {
        // Use UID as initial familyId
        currentFamilyId = currentUser.uid;
        await setDoc(userConfigRef, { familyId: currentFamilyId }, { merge: true });

        // Check for "old" data in users/{uid}/profiles and move it if found
        await migrateStoreFromUserToFamily(currentUser.uid, currentFamilyId);
    }
    notifyFamilyChange();
}

/**
 * Migrates data from the old users/{uid} structure to families/{familyId}
 */
async function migrateStoreFromUserToFamily(uid, familyId) {
    const oldProfilesQ = collection(db, 'users', uid, 'profiles');
    const profilesSnap = await getDocs(oldProfilesQ);

    for (const profileDoc of profilesSnap.docs) {
        const data = profileDoc.data();
        await setDoc(doc(db, 'families', familyId, 'profiles', profileDoc.id), data);
        await deleteDoc(profileDoc.ref);
    }

    const oldTxsQ = collection(db, 'users', uid, 'transactions');
    const txsSnap = await getDocs(oldTxsQ);

    for (const txDoc of txsSnap.docs) {
        const data = txDoc.data();
        await setDoc(doc(db, 'families', familyId, 'transactions', txDoc.id), data);
        await deleteDoc(txDoc.ref);
    }
}

/**
 * Join a different family using a code
 */
export async function joinFamily(familyId) {
    if (!currentUser) throw new Error('Debes estar autenticado');

    const userConfigRef = doc(db, 'users', currentUser.uid);
    await setDoc(userConfigRef, { familyId }, { merge: true });
    currentFamilyId = familyId;
    notifyFamilyChange();

    // The UI will re-subscribe thanks to useEffects triggering on familyId change
    return true;
}

/**
 * Migrate local data to Firestore (now to family collection)
 */
async function syncLocalDataToCloud() {
    if (!currentUser || !currentFamilyId) return;

    try {
        console.log(`Synchronizing local data to family: ${currentFamilyId}`);

        // 1. Sync Profiles
        const localProfilesData = localStorage.getItem(STORAGE_KEYS.PROFILES);
        const localProfiles = localProfilesData ? JSON.parse(localProfilesData) : [];

        for (const profile of localProfiles) {
            const docRef = doc(db, 'families', currentFamilyId, 'profiles', profile.id);
            await setDoc(docRef, profile, { merge: true });
        }

        // 2. Sync Transactions
        const localTxsData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const localTxs = localTxsData ? JSON.parse(localTxsData) : [];

        for (const tx of localTxs) {
            const docRef = doc(db, 'families', currentFamilyId, 'transactions', tx.id);
            await setDoc(docRef, tx, { merge: true });
        }

        if (localProfiles.length > 0 || localTxs.length > 0) {
            console.log(`Successfully migrated ${localProfiles.length} profiles and ${localTxs.length} transactions to family.`);
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
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    }
}

/**
 * Check and perform weekly reset for the family
 */
async function checkWeeklyReset() {
    if (!currentUser || !currentFamilyId) return;

    const familyConfigRef = doc(db, 'families', currentFamilyId, 'config', 'settings');
    const familyConfigSnap = await getDoc(familyConfigRef);

    let lastReset = null;
    if (familyConfigSnap.exists()) {
        lastReset = familyConfigSnap.data().lastReset;
    }

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

    if (currentFamilyId) {
        const familyConfigRef = doc(db, 'families', currentFamilyId, 'config', 'settings');
        await setDoc(familyConfigRef, { lastReset: now }, { merge: true });
    }
    localStorage.setItem(STORAGE_KEYS.LAST_RESET, now);
}

/**
 * Get all profiles
 */
export async function getProfiles() {
    if (currentUser && currentFamilyId) {
        const q = collection(db, 'families', currentFamilyId, 'profiles');
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
    if (currentUser && currentFamilyId) {
        const q = collection(db, 'families', currentFamilyId, 'profiles');
        return onSnapshot(q, (snapshot) => {
            const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(profiles);
        }, (error) => {
            console.error("Firestore SubscribeToProfiles Error:", error);
            getProfiles().then(callback);
        });
    } else {
        const handler = () => {
            getProfiles().then(callback);
        };
        handler(); // Initial load
        return subscribeToDataChange(handler);
    }
}

/**
 * Save profiles
 */
export async function saveProfiles(profiles) {
    if (currentUser && currentFamilyId) {
        for (const profile of profiles) {
            const docRef = doc(db, 'families', currentFamilyId, 'profiles', profile.id);
            await setDoc(docRef, profile, { merge: true });
        }
    }
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    notifyDataChange();
}

/**
 * Get profile by ID
 */
export async function getProfile(id) {
    if (currentUser && currentFamilyId) {
        const docRef = doc(db, 'families', currentFamilyId, 'profiles', id);
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
    if (currentUser && currentFamilyId) {
        const docRef = doc(db, 'families', currentFamilyId, 'profiles', id);
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
        const handler = () => {
            getProfile(id).then(callback);
        };
        handler();
        return subscribeToDataChange(handler);
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
                id: `task_${index}_${Date.now()}`,
                name: task.name,
                points: Math.max(1, parseInt(task.points) || 5),
                completedToday: false,
                isManual: task.isManual || false
            })),
            {
                id: 'breathing',
                name: 'Respiración consciente',
                points: 5,
                completedToday: false
            }
        ],
        consequences: profileData.consequences || [],
        weeklyPlan: profileData.weeklyPlan || {
            friday: 0, saturday: 0, sunday: 0, monday: 0,
            tuesday: 0, wednesday: 0, thursday: 0
        },
        createdAt: new Date().toISOString()
    };

    if (currentUser && currentFamilyId) {
        const docRef = doc(db, 'families', currentFamilyId, 'profiles', newProfile.id);
        await setDoc(docRef, newProfile);
    } else {
        const profiles = await getProfiles();
        profiles.push(newProfile);
        await saveProfiles(profiles);
    }

    await addTransaction({
        profileId: newProfile.id,
        type: 'reset',
        amount: INITIAL_BALANCE,
        description: 'Perfil creado - Regalo inicial',
        timestamp: new Date().toISOString()
    }, true);

    return newProfile;
}

/**
 * Update profile
 */
export async function updateProfile(id, updates) {
    if (currentUser && currentFamilyId) {
        const docRef = doc(db, 'families', currentFamilyId, 'profiles', id);
        await updateDoc(docRef, updates);
        return { id, ...updates };
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
    if (currentUser && currentFamilyId) {
        const docRef = doc(db, 'families', currentFamilyId, 'profiles', id);
        await deleteDoc(docRef);

        const txsQ = query(collection(db, 'families', currentFamilyId, 'transactions'), where('profileId', '==', id));
        const txsSnapshot = await getDocs(txsQ);
        for (const txDoc of txsSnapshot.docs) {
            await deleteDoc(txDoc.ref);
        }
    } else {
        const transactions = await getTransactions();
        const filteredTransactions = transactions.filter(t => t.profileId !== id);
        await saveTransactions(filteredTransactions);
        const profiles = await getProfiles();
        const filtered = profiles.filter(p => p.id !== id);
        await saveProfiles(filtered);
    }
}

/**
 * Get all transactions
 */
export async function getTransactions() {
    if (currentUser && currentFamilyId) {
        const q = collection(db, 'families', currentFamilyId, 'transactions');
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
    if (currentUser && currentFamilyId) {
        for (const tx of transactions) {
            const docRef = doc(db, 'families', currentFamilyId, 'transactions', tx.id);
            await setDoc(docRef, tx, { merge: true });
        }
    }
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    notifyDataChange();
}

/**
 * Get transactions for a specific profile
 */
export async function getProfileTransactions(profileId, limit = null) {
    if (currentUser && currentFamilyId) {
        let q = query(
            collection(db, 'families', currentFamilyId, 'transactions'),
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
    if (currentUser && currentFamilyId) {
        let q = query(
            collection(db, 'families', currentFamilyId, 'transactions'),
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
        const handler = () => {
            getProfileTransactions(profileId, limit).then(callback);
        };
        handler();
        return subscribeToDataChange(handler);
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

    if (currentUser && currentFamilyId) {
        const docRef = doc(db, 'families', currentFamilyId, 'transactions', newTransaction.id);
        await setDoc(docRef, newTransaction);
    } else {
        const transactions = await getTransactions();
        transactions.push(newTransaction);
        await saveTransactions(transactions);
    }

    if (!skipProfileUpdate) {
        const amount = Number(transaction.amount);
        if (currentUser && currentFamilyId) {
            const profileRef = doc(db, 'families', currentFamilyId, 'profiles', transaction.profileId);
            await setDoc(profileRef, { balance: increment(amount) }, { merge: true });
        } else {
            const profile = await getProfile(transaction.profileId);
            if (profile) {
                const newBalance = Number(profile.balance || 0) + amount;
                await updateProfile(profile.id, { balance: newBalance });
            }
        }
    }

    return newTransaction;
}

/**
 * Complete a task
 */
export async function completeTask(profileId, taskId, date = new Date()) {
    const profile = await getProfile(profileId);
    if (!profile) return null;

    const task = profile.tasks.find(t => t.id === taskId);
    if (!task) return null;

    // Add transaction
    return await addTransaction({
        profileId,
        type: 'task',
        amount: task.points,
        description: `Tarea completada: ${task.name}`,
        taskId,
        timestamp: date.toISOString()
    });
}

/**
 * Undo a task completion (Uncheck)
 */
export async function undoTaskCompletion(profileId, taskId, date = new Date()) {
    const profile = await getProfile(profileId);
    if (!profile) return null;

    const task = profile.tasks.find(t => t.id === taskId);
    if (!task) return null;

    // We don't delete the old transaction (to keep history consistent), 
    // instead we add a reversal transaction.
    return await addTransaction({
        profileId,
        type: 'task_reversal',
        amount: -task.points,
        description: `Tarea desmarcada: ${task.name}`,
        taskId,
        timestamp: date.toISOString()
    });
}

/**
 * Add initiative (custom task)
 */
export async function addInitiative(profileId, description, date = new Date()) {
    return await addTransaction({
        profileId,
        type: 'initiative',
        amount: 5,
        description: `Iniciativa: ${description}`,
        timestamp: date.toISOString()
    });
}

export async function applyConsequence(profileId, consequenceType, amount, description, date = new Date(), targetSession = null) {
    return await addTransaction({
        profileId,
        type: 'consequence',
        amount: -Math.abs(amount), // Ensure negative
        description: `Consecuencia: ${description}${targetSession ? ` (Afecta a: ${targetSession})` : ''}`,
        consequenceType,
        targetSession, // e.g., 'friday', 'saturday'
        timestamp: date.toISOString()
    });
}

/**
 * Undo a consequence (Uncheck)
 */
export async function undoConsequence(profileId, consequenceType, amount, description, date = new Date(), targetSession = null) {
    return await addTransaction({
        profileId,
        type: 'consequence_reversal',
        amount: Math.abs(amount), // Positive to cancel out penalty
        description: `Consecuencia anulada: ${description}${targetSession ? ` (Afecta a: ${targetSession})` : ''}`,
        consequenceType,
        targetSession,
        timestamp: date.toISOString()
    });
}

/**
 * Redeem time from bank
 */
export async function redeemTime(profileId, minutes, date = new Date()) {
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
        description: `Canjeado: ${minutes} Min`,
        timestamp: date.toISOString()
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
