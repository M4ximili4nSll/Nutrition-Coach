
weight = 80


def calorie_calculation_gain(slope, current_target):
    """calculating the new calorie target based on 14-day slope"""
    if slope > weight * 0.006 and slope < weight * 0.01:
        current_target -= 50
    elif slope > weight * 0.01:
        current_target -= 150
    elif slope == 0 and slope < weight * 0.004:
        current_target += 100
    elif slope < 0:
        current_target += 150
    else:
        return current_target
    return current_target


def macro_calculation(calorie_target):
    """calculating the macros based on the current calories with:
    1 g Potein = 4 kcal
    1 g Carbohytdrate = 4 kcal
    1 g Fat = 9 kcal"""
    protein = weight * 2
    fat = weight * 0.8
    carbohydrates = (calorie_target - protein * 4 - fat * 9)/4
    macros = {"Protein": int(protein), "Kohlenhydrate": int(
        carbohydrates), "Fett": int(fat)}
    return macros


# Test cases
print(macro_calculation(3000))
