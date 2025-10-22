import {
    calculateInitialTDEE,
    calculateMacros,
    calculateCalorieTarget,
    calculateWeeklyAverage,
    adjustTDEE,
    validateGoalWeight
} from './calculations';

describe('calculateInitialTDEE', () => {
    test('berechnet TDEE korrekt für männlich', () => {
        const data = {
            gender: 'male',
            currentWeight: 90,
            activityLevel: 1.5
        };
        // LBM: 90 * 0.85 = 76.5
        // BMR: 500 + (22 * 76.5) = 2183
        // TDEE: 2183 * 1.5 = 3274.5 → 3275
        expect(calculateInitialTDEE(data)).toBe(3275);
    });

    test('berechnet TDEE korrekt für weiblich', () => {
        const data = {
            gender: 'female',
            currentWeight: 70,
            activityLevel: 1.375
        };
        // LBM: 70 * 0.75 = 52.5
        // BMR: 500 + (22 * 52.5) = 1655
        // TDEE: 1655 * 1.375 = 2275.625 → 2276
        expect(calculateInitialTDEE(data)).toBe(2276);
    });

    test('unterschiedliche Aktivitätslevel', () => {
        const sedentary = {
            gender: 'male',
            currentWeight: 80,
            activityLevel: 1.2
        };
        const veryActive = {
            ...sedentary,
            activityLevel: 1.9
        };

        expect(calculateInitialTDEE(veryActive)).toBeGreaterThan(calculateInitialTDEE(sedentary));
    });
});

describe('calculateMacros', () => {
    test('Protein höher beim Abnehmen (2.2g/kg)', () => {
        const macros = calculateMacros(2000, 90, 180, 'lose');
        expect(macros.protein).toBe(198); // 90 * 2.2
    });

    test('Protein niedriger beim Zunehmen (1.8g/kg)', () => {
        const macros = calculateMacros(3000, 90, 180, 'gain');
        expect(macros.protein).toBe(162); // 90 * 1.8
    });

    test('Minimum Fett basiert auf Körpergröße', () => {
        const macros = calculateMacros(1500, 70, 180, 'lose');
        // (180 - 150) * 0.5 + 30 = 45
        expect(macros.minFat).toBe(45);
    });

    test('Minimum Fett für kleine Personen (<150cm)', () => {
        const macros = calculateMacros(1500, 60, 145, 'lose');
        expect(macros.minFat).toBe(30);
    });

    test('Kohlenhydrate füllen Rest der Kalorien', () => {
        const macros = calculateMacros(2000, 80, 180, 'maintain');
        const totalCals = (macros.protein * 4) + (macros.fat * 9) + (macros.carbs * 4);
        expect(totalCals).toBeCloseTo(2000, -1); // Toleranz wegen Rundung
    });

    test('Kohlenhydrate nie negativ', () => {
        const macros = calculateMacros(1200, 100, 180, 'lose');
        expect(macros.carbs).toBeGreaterThanOrEqual(0);
    });
});

describe('calculateCalorieTarget', () => {
    test('Defizit beim Abnehmen (0.5% pro Woche)', () => {
        const tdee = 2500;
        const target = calculateCalorieTarget(tdee, 'lose', 0.5, 90);
        // 0.5% von 90kg = 0.45kg/Woche
        // 0.45 * 7700 = 3465 kcal/Woche
        // 3465 / 7 = 495 kcal/Tag Defizit
        // 2500 - 495 = 2005
        expect(target).toBe(2005);
    });

    test('Surplus beim Zunehmen (0.25% pro Woche)', () => {
        const tdee = 2500;
        const target = calculateCalorieTarget(tdee, 'gain', 0.25, 80);
        // 0.25% von 80kg = 0.2kg/Woche
        // 0.2 * 7700 = 1540 kcal/Woche
        // 1540 / 7 = 220 kcal/Tag Surplus
        // 2500 + 220 = 2720
        expect(target).toBe(2720);
    });

    test('Kein Defizit beim Halten', () => {
        const tdee = 2300;
        const target = calculateCalorieTarget(tdee, 'maintain', 0, 75);
        expect(target).toBe(tdee);
    });

    test('Minimum 1200 kcal', () => {
        const tdee = 1400;
        const target = calculateCalorieTarget(tdee, 'lose', 1.0, 50);
        expect(target).toBeGreaterThanOrEqual(1200);
    });

    test('Maximum 5000 kcal', () => {
        const tdee = 4500;
        const target = calculateCalorieTarget(tdee, 'gain', 0.5, 120);
        expect(target).toBeLessThanOrEqual(5000);
    });
});

describe('calculateWeeklyAverage', () => {
    const entries = [
        { week: 1, value: 90.5 },
        { week: 1, value: 90.3 },
        { week: 1, value: 90.1 },
        { week: 2, value: 89.8 },
        { week: 2, value: 89.9 }
    ];

    test('berechnet Durchschnitt korrekt', () => {
        const avg = calculateWeeklyAverage(1, entries);
        expect(avg).toBeCloseTo((90.5 + 90.3 + 90.1) / 3, 2);
    });

    test('null wenn keine Einträge', () => {
        const avg = calculateWeeklyAverage(5, entries);
        expect(avg).toBeNull();
    });

    test('funktioniert mit einem Eintrag', () => {
        const singleEntry = [{ week: 3, value: 88.5 }];
        const avg = calculateWeeklyAverage(3, singleEntry);
        expect(avg).toBe(88.5);
    });
});

describe('adjustTDEE', () => {
    test('keine Anpassung bei weniger als 3 Wochen', () => {
        const weeklyAverages = [
            { week: 1, avgWeight: 90 },
            { week: 2, avgWeight: 89.5 }
        ];
        const calorieHistory = [];
        const tdee = 2500;
        const recommendations = { calories: 2000 };

        const result = adjustTDEE(weeklyAverages, calorieHistory, tdee, recommendations);
        expect(result).toBe(2500);
    });

    test('TDEE-Anpassung bei schnellerem Gewichtsverlust als erwartet', () => {
        const weeklyAverages = [
            { week: 1, avgWeight: 90.0 },
            { week: 2, avgWeight: 89.0 },
            { week: 3, avgWeight: 88.0 }
        ];
        const calorieHistory = [
            { week: 1, avgCalories: 2000 },
            { week: 2, avgCalories: 2000 },
            { week: 3, avgCalories: 2000 }
        ];
        const tdee = 2500;
        const recommendations = { calories: 2000 };

        // 2kg Verlust in 3 Wochen = deutlich mehr als erwartet
        // TDEE sollte nach oben korrigiert werden
        const result = adjustTDEE(weeklyAverages, calorieHistory, tdee, recommendations);
        expect(result).toBeGreaterThan(2500);
    });

    test('maximale Änderung pro Anpassung begrenzt auf 300 kcal', () => {
        const weeklyAverages = [
            { week: 1, avgWeight: 90.0 },
            { week: 2, avgWeight: 87.0 },
            { week: 3, avgWeight: 84.0 }
        ];
        const calorieHistory = [
            { week: 1, avgCalories: 1500 },
            { week: 2, avgCalories: 1500 },
            { week: 3, avgCalories: 1500 }
        ];
        const tdee = 2500;
        const recommendations = { calories: 1500 };

        const result = adjustTDEE(weeklyAverages, calorieHistory, tdee, recommendations);
        const change = Math.abs(result - tdee);
        expect(change).toBeLessThanOrEqual(300);
    });

    test('nutzt Zielkalorien wenn keine tatsächlichen Kalorien getrackt', () => {
        const weeklyAverages = [
            { week: 1, avgWeight: 90.0 },
            { week: 2, avgWeight: 89.5 },
            { week: 3, avgWeight: 89.0 }
        ];
        const calorieHistory = [
            { week: 1, avgCalories: null },
            { week: 2, avgCalories: null },
            { week: 3, avgCalories: null }
        ];
        const tdee = 2500;
        const recommendations = { calories: 2200 };

        const result = adjustTDEE(weeklyAverages, calorieHistory, tdee, recommendations);
        // Sollte Zielkalorien (2200) für Berechnung nutzen
        expect(result).toBeDefined();
    });
});

describe('validateGoalWeight', () => {
    test('ungültig: Abnehmen mit Zielgewicht >= aktuelles Gewicht', () => {
        const result = validateGoalWeight('lose', 80, 85);
        expect(result.valid).toBe(false);
        expect(result.message).toBeTruthy();
    });

    test('ungültig: Zunehmen mit Zielgewicht <= aktuelles Gewicht', () => {
        const result = validateGoalWeight('gain', 80, 75);
        expect(result.valid).toBe(false);
        expect(result.message).toBeTruthy();
    });

    test('gültig: Abnehmen mit niedrigerem Zielgewicht', () => {
        const result = validateGoalWeight('lose', 90, 80);
        expect(result.valid).toBe(true);
    });

    test('gültig: Zunehmen mit höherem Zielgewicht', () => {
        const result = validateGoalWeight('gain', 70, 75);
        expect(result.valid).toBe(true);
    });

    test('gültig: Gewicht halten (egal welches Ziel)', () => {
        const result = validateGoalWeight('maintain', 75, 75);
        expect(result.valid).toBe(true);
    });
});

describe('Edge Cases', () => {
    test('sehr niedriges Gewicht', () => {
        const tdee = calculateInitialTDEE({
            gender: 'female',
            currentWeight: 45,
            activityLevel: 1.2
        });
        expect(tdee).toBeGreaterThan(0);
    });

    test('sehr hohes Gewicht', () => {
        const tdee = calculateInitialTDEE({
            gender: 'male',
            currentWeight: 150,
            activityLevel: 1.5
        });
        expect(tdee).toBeGreaterThan(0);
    });

    test('sehr aggressive Diät (1% Verlust pro Woche)', () => {
        const target = calculateCalorieTarget(2500, 'lose', 1.0, 100);
        expect(target).toBeGreaterThanOrEqual(1200);
    });

    test('sehr kleine Person', () => {
        const macros = calculateMacros(1400, 50, 140, 'lose');
        expect(macros.minFat).toBe(30);
        expect(macros.protein).toBeGreaterThan(0);
        expect(macros.carbs).toBeGreaterThanOrEqual(0);
    });
});