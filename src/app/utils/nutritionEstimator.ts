import { Ingredient } from '../types/recipe';
import { getCalorieThresholds } from './userProfile';

/* ---------- 营养素估算器（基于食材拆分蛋白质/脂肪/碳水/膳食纤维） ---------- */

export interface NutritionData {
  calories: number;
  protein: number;   // 蛋白质 (g)
  fat: number;       // 脂肪 (g)
  carbs: number;     // 碳水化合物 (g)
  fiber: number;     // 膳食纤维 (g)
}

/** 每100g食材的营养素 [蛋白质g, 脂肪g, 碳水g, 膳食纤维g] */
type NutritionPer100g = [number, number, number, number];

const NUTRITION_MAP: Record<string, NutritionPer100g> = {
  // 主食 [蛋白质, 脂肪, 碳水, 膳食纤维]（每100g 熟食）
  米饭: [2.6, 0.3, 25.6, 0.3], 大米: [2.6, 0.3, 25.6, 0.3], 白米: [2.6, 0.3, 25.6, 0.3],
  白米饭: [2.6, 0.3, 25.6, 0.3], 糙米: [2.8, 0.8, 25.0, 1.6], 糙米饭: [2.8, 0.8, 25.0, 1.6],
  杂粮饭: [3.0, 0.8, 28.0, 2.0], 杂粮: [3.0, 0.8, 28.0, 2.0],
  面条: [4.0, 0.5, 23.0, 0.8], 面: [4.0, 0.5, 23.0, 0.8], 挂面: [4.0, 0.5, 23.0, 0.8],
  意面: [5.0, 0.9, 25.0, 1.8], 乌冬面: [3.5, 0.4, 22.0, 0.6], 荞麦面: [4.5, 0.8, 22.0, 2.0],
  馒头: [7.0, 1.1, 47.0, 1.3], 红薯: [1.0, 0.2, 20.1, 1.6], 紫薯: [0.8, 0.2, 18.5, 1.8],
  土豆: [2.0, 0.2, 17.2, 0.7], 玉米: [4.0, 1.2, 22.8, 2.9], 年糕: [3.3, 0.6, 34.7, 0.8],
  吐司: [8.0, 3.5, 49.0, 2.3], 面包: [8.0, 3.5, 49.0, 2.3],
  燕麦: [13.5, 6.7, 61.6, 10.6], 藜麦: [4.4, 1.9, 21.3, 2.8],

  // 蔬菜 [蛋白质, 脂肪, 碳水, 膳食纤维]
  番茄: [0.9, 0.2, 3.5, 1.2], 西红柿: [0.9, 0.2, 3.5, 1.2],
  西芹: [0.7, 0.1, 2.2, 1.5], 芹菜: [0.7, 0.1, 2.2, 1.5],
  胡萝卜: [0.9, 0.2, 8.1, 2.8], 小白菜: [1.5, 0.3, 2.0, 1.1],
  青菜: [1.5, 0.3, 2.0, 1.1], 西兰花: [4.1, 0.6, 4.3, 3.3],
  黄瓜: [0.7, 0.1, 2.9, 0.5], 青瓜: [0.7, 0.1, 2.9, 0.5],
  菠菜: [2.6, 0.3, 3.6, 1.7], 生菜: [1.3, 0.3, 1.6, 0.7],
  豆芽: [2.1, 0.1, 3.2, 1.0], 洋葱: [1.1, 0.1, 8.0, 1.7],
  南瓜: [0.7, 0.1, 5.3, 0.8], 茄子: [1.1, 0.1, 3.6, 1.3],
  冬瓜: [0.4, 0.2, 2.6, 0.7], 山药: [1.9, 0.2, 12.4, 0.8],
  莲藕: [1.9, 0.2, 16.4, 1.2], 白萝卜: [0.6, 0.1, 3.4, 1.0], 萝卜: [0.6, 0.1, 3.4, 1.0],
  丝瓜: [1.0, 0.2, 4.2, 0.6], 苦瓜: [1.0, 0.1, 3.5, 1.4],
  甜椒: [1.3, 0.3, 4.2, 1.9], 青椒: [1.3, 0.3, 4.2, 1.9],
  秋葵: [2.0, 0.1, 5.3, 3.2], 芦笋: [2.2, 0.1, 3.9, 1.8],
  娃娃菜: [1.0, 0.2, 1.8, 0.8], 白菜: [1.1, 0.2, 2.2, 0.8],
  大白菜: [1.1, 0.2, 2.2, 0.8], 紫甘蓝: [1.4, 0.1, 4.6, 2.1], 卷心菜: [1.3, 0.2, 4.6, 1.0],

  // 菌菇
  香菇: [2.2, 0.3, 5.2, 3.3], 金针菇: [2.4, 0.3, 6.0, 2.7],
  平菇: [1.9, 0.3, 4.6, 2.3], 木耳: [1.5, 0.2, 6.0, 2.6], 银耳: [1.4, 0.2, 5.4, 3.1],
  口蘑: [3.8, 0.2, 2.1, 1.0], 杏鲍菇: [1.3, 0.1, 6.1, 1.4],
  蘑菇: [2.7, 0.2, 3.0, 1.1], 茶树菇: [2.3, 0.5, 7.8, 3.5],

  // 豆制品
  豆腐: [8.1, 3.7, 4.2, 0.4], 嫩豆腐: [5.0, 2.7, 2.5, 0.1],
  老豆腐: [8.1, 3.7, 4.2, 0.4], 豆腐干: [16.2, 5.3, 7.7, 0.8],
  豆腐皮: [21.5, 12.0, 8.0, 0.3], 腐竹: [44.6, 21.7, 22.3, 1.0],

  // 肉类
  猪肉: [13.2, 37.0, 0, 0], 猪肉末: [17.0, 20.0, 0, 0],
  排骨: [16.7, 21.4, 0.7, 0], 猪排骨: [16.7, 21.4, 0.7, 0],
  小排: [16.7, 21.4, 0.7, 0], 肋排: [16.7, 21.4, 0.7, 0],
  牛肉: [20.2, 4.2, 0.2, 0], 牛腩: [17.1, 29.3, 0, 0],
  鸡肉: [19.3, 9.4, 0, 0], 鸡胸肉: [24.6, 2.0, 1.3, 0],
  鸡腿: [16.0, 11.5, 0, 0], 鸡翅: [17.4, 11.8, 0.2, 0],
  羊肉: [19.0, 14.1, 0, 0], 鸭肉: [15.5, 19.7, 0, 0],
  虾: [18.6, 0.8, 0.8, 0], 虾仁: [18.6, 0.8, 0.8, 0], 大虾: [18.6, 0.8, 0.8, 0],
  鱼: [17.7, 2.8, 0, 0], 三文鱼: [19.8, 7.8, 0, 0],
  鲈鱼: [18.6, 3.1, 0, 0], 带鱼: [17.7, 4.9, 0, 0],
  培根: [8.9, 52.6, 0.7, 0], 火腿: [16.0, 28.0, 2.0, 0],
  香肠: [14.0, 48.0, 3.0, 0], 午餐肉: [13.0, 16.0, 6.0, 0],

  // 蛋奶
  鸡蛋: [12.8, 9.0, 1.5, 0], 牛奶: [3.0, 3.2, 3.4, 0],
  酸奶: [3.1, 2.7, 9.3, 0], 奶酪: [25.7, 20.5, 3.5, 0],

  // 调味料（每10g/ml）
  食用油: [0, 10.0, 0, 0], 油: [0, 10.0, 0, 0], 中性油: [0, 10.0, 0, 0],
  橄榄油: [0, 10.0, 0, 0], 芝麻油: [0, 10.0, 0, 0], 香油: [0, 10.0, 0, 0],
  黄油: [0.1, 9.7, 0, 0], 花生油: [0, 10.0, 0, 0], 菜籽油: [0, 10.0, 0, 0],
  生抽: [0.5, 0, 0.8, 0], 老抽: [0.6, 0, 0.9, 0],
  蚝油: [0.3, 0, 1.5, 0], 料酒: [0.2, 0, 1.5, 0],
  醋: [0, 0, 0.5, 0], 酱油: [0.5, 0, 0.8, 0],
  盐: [0, 0, 0, 0], 糖: [0, 0, 10.0, 0], 白糖: [0, 0, 10.0, 0], 冰糖: [0, 0, 10.0, 0],
  淀粉: [0.03, 0, 8.6, 0], 面粉: [0.5, 0.1, 7.5, 0.2], 玉米淀粉: [0.03, 0, 8.6, 0],
  豆瓣酱: [0.8, 0.5, 1.2, 0.3], 番茄酱: [0.2, 0, 2.0, 0.2],
  姜: [0.1, 0, 0.7, 0.1], 姜丝: [0.1, 0, 0.7, 0.1],
  蒜: [0.3, 0, 1.5, 0.1], 蒜末: [0.3, 0, 1.5, 0.1], 大蒜: [0.3, 0, 1.5, 0.1],
  葱: [0.2, 0, 0.5, 0.1], 葱花: [0.2, 0, 0.5, 0.1], 小葱: [0.2, 0, 0.5, 0.1],
};

/** 根据食材名匹配营养数据（优先长关键词匹配） */
function matchNutrition(name: string): NutritionPer100g | null {
  let best: NutritionPer100g | null = null;
  let bestLen = 0;
  for (const [key, val] of Object.entries(NUTRITION_MAP)) {
    if (name.includes(key) && key.length > bestLen) {
      best = val;
      bestLen = key.length;
    }
  }
  return best;
}

/**
 * 估算菜谱的营养素分布
 * 返回蛋白质/脂肪/碳水/膳食纤维的克数
 */
export function estimateNutrition(ingredients: Ingredient[], recipeName?: string): NutritionData {
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  let fiber = 0;

  for (const ing of ingredients) {
    const amt = parseFloat(ing.amount) || 0;
    if (amt <= 0) continue;

    const matched = matchNutrition(ing.name);
    const isPantry = ing.category === 'pantry';
    const unit = ing.unit.toLowerCase();

    // 默认营养素（未匹配时）
    const defaultNutrition: NutritionPer100g = isPantry
      ? [0.1, 0.5, 1.0, 0]    // 调味料默认
      : [2.0, 0.5, 5.0, 1.0]; // 生鲜默认
    const nutr = matched || defaultNutrition;

    let factor: number;
    if (unit === '个' || unit === '只' || unit === '颗') {
      // 鸡蛋约 50g/个，其他约 100g/个
      const perWeight = ing.name.includes('蛋') ? 50 : 100;
      factor = (amt * perWeight) / 100;
    } else if (unit === '片' || unit === '瓣' || unit === '根' || unit === '朵' || unit === '棵') {
      factor = (amt * 10) / 100; // 约 10g/片
    } else if (unit === '盒') {
      factor = (amt * 300) / 100;
    } else if (unit === 'ml' || unit === '毫升') {
      // 调味料按每10ml营养数据
      factor = amt / 10;
    } else {
      // g 或无单位
      if (isPantry) {
        factor = amt / 10; // 调味料数据是每10g
      } else {
        factor = amt / 100; // 生鲜数据是每100g
      }
    }

    protein += nutr[0] * factor;
    fat += nutr[1] * factor;
    carbs += nutr[2] * factor;
    fiber += nutr[3] * factor;
  }

  // 热量 = 蛋白质×4 + 脂肪×9 + 碳水×4 + 膳食纤维×2
  const calories = Math.round(protein * 4 + fat * 9 + carbs * 4 + fiber * 2);

  return {
    calories,
    protein: Math.round(protein * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
  };
}

/* ---------- 每种食材的营养贡献明细 ---------- */

interface IngredientContribution {
  name: string;
  amount: string;
  unit: string;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

function getIngredientContributions(ingredients: Ingredient[]): IngredientContribution[] {
  const result: IngredientContribution[] = [];

  for (const ing of ingredients) {
    const amt = parseFloat(ing.amount) || 0;
    if (amt <= 0) continue;

    const matched = matchNutrition(ing.name);
    const isPantry = ing.category === 'pantry';
    const unit = ing.unit.toLowerCase();
    const defaultNutrition: NutritionPer100g = isPantry
      ? [0.1, 0.5, 1.0, 0]
      : [2.0, 0.5, 5.0, 1.0];
    const nutr = matched || defaultNutrition;

    let factor: number;
    if (unit === '个' || unit === '只' || unit === '颗') {
      const perWeight = ing.name.includes('蛋') ? 50 : 100;
      factor = (amt * perWeight) / 100;
    } else if (unit === '片' || unit === '瓣' || unit === '根' || unit === '朵' || unit === '棵') {
      factor = (amt * 10) / 100;
    } else if (unit === '盒') {
      factor = (amt * 300) / 100;
    } else if (unit === 'ml' || unit === '毫升') {
      factor = amt / 10;
    } else {
      factor = isPantry ? amt / 10 : amt / 100;
    }

    const p = nutr[0] * factor;
    const f = nutr[1] * factor;
    const c = nutr[2] * factor;

    result.push({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      protein: Math.round(p * 10) / 10,
      fat: Math.round(f * 10) / 10,
      carbs: Math.round(c * 10) / 10,
      calories: Math.round(p * 4 + f * 9 + c * 4),
    });
  }

  return result;
}

/* ---------- 营养特点与建议生成器 ---------- */

export interface NutritionTip {
  icon: string;   // emoji
  title: string;
  content: string;
}

/**
 * 根据菜谱食材和营养数据，生成个性化的营养特点与建议
 */
export function generateNutritionTips(
  ingredients: Ingredient[],
  nutrition: NutritionData,
  recipeName: string,
  displayCalories?: number,
): NutritionTip[] {
  const tips: NutritionTip[] = [];
  const contributions = getIngredientContributions(ingredients);
  const totalCal = displayCalories ?? nutrition.calories;
  const { protein, fat, carbs } = nutrition;

  // 计算三大营养素热量占比
  const totalMacroCal = protein * 4 + fat * 9 + carbs * 4;
  const fatPct = totalMacroCal > 0 ? (fat * 9) / totalMacroCal : 0;
  const carbPct = totalMacroCal > 0 ? (carbs * 4) / totalMacroCal : 0;
  const proteinPct = totalMacroCal > 0 ? (protein * 4) / totalMacroCal : 0;

  // 找到脂肪/蛋白质/碳水贡献最大的食材
  const sortedByFat = [...contributions].sort((a, b) => b.fat - a.fat);
  const sortedByProtein = [...contributions].sort((a, b) => b.protein - a.protein);
  const sortedByCarbs = [...contributions].sort((a, b) => b.carbs - a.carbs);
  const sortedByCal = [...contributions].sort((a, b) => b.calories - a.calories);

  // 高脂肪食材（取前2个占比大的）
  const topFatSources = sortedByFat.filter(c => c.fat > 1).slice(0, 2);
  const topFatNames = topFatSources.map(c => c.name).join('和');
  const topFatTotal = topFatSources.reduce((s, c) => s + c.fat, 0);
  const topFatRatio = fat > 0 ? Math.round((topFatTotal / fat) * 100) : 0;

  // 1. 热量/脂肪特点
  // 判断标准：同时考虑脂肪占比 + 脂肪绝对值 + 总热量
  // 低卡菜品即使脂肪占比高，绝对值也不大，不应标"高脂肪"
  const { low: lowCalThreshold, high: highCalThreshold } = getCalorieThresholds();
  const isLowCal = totalCal < lowCalThreshold;

  if (!isLowCal && fatPct > 0.45 && fat > 20) {
    tips.push({
      icon: '🔥',
      title: '高脂肪',
      content: `这道菜的热量和脂肪主要来自${topFatNames}，两者合计贡献了约 ${topFatRatio}% 的脂肪，属于高脂肪菜品。`,
    });
  } else if (!isLowCal && fatPct > 0.3 && fat > 15) {
    tips.push({
      icon: '⚖️',
      title: '脂肪适中',
      content: `脂肪占比约 ${Math.round(fatPct * 100)}%（${fat}g），主要来自${topFatNames}，脂肪含量适中。`,
    });
  } else if (isLowCal && fat <= 15) {
    // 低卡且脂肪绝对值低 → 强调低脂优势
    const fatSource = topFatSources.length > 0 ? `，主要来自${topFatNames}` : '';
    tips.push({
      icon: '🥗',
      title: '清淡低脂',
      content: `脂肪仅 ${fat}g${fatSource}，搭配低热量（${totalCal} kcal），是一道清淡健康的菜品。`,
    });
  } else {
    tips.push({
      icon: '🥗',
      title: '低脂肪',
      content: `脂肪仅 ${fat}g，占比约 ${Math.round(fatPct * 100)}%，是一道低脂健康菜品。`,
    });
  }

  // 2. 蛋白质来源
  const topProteinSources = sortedByProtein.filter(c => c.protein > 0.5).slice(0, 2);
  if (topProteinSources.length > 0) {
    const proteinNames = topProteinSources.map(c => c.name).join('和');
    if (protein >= 20) {
      tips.push({
        icon: '💪',
        title: '高蛋白',
        content: `蛋白质含量丰富（${protein}g），主要来自${proteinNames}，能提供良好的饱腹感，适合增肌期食用。`,
      });
    } else if (protein >= 10) {
      tips.push({
        icon: '💪',
        title: '蛋白质来源',
        content: `蛋白质（${protein}g）主要来自${proteinNames}，能提供一定的饱腹感。`,
      });
    } else {
      tips.push({
        icon: '🌿',
        title: '蛋白质偏低',
        content: `蛋白质仅 ${protein}g，主要来自${proteinNames}。建议搭配鸡蛋、豆腐或鸡胸肉等高蛋白食物，使营养更均衡。`,
      });
    }
  }

  // 3. 碳水特点（如果碳水占比显著）
  if (carbPct > 0.45) {
    const topCarbSources = sortedByCarbs.filter(c => c.carbs > 2).slice(0, 2);
    const carbNames = topCarbSources.map(c => c.name).join('和');
    tips.push({
      icon: '🌾',
      title: '碳水较高',
      content: `碳水化合物占比约 ${Math.round(carbPct * 100)}%，主要来自${carbNames}，运动前后食用效果较好。`,
    });
  }

  // 4. 减脂优化建议 / 低卡优选
  if (isLowCal) {
    tips.push({
      icon: '✅',
      title: '低卡优选',
      content: `总热量仅 ${totalCal} kcal，非常适合作为减脂期的正餐选择。`,
    });
  } else {
    // 非低卡菜品都给出减脂优化建议（包括适中和高热量）
    const highCalItems = sortedByCal.filter(c => c.calories > 50).slice(0, 2);
    if (highCalItems.length > 0) {
      let optimizedCal = totalCal;
      let optimizedFat = fat;
      const suggestions: string[] = [];

      for (const item of highCalItems) {
        const halfAmt = Math.round(parseFloat(item.amount) / 2);
        if (halfAmt > 0) {
          suggestions.push(`${item.name}减至 ${halfAmt}${item.unit}`);
          optimizedCal -= Math.round(item.calories / 2);
          optimizedFat -= Math.round(item.fat / 2 * 10) / 10;
        }
      }

      // 油类也建议减量
      const oilItem = contributions.find(c =>
        c.name.includes('油') && !highCalItems.some(h => h.name === c.name)
      );
      if (oilItem && parseFloat(oilItem.amount) > 5) {
        suggestions.push(`${oilItem.name}减至 5${oilItem.unit}`);
        const oilReduction = (parseFloat(oilItem.amount) - 5) / parseFloat(oilItem.amount);
        optimizedCal -= Math.round(oilItem.calories * oilReduction);
        optimizedFat -= Math.round(oilItem.fat * oilReduction * 10) / 10;
      }

      if (suggestions.length > 0 && optimizedCal < totalCal * 0.8) {
        tips.push({
          icon: '🎯',
          title: '减脂优化',
          content: `如果在减脂期，建议将${suggestions.join('，')}，可使总热量降至约 ${Math.max(optimizedCal, 100)} kcal${optimizedFat > 0 ? `，脂肪降至约 ${Math.max(Math.round(optimizedFat), 1)}g` : ''}，更适合作为减脂餐。`,
        });
      }
    }
  }

  return tips;
}
