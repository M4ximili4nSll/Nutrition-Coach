import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Activity, Target, Trash2 } from 'lucide-react';

export default function MacroCoachApp() {
  const [step, setStep] = useState('setup');
  const [userData, setUserData] = useState({
    age: 30,
    gender: 'male',
    height: 180,
    currentWeight: 90,
    targetWeight: 80,
    activityLevel: 1.5,
    goal: 'lose',
    weeklyGoal: 0.5
  });
  
  const [weightEntries, setWeightEntries] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [tdee, setTdee] = useState(0);
  const [recommendations, setRecommendations] = useState(null);
  const [weeklyAverages, setWeeklyAverages] = useState([]);
  const [calorieHistory, setCalorieHistory] = useState([]);

  // Berechne initiale TDEE mit Mifflin-St Jeor
  const calculateInitialTDEE = (data) => {
    let bmr;
    if (data.gender === 'male') {
      bmr = 10 * data.currentWeight + 6.25 * data.height - 5 * data.age + 5;
    } else {
      bmr = 10 * data.currentWeight + 6.25 * data.height - 5 * data.age - 161;
    }
    return Math.round(bmr * data.activityLevel);
  };

  // Berechne Makros
  const calculateMacros = (calories, weight) => {
    const protein = Math.round(weight * 2.0); // 2g pro kg
    const proteinCals = protein * 4;
    
    const fatPercent = 0.30;
    const fatCals = Math.round(calories * fatPercent);
    const fat = Math.round(fatCals / 9);
    
    const carbCals = calories - proteinCals - fatCals;
    const carbs = Math.round(carbCals / 4);
    
    return { protein, fat, carbs };
  };

  // Berechne Kalorienziel
  const calculateCalorieTarget = (currentTDEE, goal, weeklyGoal) => {
    const weeklyCalDeficit = weeklyGoal * 7700; // 7700 kcal = 1 kg
    const dailyDeficit = weeklyCalDeficit / 7;
    
    let target;
    if (goal === 'lose') {
      target = Math.round(currentTDEE - dailyDeficit);
    } else if (goal === 'gain') {
      target = Math.round(currentTDEE + dailyDeficit);
    } else {
      target = currentTDEE;
    }
    
    // Sicherheitsgrenzen: Minimum 1200 kcal, Maximum 5000 kcal
    return Math.max(1200, Math.min(5000, target));
  };

  // Berechne Wochendurchschnitt
  const calculateWeeklyAverage = (week) => {
    const weekEntries = weightEntries.filter(e => e.week === week);
    if (weekEntries.length === 0) return null;
    const sum = weekEntries.reduce((acc, e) => acc + e.weight, 0);
    return sum / weekEntries.length;
  };

  // Anpassung der TDEE basierend auf tatsächlichem Fortschritt
  const adjustTDEE = () => {
    // Mindestens 3 Wochen Daten für verlässliche Anpassung
    if (weeklyAverages.length < 3) return tdee;

    // Berechne Trend über die letzten 3 Wochen
    const recentWeeks = weeklyAverages.slice(-3);
    const oldestWeight = recentWeeks[0].avgWeight;
    const newestWeight = recentWeeks[recentWeeks.length - 1].avgWeight;
    const weeksSpan = recentWeeks.length;
    
    const actualWeeklyChange = (oldestWeight - newestWeight) / weeksSpan;
    const expectedWeeklyChange = userData.goal === 'lose' ? userData.weeklyGoal : 
                                  userData.goal === 'gain' ? -userData.weeklyGoal : 0;
    
    const difference = actualWeeklyChange - expectedWeeklyChange;
    
    // Nur anpassen wenn Abweichung signifikant (>0.15 kg/Woche über 3 Wochen)
    if (Math.abs(difference) > 0.15) {
      // Konservative Anpassung: 50% der berechneten Differenz
      const calorieAdjustment = (difference * 7700 / 7) * 0.5;
      
      // Begrenze Anpassung auf max ±200 kcal pro Woche
      const limitedAdjustment = Math.max(-200, Math.min(200, calorieAdjustment));
      
      return Math.round(tdee + limitedAdjustment);
    }
    
    return tdee;
  };

  const handleSetup = () => {
    // Validierung: Ziel muss zu Gewichten passen
    if (userData.goal === 'lose' && userData.currentWeight <= userData.targetWeight) {
      alert('Zum Abnehmen muss das Zielgewicht niedriger als das aktuelle Gewicht sein!');
      return;
    }
    if (userData.goal === 'gain' && userData.currentWeight >= userData.targetWeight) {
      alert('Zum Zunehmen muss das Zielgewicht höher als das aktuelle Gewicht sein!');
      return;
    }
    
    const initialTDEE = calculateInitialTDEE(userData);
    setTdee(initialTDEE);
    
    const calorieTarget = calculateCalorieTarget(initialTDEE, userData.goal, userData.weeklyGoal);
    const macros = calculateMacros(calorieTarget, userData.currentWeight);
    
    setRecommendations({
      calories: calorieTarget,
      ...macros,
      tdee: initialTDEE
    });
    
    // Initialer Kalorieneintrag für Woche 0
    setCalorieHistory([{
      week: 0,
      calories: calorieTarget,
      tdee: initialTDEE
    }]);
    
    setStep('tracking');
  };

  const addWeightEntry = (weight) => {
    const newEntry = {
      week: currentWeek,
      day: weightEntries.filter(e => e.week === currentWeek).length + 1,
      weight: parseFloat(weight),
      date: new Date().toLocaleDateString(),
      id: Date.now() // Eindeutige ID für jeden Eintrag
    };
    
    setWeightEntries([...weightEntries, newEntry]);
  };

  const removeWeightEntry = (entryId) => {
    setWeightEntries(weightEntries.filter(e => e.id !== entryId));
  };

  const completeWeek = () => {
    const weekAvg = calculateWeeklyAverage(currentWeek);
    if (!weekAvg) {
      alert('Bitte mindestens eine Gewichtsmessung für diese Woche eintragen!');
      return;
    }
    
    const newWeeklyAvg = {
      week: currentWeek,
      avgWeight: parseFloat(weekAvg.toFixed(1))
    };
    
    const updatedAverages = [...weeklyAverages, newWeeklyAvg];
    setWeeklyAverages(updatedAverages);
    
    // Anpassung der TDEE nach mindestens 3 Wochen
    if (updatedAverages.length >= 3) {
      const adjustedTDEE = adjustTDEE();
      if (adjustedTDEE !== tdee) {
        setTdee(adjustedTDEE);
        
        const newCalorieTarget = calculateCalorieTarget(adjustedTDEE, userData.goal, userData.weeklyGoal);
        const currentWeight = weekAvg;
        const newMacros = calculateMacros(newCalorieTarget, currentWeight);
        
        setRecommendations({
          calories: newCalorieTarget,
          ...newMacros,
          tdee: adjustedTDEE
        });
        
        // Speichere Kalorienanpassung
        setCalorieHistory([...calorieHistory, {
          week: currentWeek,
          calories: newCalorieTarget,
          tdee: adjustedTDEE
        }]);
      } else {
        // Auch wenn keine Anpassung, speichere aktuellen Wert
        setCalorieHistory([...calorieHistory, {
          week: currentWeek,
          calories: recommendations.calories,
          tdee: tdee
        }]);
      }
    } else {
      // Erste Wochen: speichere aktuelle Werte
      setCalorieHistory([...calorieHistory, {
        week: currentWeek,
        calories: recommendations.calories,
        tdee: tdee
      }]);
    }
    
    setCurrentWeek(currentWeek + 1);
  };

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Ernährungs-Coach Setup</h1>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alter</label>
                <input
                  type="number"
                  value={userData.age}
                  onChange={(e) => setUserData({...userData, age: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geschlecht</label>
                <select
                  value={userData.gender}
                  onChange={(e) => setUserData({...userData, gender: e.target.value})}
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
                  onChange={(e) => setUserData({...userData, height: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aktuelles Gewicht (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={userData.currentWeight}
                  onChange={(e) => setUserData({...userData, currentWeight: parseFloat(e.target.value)})}
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
                onChange={(e) => setUserData({...userData, targetWeight: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aktivitätslevel</label>
              <select
                value={userData.activityLevel}
                onChange={(e) => setUserData({...userData, activityLevel: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1.2">Sitzend (wenig Bewegung)</option>
                <option value="1.375">Leicht aktiv (1-3 Tage/Woche Sport)</option>
                <option value="1.5">Mäßig aktiv (3-5 Tage/Woche Sport)</option>
                <option value="1.725">Sehr aktiv (6-7 Tage/Woche Sport)</option>
                <option value="1.9">Extrem aktiv (2x täglich Training)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ziel</label>
              <select
                value={userData.goal}
                onChange={(e) => setUserData({...userData, goal: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="lose">Abnehmen</option>
                <option value="maintain">Gewicht halten</option>
                <option value="gain">Zunehmen</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wöchentliches Ziel (kg/Woche)
              </label>
              <input
                type="number"
                step="0.1"
                value={userData.weeklyGoal}
                onChange={(e) => setUserData({...userData, weeklyGoal: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
            <div className="flex items-center gap-2 text-blue-600">
              <Target size={24} />
              <span className="font-semibold">{userData.targetWeight} kg</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
              <div className="text-xs opacity-75 mt-1">Gramm/Tag</div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Geschätzter TDEE: {recommendations?.tdee} kcal</h3>
            </div>
            <p className="text-sm text-gray-600">
              Dieser Wert wird automatisch angepasst, basierend auf deinem tatsächlichen Fortschritt.
            </p>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Gewicht eintragen</h3>
            
            <div className="flex gap-4 mb-6">
              <input
                type="number"
                step="0.1"
                placeholder="Gewicht in kg"
                id="weight-input"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('weight-input');
                  if (input.value) {
                    addWeightEntry(input.value);
                    input.value = '';
                  }
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Hinzufügen
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Einträge diese Woche:</h4>
              <div className="space-y-2">
                {weightEntries.filter(e => e.week === currentWeek).map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">Tag {entry.day}</span>
                      <span className="font-semibold text-gray-800">{entry.weight} kg</span>
                    </div>
                    <button
                      onClick={() => removeWeightEntry(entry.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Eintrag löschen"
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
                    Durchschnitt diese Woche: {calculateWeeklyAverage(currentWeek)?.toFixed(1)} kg
                  </div>
                </div>
              )}
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
            
            <div className="mt-6 grid grid-cols-2 gap-4">
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