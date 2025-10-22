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

// Berechne Wochendurchschnitt
export const calculateWeeklyAverage = (week, entries) => {
    const weekEntries = entries.filter(e => e.week === week);
    if (weekEntries.length === 0) return null;
    const sum = weekEntries.reduce((acc, e) => acc + e.value, 0);
    return sum / weekEntries.length;
};

// TDEE-Anpassung nach SBS-Methode
export const adjustTDEE = (weeklyAverages, calorieHistory, tdee, recommendations) => {
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