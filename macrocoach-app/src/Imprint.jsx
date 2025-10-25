import React from 'react';

export default function Imprint({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Impressum</h1>

                <div className="space-y-4 text-gray-700">
                    <section>
                        <h2 className="text-xl font-semibold mb-2">Angaben gemäß § 5 TMG</h2>
                        <p>
                            Maximilian Sell<br />
                            Zum Stollengang 4<br />
                            34260 Kaufungen<br />
                            Deutschland
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
                        <p>
                            maximiliansell93@gmail.com<br />
                            {/* Optional: Telefon, Website */}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-2">Haftungsausschluss</h2>

                        <h3 className="font-semibold mt-3">Haftung für Inhalte</h3>
                        <p className="text-sm">
                            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt.
                            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
                            können wir jedoch keine Gewähr übernehmen.
                        </p>

                        <h3 className="font-semibold mt-3">Medizinischer Haftungsausschluss</h3>
                        <p className="text-sm">
                            Diese App dient nur zu Informationszwecken und ersetzt keine
                            professionelle medizinische oder ernährungswissenschaftliche Beratung.
                            Konsultieren Sie bei gesundheitlichen Fragen immer eine Ärztin, einen Arzt oder
                            eine qualifizierten Ernährungsberatung.
                        </p>
                    </section>
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