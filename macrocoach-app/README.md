# Nutrition Coach App 🥗💪

![Tests](https://github.com/DEIN_USERNAME/DEIN_REPO/actions/workflows/test.yml/badge.svg)
![Deploy](https://github.com/DEIN_USERNAME/DEIN_REPO/actions/workflows/deploy.yml/badge.svg)

Eine intelligente Ernährungs-Coaching-App, die adaptive TDEE-Berechnungen und personalisierte Makronährstoff-Empfehlungen bietet, basierend auf der Stronger By Science Methodik.

## 🌟 Features

### Core Funktionalität
- **Adaptive TDEE-Berechnung**: Automatische Anpassung des Gesamtenergieverbrauchs basierend auf tatsächlichem Fortschritt
- **Personalisierte Makros**: Protein, Fette und Kohlenhydrate werden individuell nach Körpergröße, Gewicht und Ziel berechnet
- **Flexible Gewichtseingabe**: Mehrfache Messungen pro Woche für präzisere Durchschnittswerte
- **Kalorie-Tracking**: Optional tracking der tatsächlich gegessenen Kalorien für genauere TDEE-Berechnungen
- **Wissenschaftlich fundiert**: Basiert auf der [Stronger By Science Diet Setup Guide](https://www.strongerbyscience.com/diet/)

### Benutzer-Management
- **Sichere Authentifizierung**: Email/Passwort Login via Firebase Auth
- **Password Reset**: Selbstständiges Zurücksetzen vergessener Passwörter
- **Account Löschen**: DSGVO-konforme Datenlöschung
- **Zyklus-Management**: Beende einen Zyklus und starte mit neuen Zielen, TDEE-Daten bleiben erhalten

### Visualisierung
- **Gewichtsverlauf**: Interaktive Charts mit Wochendurchschnitten
- **Kalorienverlauf**: Visualisierung der angepassten Zielkalorien und TDEE
- **Fortschritts-Tracking**: Übersicht über Start- und aktuelles Gewicht

### Datenschutz & Sicherheit
- **DSGVO-konform**: Vollständige Datenschutzerklärung integriert
- **Datenlöschung**: Alle Daten können jederzeit gelöscht werden
- **Sichere Speicherung**: Daten werden verschlüsselt in Firebase Firestore gespeichert

## 🚀 Live Demo

**URL**: [https://nutrition-coach-f9ce8.web.app](https://nutrition-coach-f9ce8.web.app)

## 📋 Voraussetzungen

- Node.js 18.x oder höher
- npm oder yarn
- Firebase Account
- Git

## 🛠️ Installation

### 1. Repository klonen

```bash
git clone https://github.com/DEIN_USERNAME/nutrition-coach-app.git
cd nutrition-coach-app
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Environment Variables einrichten

Kopiere `.env.example` zu `.env` und füge deine Firebase Credentials ein:

```bash
cp .env.example .env
```

Bearbeite `.env` und trage deine Firebase Config ein:

```env
REACT_APP_FIREBASE_API_KEY=dein_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=dein_projekt.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=dein_projekt_id
REACT_APP_FIREBASE_STORAGE_BUCKET=dein_projekt.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=deine_sender_id
REACT_APP_FIREBASE_APP_ID=deine_app_id
```

### 4. Firebase Setup

#### Firebase Projekt erstellen
1. Gehe zu [Firebase Console](https://console.firebase.google.com)
2. Erstelle ein neues Projekt
3. Aktiv