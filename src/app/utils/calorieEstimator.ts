import { Ingredient } from '../types/recipe';

/* ---------- 本地卡路里估算（不依赖 AI） ---------- */

/** 食材基础热量表（每100g 或特殊注明） */
const CALORIE_MAP: Record<string, number> = {
  // 主食（每100g）
  米饭: 116, 杂粮饭: 130, 面条: 110, 馒头: 223, 红薯: 86, 土豆: 77, 玉米: 112,
  // 蔬菜（每100g）
  番茄: 19, 西红柿: 19, 西芹: 14, 芹菜: 14, 百合: 166, 胡萝卜: 37, 小白菜: 15,
  青菜: 15, 西兰花: 34, 黄瓜: 15, 青瓜: 15, 菠菜: 23, 生菜: 13, 豆芽: 18,
  小番茄: 22, 洋葱: 39, 南瓜: 22, 茄子: 21, 冬瓜: 11,
  山药: 56, 莲藕: 73, 白萝卜: 16, 萝卜: 16, 丝瓜: 20, 苦瓜: 19,
  甜椒: 22, 青椒: 22, 辣椒: 32, 秋葵: 25, 芦笋: 22,
  // 菌菇
  香菇: 26, 金针菇: 32, 平菇: 20, 木耳: 27, 银耳: 200,
  // 豆制品（每100g）
  豆腐: 81, 嫩豆腐: 60, 老豆腐: 81, 豆腐干: 140, 豆腐皮: 200, 腐竹: 459,
  // 肉类（每100g）
  猪肉: 395, 猪肉末: 250, 排骨: 264, 猪排骨: 264, 小排: 264, 肋排: 264,
  牛肉: 125, 牛腩: 332, 鸡肉: 167, 鸡胸肉: 133, 鸡腿: 181, 鸡翅: 194,
  羊肉: 203, 鸭肉: 240,
  虾: 87, 虾仁: 87, 大虾: 87, 鱼: 104, 三文鱼: 139, 鲈鱼: 105, 带鱼: 127,
  培根: 533, 火腿: 330, 香肠: 508, 午餐肉: 226,
  // 蛋奶（每个/每100ml）
  鸡蛋: 72, 牛奶: 54, 酸奶: 72, 奶酪: 328,
  // 调味料（每10ml/g）
  食用油: 90, 油: 90, 中性油: 90, 橄榄油: 90, 芝麻油: 90, 香油: 90,
  黄油: 88, 花生油: 90, 菜籽油: 90,
  生抽: 5, 老抽: 6, 蚝油: 9, 料酒: 9, 醋: 3, 酱油: 5,
  盐: 0, 糖: 39, 白糖: 39, 冰糖: 39, 淀粉: 35, 面粉: 35, 玉米淀粉: 35,
  豆瓣酱: 18, 番茄酱: 10, 花椒粉: 26, 胡椒粉: 25, 黑胡椒粉: 25,
  辣椒粉: 31, 姜: 4, 姜丝: 4, 蒜: 8, 蒜末: 8, 蒜片: 8, 大蒜: 8,
  葱: 3, 葱花: 3, 葱姜蒜: 5, 小葱: 3, 青葱: 3,
  八角: 10, 桂皮: 10, 花椒: 10, 干辣椒: 10,
};

/**
 * 根据菜名判断烹饪方式，返回热量修正系数
 * 油炸：食材会吸收大量油脂，热量大幅增加
 * 煲汤/炖：汤类实际摄入的脂肪和肉量较少，热量适当降低
 * 蒸/煮/凉拌：几乎不增加额外热量
 * 炒：少量用油，略微增加
 */
function getCookingMultiplier(recipeName: string): number {
  const name = recipeName.toLowerCase();
  // 油炸类：热量增加约 60-80%（吸油导致）
  if (/炸|酥|油炸|香酥|干炸|软炸|椒盐/.test(name)) return 1.7;
  // 煎/煎炸类：热量增加约 30%
  if (/煎|锅贴|铁板/.test(name)) return 1.3;
  // 红烧/焖/卤：用油+糖，热量增加约 20%
  if (/红烧|焖|卤|糖醋|干锅|烤/.test(name)) return 1.2;
  // 汤/炖/煲：肉类脂肪部分溶于汤中但不全摄入，适当降低
  if (/汤|炖|煲|羹|粥/.test(name)) return 0.75;
  // 蒸/煮/白灼/凉拌/沙拉：基本不增加热量
  if (/蒸|煮|白灼|凉拌|沙拉|拌/.test(name)) return 1.0;
  // 炒菜：少量用油
  if (/炒|爆/.test(name)) return 1.1;
  // 默认
  return 1.0;
}

export function estimateCalories(ingredients: Ingredient[], recipeName?: string): number {
  let total = 0;
  for (const ing of ingredients) {
    const amt = parseFloat(ing.amount) || 0;
    if (amt <= 0) continue;

    // 找匹配的食材热量（优先匹配更长的关键词）
    let calPer = 0;
    let matchLen = 0;
    for (const [key, val] of Object.entries(CALORIE_MAP)) {
      if (ing.name.includes(key) && key.length > matchLen) {
        calPer = val;
        matchLen = key.length;
      }
    }
    if (calPer === 0) {
      // 未知食材：生鲜按 50kcal/100g 估，调味料按 20kcal/10ml 估
      calPer = ing.category === 'fresh' ? 50 : 20;
    }

    const unit = ing.unit.toLowerCase();
    if (unit === '个' || unit === '只' || unit === '颗') {
      // 鸡蛋=72kcal/个，其他按 50kcal/个
      total += amt * (ing.name.includes('蛋') ? 72 : 50);
    } else if (unit === '片' || unit === '瓣' || unit === '根' || unit === '朵' || unit === '棵') {
      total += amt * 5;
    } else if (unit === '盒') {
      total += amt * (calPer / 100) * 300;
    } else if (unit === 'ml' || unit === '毫升') {
      total += (amt / 10) * calPer;
    } else {
      // g 或无单位，按每 100g 计算
      total += (amt / 100) * calPer;
    }
  }

  // 根据烹饪方式修正热量
  if (recipeName) {
    total *= getCookingMultiplier(recipeName);
  }

  return Math.round(total);
}

/**
 * 判断 AI 返回的卡路里是否可信
 * 整百数（如 500、300、400）很可能是 AI 随意给出的默认值
 */
export function isCalorieTrustworthy(cal: number): boolean {
  if (cal % 100 === 0) return false;
  if (cal < 20 || cal > 3000) return false;
  return true;
}
