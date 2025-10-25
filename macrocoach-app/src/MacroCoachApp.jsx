import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Activity, Target, Trash2, LogOut } from 'lucide-react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import Imprint from './Imprint';
import PasswordReset from './PasswordReset';
import DeleteAccount from './DeleteAccount';
import Privacy from './Privacy';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';

export default function MacroCoachApp() {
  const [user, setUser] = useState(null);
  const [showImprint, setShowImprint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCycleComplete, setShowCycleComplete] = useState(false);

  const [step, setStep] = useState('setup');
  const [userData, setUserData] = useState({
    age: 30,
    gender: 'male',
    height: 180,
    currentWeight: 90,
    targetWeight: 80,
    activityLevel: 1.5,
    goal: 'lose',
    weeklyGoalPercent: 0.5
  });

  const [weightEntries, setWeightEntries] = useState([]);
  const [calorieEntries, setCalorieEntries] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [tdee, setTdee] = useState(0);
  const [recommendations, setRecommendations] = useState(null);
  const [weeklyAverages, setWeeklyAverages] = useState([]);
  const [calorieHistory, setCalorieHistory] = useState([]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserData(currentUser.uid);
      }
      setLoading(false);
    });

    return unsubscribe; // Direkt zurückgeben, nicht als Funktion aufrufen
  }, []);

  // Lade Benutzerdaten aus Firestore
  const loadUserData = async (userId) => {
    try {
      // Lade Hauptdaten
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data.userData || userData);
        setStep(data.step || 'setup');
        setCurrentWeek(data.currentWeek || 1);
        setTdee(data.tdee || 0);
        setRecommendations(data.recommendations || null);
        setWeeklyAverages(data.weeklyAverages || []);
        setCalorieHistory(data.calorieHistory || []);
      }

      // Lade Gewichtseinträge
      const weightQuery = query(collection(db, 'weightEntries'), where('userId', '==', userId));
      const weightSnapshot = await getDocs(weightQuery);
      const weights = weightSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWeightEntries(weights);

      // Lade Kalorieneinträge
      const calorieQuery = query(collection(db, 'calorieEntries'), where('userId', '==', userId));
      const calorieSnapshot = await getDocs(calorieQuery);
      const calories = calorieSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCalorieEntries(calories);

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  };

  // Speichere Hauptdaten in Firestore
  const saveUserData = async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        userData,
        step,
        currentWeek,
        tdee,
        recommendations,
        weeklyAverages,
        calorieHistory,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  // Speichere bei jeder Änderung
  useEffect(() => {
    if (user && !loading) {
      saveUserData();
    }
  }, [step, currentWeek, tdee, recommendations, weeklyAverages, calorieHistory, userData]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setStep('setup');
      setWeightEntries([]);
      setCalorieEntries([]);
      setCurrentWeek(1);
      setWeeklyAverages([]);
      setCalorieHistory([]);
    } catch (error) {
      alert(error.message);
    }
  };

  const calculateInitialTDEE = (data) => {
    let lbmEstimate;
    if (data.gender === 'male') {
      lbmEstimate = data.currentWeight * 0.85;
    } else {
      lbmEstimate = data.currentWeight * 0.75;
    }

    const bmr = 500 + (22 * lbmEstimate);
    return Math.round(bmr * data.activityLevel);
  };

  const calculateMacros = (calories, weight, height, goal) => {
    let proteinPerKg = 2.0;
    if (goal === 'lose') {
      proteinPerKg = 2.2;
    } else if (goal === 'gain') {
      proteinPerKg = 1.8;
    }
    const protein = Math.round(weight * proteinPerKg);
    const proteinCals = protein * 4;

    const minFat = height < 150 ? 30 : Math.round((height - 150) * 0.5 + 30);

    const targetFatCals = calories * 0.275;
    const targetFat = Math.round(targetFatCals / 9);
    const fat = Math.max(minFat, targetFat);
    const fatCals = fat * 9;

    const carbCals = Math.max(0, calories - proteinCals - fatCals);
    const carbs = Math.round(carbCals / 4);

    return { protein, fat, carbs, minFat };
  };

  const calculateCalorieTarget = (currentTDEE, goal, weeklyGoalPercent, currentWeight) => {
    const weeklyGoalKg = (weeklyGoalPercent / 100) * currentWeight;
    const weeklyCalDeficit = weeklyGoalKg * 7700;
    const dailyDeficit = weeklyCalDeficit / 7;

    let target;
    if (goal === 'lose') {
      target = Math.round(currentTDEE - dailyDeficit);
    } else if (goal === 'gain') {
      target = Math.round(currentTDEE + dailyDeficit);
    } else {
      target = currentTDEE;
    }

    return Math.max(1200, Math.min(5000, target));
  };

  const calculateWeeklyAverage = (week, entries) => {
    const weekEntries = entries.filter(e => e.week === week);
    if (weekEntries.length === 0) return null;
    const sum = weekEntries.reduce((acc, e) => acc + e.value, 0);
    return sum / weekEntries.length;
  };

  const adjustTDEE = (currentWeight) => {
    if (weeklyAverages.length < 3) return tdee;

    const recentWeeks = weeklyAverages.slice(-3);
    const oldestWeek = recentWeeks[0];
    const newestWeek = recentWeeks[recentWeeks.length - 1];

    const numDays = 7 * 3;

    const relevantCalories = calorieHistory.filter(ch =>
      ch.week >= oldestWeek.week && ch.week <= newestWeek.week
    );

    let avgDailyCalories;
    if (relevantCalories.length > 0 && relevantCalories.some(c => c.avgCalories !== null)) {
      const trackedCalories = relevantCalories.filter(c => c.avgCalories !== null);
      const totalCalories = trackedCalories.reduce((sum, c) => sum + (c.avgCalories * 7), 0);
      avgDailyCalories = totalCalories / numDays;
    } else {
      avgDailyCalories = recommendations.calories;
    }

    const totalWeightChange = oldestWeek.avgWeight - newestWeek.avgWeight;
    const energyFromBodyChange = (totalWeightChange * 7700) / numDays;
    const calculatedTDEE = Math.round(avgDailyCalories + energyFromBodyChange);

    const maxChange = 300;
    const tdeeChange = calculatedTDEE - tdee;

    if (Math.abs(tdeeChange) > maxChange) {
      return tdee + (tdeeChange > 0 ? maxChange : -maxChange);
    }

    return calculatedTDEE;
  };

  const handleSetup = () => {
    if (userData.goal === 'lose' && userData.currentWeight <= userData.targetWeight) {
      alert('Zum Abnehmen muss das Zielgewicht niedriger als das aktuelle Gewicht sein!');
      return;
    }
    if (userData.goal === 'gain' && userData.currentWeight >= userData.targetWeight) {
      alert('Zum Zunehmen muss das Zielgewicht höher als das aktuelle Gewicht sein!');
      return;
    }

    // Verwende bekannte TDEE falls vorhanden, sonst berechne neu
    const initialTDEE = tdee > 0 ? tdee : calculateInitialTDEE(userData);
    setTdee(initialTDEE);

    const calorieTarget = calculateCalorieTarget(
      initialTDEE,
      userData.goal,
      userData.weeklyGoalPercent,
      userData.currentWeight
    );
    const macros = calculateMacros(
      calorieTarget,
      userData.currentWeight,
      userData.height,
      userData.goal
    );

    setRecommendations({
      calories: calorieTarget,
      ...macros,
      tdee: initialTDEE
    });

    setCalorieHistory([{
      week: 0,
      calories: calorieTarget,
      tdee: initialTDEE,
      avgCalories: null
    }]);

    setStep('tracking');
  };

  const addWeightEntry = async (weight) => {
    if (!user) return;

    const newEntry = {
      userId: user.uid,
      week: currentWeek,
      day: weightEntries.filter(e => e.week === currentWeek).length + 1,
      value: parseFloat(weight),
      createdAt: new Date()
    };

    try {
      const docRef = await addDoc(collection(db, 'weightEntries'), newEntry);
      setWeightEntries([...weightEntries, { id: docRef.id, ...newEntry }]);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const addCalorieEntry = async (calories) => {
    if (!user) return;

    const newEntry = {
      userId: user.uid,
      week: currentWeek,
      day: calorieEntries.filter(e => e.week === currentWeek).length + 1,
      value: parseFloat(calories),
      createdAt: new Date()
    };

    try {
      const docRef = await addDoc(collection(db, 'calorieEntries'), newEntry);
      setCalorieEntries([...calorieEntries, { id: docRef.id, ...newEntry }]);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const removeEntry = async (entryId, isWeight) => {
    try {
      const collectionName = isWeight ? 'weightEntries' : 'calorieEntries';
      await deleteDoc(doc(db, collectionName, entryId));

      if (isWeight) {
        setWeightEntries(weightEntries.filter(e => e.id !== entryId));
      } else {
        setCalorieEntries(calorieEntries.filter(e => e.id !== entryId));
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const completeWeek = () => {
    const weekAvgWeight = calculateWeeklyAverage(currentWeek, weightEntries);
    if (!weekAvgWeight) {
      alert('Bitte mindestens eine Gewichtsmessung für diese Woche eintragen!');
      return;
    }

    const weekAvgCalories = calculateWeeklyAverage(currentWeek, calorieEntries);

    const newWeeklyAvg = {
      week: currentWeek,
      avgWeight: parseFloat(weekAvgWeight.toFixed(1)),
      avgCalories: weekAvgCalories ? parseFloat(weekAvgCalories.toFixed(0)) : null
    };

    const updatedAverages = [...weeklyAverages, newWeeklyAvg];
    setWeeklyAverages(updatedAverages);

    if (updatedAverages.length >= 3) {
      const adjustedTDEE = adjustTDEE(weekAvgWeight);

      if (adjustedTDEE !== tdee) {
        setTdee(adjustedTDEE);

        const newCalorieTarget = calculateCalorieTarget(
          adjustedTDEE,
          userData.goal,
          userData.weeklyGoalPercent,
          weekAvgWeight
        );
        const newMacros = calculateMacros(
          newCalorieTarget,
          weekAvgWeight,
          userData.height,
          userData.goal
        );

        setRecommendations({
          calories: newCalorieTarget,
          ...newMacros,
          tdee: adjustedTDEE
        });

        setCalorieHistory([...calorieHistory, {
          week: currentWeek,
          calories: newCalorieTarget,
          tdee: adjustedTDEE,
          avgCalories: weekAvgCalories
        }]);
      } else {
        setCalorieHistory([...calorieHistory, {
          week: currentWeek,
          calories: recommendations.calories,
          tdee: tdee,
          avgCalories: weekAvgCalories
        }]);
      }
    } else {
      setCalorieHistory([...calorieHistory, {
        week: currentWeek,
        calories: recommendations.calories,
        tdee: tdee,
        avgCalories: weekAvgCalories
      }]);
    }

    setCurrentWeek(currentWeek + 1);
  };

  const completeCycle = async () => {
    if (!window.confirm('Möchtest du diesen Zyklus wirklich abschließen? Du kannst dann mit neuen Zielen einen neuen Zyklus starten.')) {
      return;
    }

    try {
      // Speichere die finale TDEE und Daten als "abgeschlossener Zyklus"
      const cycleData = {
        completedAt: new Date(),
        finalTDEE: tdee,
        finalWeight: weeklyAverages.length > 0 ? weeklyAverages[weeklyAverages.length - 1].avgWeight : userData.currentWeight,
        totalWeeks: currentWeek - 1,
        startWeight: userData.currentWeight,
        targetWeight: userData.targetWeight,
        goal: userData.goal
      };

      if (user) {
        // Speichere abgeschlossenen Zyklus in einer History-Collection
        await addDoc(collection(db, 'cycleHistory'), {
          userId: user.uid,
          ...cycleData
        });
      }

      // Setze userData zurück, aber behalte bekannte TDEE und aktuelles Gewicht
      const newUserData = {
        ...userData,
        currentWeight: cycleData.finalWeight,
        // Andere Felder bleiben für Setup erhalten
      };

      setUserData(newUserData);

      // Setze Tracking-Daten zurück
      setWeightEntries([]);
      setCalorieEntries([]);
      setCurrentWeek(1);
      setWeeklyAverages([]);
      setCalorieHistory([]);
      setRecommendations(null);
      // TDEE bleibt erhalten für Setup!

      // Zurück zum Setup
      setStep('setup');

      alert('Zyklus erfolgreich abgeschlossen! Du kannst jetzt ein neues Ziel setzen.');
    } catch (error) {
      console.error('Fehler beim Abschließen des Zyklus:', error);
      alert('Fehler beim Abschließen: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Lädt...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Nutrition Coach
          </h1>

          {showPasswordReset ? (
            <PasswordReset onBack={() => setShowPasswordReset(false)} />
          ) : (
            <>
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${authMode === 'login'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${authMode === 'register'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  Registrieren
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passwort
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {authMode === 'login' ? 'Anmelden' : 'Konto erstellen'}
                </button>

                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Passwort vergessen?
                  </button>
                )}
              </form>
            </>
          )}
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Datenschutzerklärung
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => setShowImprint(true)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Impressum
            </button>
          </div>

          {showPrivacy && <Privacy onClose={() => setShowPrivacy(false)} />}
          {showImprint && <Imprint onClose={() => setShowImprint(false)} />}
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Ernährungs-Coach Setup</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Abmelden
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alter</label>
                <input
                  type="number"
                  value={userData.age}
                  onChange={(e) => setUserData({ ...userData, age: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geschlecht</label>
                <select
                  value={userData.gender}
                  onChange={(e) => setUserData({ ...userData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="male">Männlich</option>
                  <option value="female">Weiblich</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Größe (cm)</label>
                <input
                  type="number"
                  value={userData.height}
                  onChange={(e) => setUserData({ ...userData, height: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aktuelles Gewicht (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={userData.currentWeight}
                  onChange={(e) => setUserData({ ...userData, currentWeight: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zielgewicht (kg)</label>
              <input
                type="number"
                step="0.1"
                value={userData.targetWeight}
                onChange={(e) => setUserData({ ...userData, targetWeight: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aktivitätslevel</label>
              <select
                value={userData.activityLevel}
                onChange={(e) => setUserData({ ...userData, activityLevel: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1.2">Sitzend (wenig Bewegung)</option>
                <option value="1.375">Leicht aktiv (1-3 Tage/Woche Sport)</option>
                <option value="1.5">Mäßig aktiv (3-5 Tage/Woche Sport)</option>
                <option value="1.725">Sehr aktiv (6-7 Tage/Woche Sport)</option>
                <option value="1.9">Extrem aktiv (2x täglich Training)</option>
              </select>
            </div>

            {tdee > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 mb-2">
                  <strong>Bekannte TDEE aus vorherigem Zyklus:</strong>
                </p>
                <p className="text-2xl font-bold text-green-900">{tdee} kcal</p>
                <p className="text-xs text-green-700 mt-2">
                  Diese wird als Basis für deinen neuen Zyklus verwendet.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ziel</label>
              <select
                value={userData.goal}
                onChange={(e) => setUserData({ ...userData, goal: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="lose">Abnehmen</option>
                <option value="maintain">Gewicht halten</option>
                <option value="gain">Zunehmen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wöchentliches Ziel (% des Körpergewichts/Woche)
              </label>
              <select
                value={userData.weeklyGoalPercent}
                onChange={(e) => setUserData({ ...userData, weeklyGoalPercent: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {userData.goal === 'lose' ? (
                  <>
                    <option value="0.25">0.25% - Langsam (konservativ)</option>
                    <option value="0.5">0.5% - Moderat</option>
                    <option value="0.75">0.75% - Schnell</option>
                    <option value="1.0">1.0% - Sehr schnell (aggressiv)</option>
                  </>
                ) : userData.goal === 'gain' ? (
                  <>
                    <option value="0.1">0.1% - Sehr langsam</option>
                    <option value="0.25">0.25% - Moderat</option>
                    <option value="0.5">0.5% - Aggressiv</option>
                  </>
                ) : (
                  <option value="0">0% - Gewicht halten</option>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {userData.goal === 'lose' && `≈ ${(userData.currentWeight * userData.weeklyGoalPercent / 100).toFixed(2)} kg/Woche`}
                {userData.goal === 'gain' && `≈ ${(userData.currentWeight * userData.weeklyGoalPercent / 100).toFixed(2)} kg/Woche`}
              </p>
            </div>

            <button
              onClick={handleSetup}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Coach starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Woche {currentWeek}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Target size={24} />
                <span className="font-semibold">{userData.targetWeight} kg</span>
              </div>
              <button
                onClick={() => setShowCycleComplete(true)}
                className="px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm"
              >
                Zyklus beenden
              </button>


            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Ernährungs-Coach Setup</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {showDeleteAccount && (
            <div className="mb-6">
              <DeleteAccount
                onCancel={() => setShowDeleteAccount(false)}
                onSuccess={handleLogout}
              />
            </div>
          )}
          {showCycleComplete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Zyklus abschließen?</h2>

                <div className="space-y-3 mb-6 text-gray-700">
                  <p>Du bist dabei, diesen Zyklus zu beenden:</p>

                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Wochen absolviert:</span>
                      <span>{currentWeek - 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Startgewicht:</span>
                      <span>{userData.currentWeight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Aktuelles Gewicht:</span>
                      <span>
                        {weeklyAverages.length > 0
                          ? weeklyAverages[weeklyAverages.length - 1].avgWeight
                          : userData.currentWeight} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Finale TDEE:</span>
                      <span>{tdee} kcal</span>
                    </div>
                  </div>

                  <p className="text-sm">
                    ✓ Deine finale TDEE wird gespeichert<br />
                    ✓ Dein aktuelles Gewicht wird übernommen<br />
                    ✓ Du kannst ein neues Ziel setzen<br />
                    ✓ Alle Verlaufsdaten werden archiviert
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCycleComplete(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => {
                      setShowCycleComplete(false);
                      completeCycle();
                    }}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Zyklus beenden
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Kalorien</div>
              <div className="text-3xl font-bold">{recommendations?.calories}</div>
              <div className="text-xs opacity-75 mt-1">kcal/Tag</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Protein</div>
              <div className="text-3xl font-bold">{recommendations?.protein}</div>
              <div className="text-xs opacity-75 mt-1">Gramm/Tag</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Kohlenhydrate</div>
              <div className="text-3xl font-bold">{recommendations?.carbs}</div>
              <div className="text-xs opacity-75 mt-1">Gramm/Tag</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Fett</div>
              <div className="text-3xl font-bold">{recommendations?.fat}</div>
              <div className="text-xs opacity-75 mt-1">g/Tag (Min: {recommendations?.minFat})</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <Activity className="text-blue-600 flex-shrink-0" size={20} />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Geschätzter TDEE: {recommendations?.tdee} kcal
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              Ab Woche 3 wird dieser Wert automatisch angepasst basierend auf deinem Fortschritt und deinen tatsächlich gegessenen Kalorien.
            </p>
          </div>

          <div className="border-t pt-6 space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Gewicht eintragen</h3>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Gewicht in kg"
                  id="weight-input"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('weight-input');
                    if (input.value) {
                      addWeightEntry(input.value);
                      input.value = '';
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Hinzufügen
                </button>
              </div>

              <div className="space-y-2">
                {weightEntries.filter(e => e.week === currentWeek).map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">Tag {entry.day}</span>
                      <span className="font-semibold text-gray-800">{entry.value} kg</span>
                    </div>
                    <button
                      onClick={() => removeEntry(entry.id, true)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {weightEntries.filter(e => e.week === currentWeek).length === 0 && (
                  <p className="text-gray-500 text-sm italic">Noch keine Einträge für diese Woche</p>
                )}
              </div>
              {weightEntries.filter(e => e.week === currentWeek).length > 0 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="font-semibold text-blue-900">
                    Durchschnitt diese Woche: {calculateWeeklyAverage(currentWeek, weightEntries)?.toFixed(1)} kg
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                Kalorien eintragen (optional)
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Wenn du deine tatsächlich gegessenen Kalorien trackst, nutzt die App diese für genauere TDEE-Berechnungen.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="number"
                  placeholder="Kalorien"
                  id="calorie-input"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('calorie-input');
                    if (input.value) {
                      addCalorieEntry(input.value);
                      input.value = '';
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors whitespace-nowrap"
                >
                  Hinzufügen
                </button>
              </div>

              <div className="space-y-2">
                {calorieEntries.filter(e => e.week === currentWeek).map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center bg-purple-50 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">Tag {entry.day}</span>
                      <span className="font-semibold text-gray-800">{entry.value} kcal</span>
                    </div>
                    <button
                      onClick={() => removeEntry(entry.id, false)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {calorieEntries.filter(e => e.week === currentWeek).length > 0 && (
                  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="font-semibold text-purple-900">
                      Durchschnitt diese Woche: {calculateWeeklyAverage(currentWeek, calorieEntries)?.toFixed(0)} kcal
                    </div>
                  </div>
                )}
              </div>



            </div>

            <button
              onClick={completeWeek}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Woche abschließen
            </button>
          </div>
        </div>

        {weeklyAverages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Fortschritt</h2>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Gewichtsverlauf</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" label={{ value: 'Woche', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Gewicht (kg)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgWeight" stroke="#3b82f6" strokeWidth={3} name="Wochendurchschnitt" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Kalorienverlauf</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={calorieHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" label={{ value: 'Woche', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Kalorien', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={3} name="Zielkalorien" />
                  <Line type="monotone" dataKey="tdee" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Geschätzter TDEE" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Startgewicht</div>
                <div className="text-2xl font-bold text-green-900">{userData.currentWeight} kg</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">Aktuelles Gewicht</div>
                <div className="text-2xl font-bold text-blue-900">
                  {weeklyAverages.length > 0 ? weeklyAverages[weeklyAverages.length - 1].avgWeight : userData.currentWeight} kg
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}