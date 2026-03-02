/**
 * 用户个人档案 — 用于个性化热量判断
 *
 * BMR 公式（Mifflin-St Jeor）：
 *   女: 10×体重(kg) + 6.25×身高(cm) - 5×年龄 - 161
 *   男: 10×体重(kg) + 6.25×身高(cm) - 5×年龄 + 5
 *
 * TDEE = BMR + 日常额外消耗
 *
 * 热量等级（一餐）按 TDEE 的百分比切分：
 *   低卡: < TDEE × 0.24  （约一餐偏低）
 *   适中: TDEE × 0.24 ~ TDEE × 0.35
 *   高热量: > TDEE × 0.35
 */

export type Gender = 'female' | 'male';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

export interface UserProfile {
  gender: Gender;
  /** 体重，单位 kg */
  weightKg: number;
  /** 身高，单位 cm */
  heightCm: number;
  /** 年龄 */
  age: number;
  /** 日常活动等级 */
  activityLevel: ActivityLevel;
}

export interface CalorieThresholds {
  /** 低于此值 → 低卡 */
  low: number;
  /** 高于此值 → 高热量 */
  high: number;
  /** TDEE 参考值 */
  tdee: number;
  /** BMR 参考值 */
  bmr: number;
}

const STORAGE_KEY = 'solochef_user_profile';

/* ---------- 活动量对应的额外消耗 (kcal/天) ---------- */

const ACTIVITY_EXTRA: Record<ActivityLevel, number> = {
  sedentary: 100,   // 久坐不动（办公室）
  light: 200,       // 轻度活动（日常步行）
  moderate: 350,    // 中度活动（每周3-4次运动）
  active: 500,      // 高度活动（每天运动）
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: '久坐（办公室为主）',
  light: '轻度活动（日常步行）',
  moderate: '中度活动（每周 3-4 次运动）',
  active: '高度活动（每天运动）',
};

/* ---------- 存储 ---------- */

export const userProfileStorage = {
  get: (): UserProfile | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  save: (profile: UserProfile): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },
};

/* ---------- 计算 ---------- */

/** 基础代谢率 (Mifflin-St Jeor) */
export function calcBMR(profile: UserProfile): number {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return Math.round(profile.gender === 'female' ? base - 161 : base + 5);
}

/** 每日总消耗 */
export function calcTDEE(profile: UserProfile): number {
  return calcBMR(profile) + ACTIVITY_EXTRA[profile.activityLevel];
}

/** 根据用户档案计算个性化热量阈值 */
export function calcCalorieThresholds(profile: UserProfile): CalorieThresholds {
  const bmr = calcBMR(profile);
  const tdee = calcTDEE(profile);

  return {
    low: Math.round(tdee * 0.24),   // 低卡阈值（一餐占 TDEE 24% 以下）
    high: Math.round(tdee * 0.35),  // 高热量阈值（一餐占 TDEE 35% 以上）
    tdee,
    bmr,
  };
}

/** 默认阈值（未填写个人信息时的兜底） */
export const DEFAULT_THRESHOLDS: CalorieThresholds = {
  low: 350,
  high: 510,
  tdee: 1460,
  bmr: 1260,
};

/**
 * 获取当前热量阈值 — 有用户档案则个性化计算，否则用默认值
 */
export function getCalorieThresholds(): CalorieThresholds {
  const profile = userProfileStorage.get();
  if (profile) {
    return calcCalorieThresholds(profile);
  }
  return DEFAULT_THRESHOLDS;
}
