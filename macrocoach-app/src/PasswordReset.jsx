import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';

export default function PasswordReset({ onBack }) {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (error) {
            alert('Fehler: ' + error.message);
        }
    };

    if (sent) {
        return (
            <div className="text-center">
                <p className="text-green-600 mb-4">
                    Email zum Zurücksetzen wurde gesendet!
                </p>
                <button onClick={onBack} className="text-blue-600">
                    Zurück zum Login
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleReset} className="space-y-4">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail"
                required
                className="w-full px-4 py-2 border rounded-lg"
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg">
                Passwort zurücksetzen
            </button>
            <button type="button" onClick={onBack} className="w-full text-gray-600">
                Zurück
            </button>
        </form>
    );
}