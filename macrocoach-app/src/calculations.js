// Cunningham Gleichung für TDEE
export const calculateInitialTDEE = (data) => {
    let lbmEstimate;
    if (data.gender === 'male') {
        lbmEstimate = data.currentWeight * 0.85;
    } else {
        lbmEstimate = data.currentWeight * 0.75;
    }

    const bmr = 500 + (22 * lbmEstimate);
    return Math.round(bmr * data.activityLevel);
};

// Berechne Makros nach SBS-Guidelines
export const calculateMacros = (calories, weight, height, goal) => {
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

// Berechne Kalorienziel
export const calculateCalorieTarget = (currentTDEE, goal, weeklyGoalPercent, currentWeight) => {
    const weeklyGoalKg = (weeklyGoalPercent / 100) * currentWeight;

    // Nutze adaptive Energiedichte
    const energyDensity = getEnergyDensity(goal, weeklyGoalPercent);
    const weeklyCalDeficit = weeklyGoalKg * energyDensity;
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

// Exponentially Weighted Moving Average für Weight Trending
export const calculateWeightTrend = (weightEntries) => {
    if (weightEntries.length === 0) return null;

    // Sortiere nach Datum (älteste zuerst)
    const sorted = [...weightEntries].sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Alpha-Wert: 0.15 bedeutet 15% neue Daten, 85% alter Trend
    const alpha = 0.15;

    let trend = sorted[0].value;

    for (let i = 1; i < sorted.length; i++) {
        trend = alpha * sorted[i].value + (1 - alpha) * trend;
    }

    return trend;
};

// Berechne Wochendurchschnitt
export const calculateWeeklyAverage = (week, entries) => {
    const weekEntries = entries.filter(e => e.week === week);
    if (weekEntries.length === 0) return null;

    // Nutze EWMA statt einfachem Durchschnitt
    return calculateWeightTrend(weekEntries);
};

// TDEE-Anpassung nach SBS-Methode
export const adjustTDEE = (
    weightEntries,
    calorieHistory,
    tdee,
    recommendations,
    goal,              // NEU
    weeklyGoalPercent  // NEU
) => {
    if (weightEntries.length < 21) return tdee;

    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const recentEntries = weightEntries.filter(e =>
        new Date(e.createdAt) >= threeWeeksAgo
    );

    if (recentEntries.length < 15) return tdee;

    const oldestWeight = calculateWeightTrend(recentEntries.slice(0, 7));
    const newestWeight = calculateWeightTrend(recentEntries.slice(-7));

    const numDays = 21;

    const sortedHistory = [...calorieHistory].sort((a, b) => b.week - a.week);
    const lastWeek = sortedHistory.length > 0 ? sortedHistory[0].week : 0;

    const relevantCalories = calorieHistory.filter(ch =>
        ch.week >= lastWeek - 3 && ch.week <= lastWeek
    );

    let avgDailyCalories;
    if (relevantCalories.length > 0 && relevantCalories.some(c => c.avgCalories !== null)) {
        const trackedCalories = relevantCalories.filter(c => c.avgCalories !== null);
        const totalCalories = trackedCalories.reduce((sum, c) => sum + (c.avgCalories * 7), 0);
        avgDailyCalories = totalCalories / numDays;
    } else {
        avgDailyCalories = recommendations.calories;
    }

    const totalWeightChange = oldestWeight - newestWeight;

    // Nutze adaptive Energiedichte
    const energyDensity = getEnergyDensity(goal, weeklyGoalPercent);
    const energyFromBodyChange = (totalWeightChange * energyDensity) / numDays;

    const calculatedTDEE = Math.round(avgDailyCalories + energyFromBodyChange);

    const maxChange = 300;
    const tdeeChange = calculatedTDEE - tdee;

    if (Math.abs(tdeeChange) > maxChange) {
        return tdee + (tdeeChange > 0 ? maxChange : -maxChange);
    }

    return calculatedTDEE;
};

// Validierungsfunktionen
export const validateGoalWeight = (goal, currentWeight, targetWeight) => {
    if (goal === 'lose' && currentWeight <= targetWeight) {
        return { valid: false, message: 'Zum Abnehmen muss das Zielgewicht niedriger sein!' };
    }
    if (goal === 'gain' && currentWeight >= targetWeight) {
        return { valid: false, message: 'Zum Zunehmen muss das Zielgewicht höher sein!' };
    }
    return { valid: true, message: '' };
};



// Adaptive Energiedichte basierend auf Ziel und Defizit-Größe
export const getEnergyDensity = (goal, weeklyGoalPercent) => {
    // Fat mass: ~7700 kcal/kg
    // Lean mass: ~1000-1700 kcal/kg (durchschnittlich ~1400)

    if (goal === 'lose') {
        // Bei aggressivem Defizit (>0.75%) mehr Lean Mass Loss
        if (weeklyGoalPercent >= 0.75) {
            return 6500; // Mix: mehr Muskelverlust
        }
        // Bei moderatem Defizit (0.5-0.75%)
        if (weeklyGoalPercent >= 0.5) {
            return 7000; // Mix: etwas Muskelverlust
        }
        // Bei konservativem Defizit (<0.5%)
        return 7400; // Fast nur Fat Loss

    } else if (goal === 'gain') {
        // Beim Zunehmen: nicht alles ist Muskel
        // Je aggressiver, desto mehr Fat Gain
        if (weeklyGoalPercent >= 0.5) {
            return 5500; // Viel Fat Gain
        }
        if (weeklyGoalPercent >= 0.25) {
            return 6000; // Moderater Mix
        }
        return 6500; // Lean Bulk, mehr Muskel
    }

    return 7700; // Maintain: sollte nicht verwendet werden
};
export const calculateConfidence = (weeklyAverages, weightEntries) => {
    const totalEntries = weightEntries.length;
    const weeksOfData = weeklyAverages.length;

    // Faktoren:
    // - Mehr Einträge = höher
    // - Mehr Wochen = höher
    // - Konsistenz = höher

    let confidence = Math.min(
        (totalEntries / 30) * 50 + // 50% für genug Einträge
        (weeksOfData / 4) * 50,    // 50% für genug Wochen
        100
    );

    return Math.round(confidence);
};
