import React from 'react';

export default function Privacy({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl max-h-[90vh] overflow-y-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Datenschutzerklärung</h1>

                <div className="space-y-4 text-gray-700">
                    <section>
                        <h2 className="text-xl font-semibold mb-2">1. Verantwortlicher</h2>
                        <p>
                            [Maximilian Sell]<br />
                            [Zum Stollengang 4, 34260 Kaufungen]<br />
                            E-Mail: [maximiliansell93@gmail.com]
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">2. Erhebung und Speicherung personenbezogener Daten</h2>
                        <p>
                            Wir erheben und speichern folgende Daten:
                        </p>
                        <ul className="list-disc list-inside ml-4 mt-2">
                            <li>E-Mail-Adresse (für Login und Account-Verwaltung)</li>
                            <li>Gewichtsdaten (von dir eingetragen)</li>
                            <li>Kaloriendaten (von dir eingetragen)</li>
                            <li>Körperliche Daten (Alter, Größe, Geschlecht)</li>
                            <li>Trainingsziele und Präferenzen</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">3. Zweck der Datenverarbeitung</h2>
                        <p>
                            Deine Daten werden ausschließlich verwendet, um dir personalisierte Ernährungsempfehlungen zu geben und deinen Fortschritt zu tracken.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">4. Rechtsgrundlage</h2>
                        <p>
                            Die Verarbeitung erfolgt auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">5. Weitergabe von Daten</h2>
                        <p>
                            Deine Daten werden nicht an Dritte weitergegeben. Wir nutzen Firebase (Google) als Hosting-Dienstleister, der die Daten in der EU speichert.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">6. Deine Rechte</h2>
                        <p>Du hast folgende Rechte:</p>
                        <ul className="list-disc list-inside ml-4 mt-2">
                            <li>Recht auf Auskunft über deine gespeicherten Daten</li>
                            <li>Recht auf Berichtigung unrichtiger Daten</li>
                            <li>Recht auf Löschung deiner Daten</li>
                            <li>Recht auf Einschränkung der Verarbeitung</li>
                            <li>Recht auf Datenübertragbarkeit</li>
                            <li>Recht auf Widerspruch</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">7. Datenlöschung</h2>
                        <p>
                            Du kannst deinen Account und alle zugehörigen Daten jederzeit selbst löschen. Nutze dafür die "Account löschen"-Funktion in den Einstellungen.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">8. Cookies</h2>
                        <p>
                            Diese App verwendet nur technisch notwendige Cookies für die Authentifizierung. Es werden keine Tracking- oder Werbe-Cookies verwendet.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">9. Änderungen</h2>
                        <p>
                            Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Die aktuelle Version ist immer in der App verfügbar.
                        </p>
                    </section>

                    <p className="text-sm mt-6">
                        Stand: {new Date().toLocaleDateString('de-DE')}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Schließen
                </button>
            </div>
        </div>
    );
}