import React, { useState } from 'react';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

export default function DeleteAccount({ onCancel, onSuccess }) {
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (confirmText !== 'LÖSCHEN') {
            alert('Bitte tippe "LÖSCHEN" ein, um fortzufahren.');
            return;
        }

        if (!window.confirm('Bist du dir absolut sicher? Diese Aktion kann nicht rückgängig gemacht werden!')) {
            return;
        }

        setLoading(true);
        const user = auth.currentUser;

        try {
            // Lösche alle User-Daten aus Firestore

            // 1. Hauptdaten
            await deleteDoc(doc(db, 'users', user.uid));

            // 2. Gewichtseinträge
            const weightQuery = query(collection(db, 'weightEntries'), where('userId', '==', user.uid));
            const weightSnapshot = await getDocs(weightQuery);
            await Promise.all(weightSnapshot.docs.map(doc => deleteDoc(doc.ref)));

            // 3. Kalorieneinträge
            const calorieQuery = query(collection(db, 'calorieEntries'), where('userId', '==', user.uid));
            const calorieSnapshot = await getDocs(calorieQuery);
            await Promise.all(calorieSnapshot.docs.map(doc => deleteDoc(doc.ref)));

            // 4. User Account löschen
            await deleteUser(user);

            alert('Dein Account wurde erfolgreich gelöscht.');
            onSuccess();
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            if (error.code === 'auth/requires-recent-login') {
                alert('Aus Sicherheitsgründen musst du dich erneut anmelden, um deinen Account zu löschen.');
            } else {
                alert('Fehler beim Löschen: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-red-900 mb-4">Account dauerhaft löschen</h3>

            <div className="mb-4 text-sm text-red-800">
                <p className="mb-2">⚠️ Diese Aktion löscht:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Alle deine Gewichtseinträge</li>
                    <li>Alle deine Kalorieneinträge</li>
                    <li>Deine Benutzereinstellungen</li>
                    <li>Deinen Account unwiderruflich</li>
                </ul>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-red-900 mb-2">
                    Tippe "LÖSCHEN" um zu bestätigen:
                </label>
                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="LÖSCHEN"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handleDelete}
                    disabled={loading || confirmText !== 'LÖSCHEN'}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Wird gelöscht...' : 'Account endgültig löschen'}
                </button>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                    Abbrechen
                </button>
            </div>
        </div>
    );
}