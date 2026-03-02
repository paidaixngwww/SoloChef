import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, User, Ruler, Weight, Calendar, Activity, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import {
  UserProfile,
  Gender,
  ActivityLevel,
  userProfileStorage,
  calcBMR,
  calcTDEE,
  calcCalorieThresholds,
  ACTIVITY_LABELS,
} from '../utils/userProfile';

const DEFAULT_PROFILE: UserProfile = {
  gender: 'female',
  weightKg: 55,
  heightCm: 160,
  age: 25,
  activityLevel: 'light',
};

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = userProfileStorage.get();
    if (existing) setProfile(existing);
  }, []);

  const bmr = calcBMR(profile);
  const tdee = calcTDEE(profile);
  const thresholds = calcCalorieThresholds(profile);

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    userProfileStorage.save(profile);
    setSaved(true);
    // 触发标签版本更新，下次回首页时重算
    localStorage.setItem('solochef_cal_threshold_version', `v_${Date.now()}`);
    setTimeout(() => navigate(-1), 600);
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#F9F7F2' }}>
      {/* Header */}
      <div className="px-6 py-6">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full transition-colors hover:bg-white/50 mb-4"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3D405B' }} />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl mb-1" style={{ color: '#3D405B' }}>个人情况</h1>
            <p className="text-sm" style={{ color: '#81B29A' }}>
              填写后将根据你的身体数据，个性化判断每道菜的热量等级
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 space-y-4">
        {/* 性别 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4" style={{ color: '#E07A5F' }} />
            <span className="text-sm font-medium" style={{ color: '#3D405B' }}>性别</span>
          </div>
          <div className="flex gap-3">
            {(['female', 'male'] as Gender[]).map(g => (
              <button
                key={g}
                onClick={() => update('gender', g)}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: profile.gender === g ? '#E07A5F' : '#F9F7F2',
                  color: profile.gender === g ? '#fff' : '#3D405B',
                }}
              >
                {g === 'female' ? '👩 女' : '👨 男'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 身高 / 体重 / 年龄 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-5"
        >
          {/* 身高 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4" style={{ color: '#81B29A' }} />
                <span className="text-sm font-medium" style={{ color: '#3D405B' }}>身高</span>
              </div>
              <span className="text-sm font-bold" style={{ color: '#E07A5F' }}>
                {profile.heightCm} cm
              </span>
            </div>
            <input
              type="range"
              min={140}
              max={200}
              step={1}
              value={profile.heightCm}
              onChange={e => update('heightCm', Number(e.target.value))}
              className="w-full accent-[#E07A5F]"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: '#81B29A' }}>
              <span>140 cm</span>
              <span>200 cm</span>
            </div>
          </div>

          {/* 体重 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4" style={{ color: '#F4A261' }} />
                <span className="text-sm font-medium" style={{ color: '#3D405B' }}>体重</span>
              </div>
              <span className="text-sm font-bold" style={{ color: '#E07A5F' }}>
                {profile.weightKg} kg（{Math.round(profile.weightKg * 2)} 斤）
              </span>
            </div>
            <input
              type="range"
              min={35}
              max={120}
              step={0.5}
              value={profile.weightKg}
              onChange={e => update('weightKg', Number(e.target.value))}
              className="w-full accent-[#F4A261]"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: '#81B29A' }}>
              <span>35 kg</span>
              <span>120 kg</span>
            </div>
          </div>

          {/* 年龄 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: '#3D405B' }} />
                <span className="text-sm font-medium" style={{ color: '#3D405B' }}>年龄</span>
              </div>
              <span className="text-sm font-bold" style={{ color: '#E07A5F' }}>
                {profile.age} 岁
              </span>
            </div>
            <input
              type="range"
              min={16}
              max={80}
              step={1}
              value={profile.age}
              onChange={e => update('age', Number(e.target.value))}
              className="w-full accent-[#3D405B]"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: '#81B29A' }}>
              <span>16 岁</span>
              <span>80 岁</span>
            </div>
          </div>
        </motion.div>

        {/* 活动量 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4" style={{ color: '#81B29A' }} />
            <span className="text-sm font-medium" style={{ color: '#3D405B' }}>日常活动量</span>
          </div>
          <div className="space-y-2">
            {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([level, label]) => (
              <button
                key={level}
                onClick={() => update('activityLevel', level)}
                className="w-full py-3 px-4 rounded-xl text-sm text-left transition-all"
                style={{
                  backgroundColor: profile.activityLevel === level ? '#81B29A18' : '#F9F7F2',
                  color: '#3D405B',
                  border: profile.activityLevel === level ? '2px solid #81B29A' : '2px solid transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 计算结果预览 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4" style={{ color: '#F4A261' }} />
            <span className="text-sm font-medium" style={{ color: '#3D405B' }}>你的专属标准</span>
          </div>

          {/* TDEE/BMR */}
          <div className="flex gap-3 mb-4">
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: '#E07A5F10' }}
            >
              <div className="text-xs mb-1" style={{ color: '#81B29A' }}>基础代谢 BMR</div>
              <div className="text-lg font-bold" style={{ color: '#E07A5F' }}>
                {bmr}
                <span className="text-xs font-normal ml-1">kcal</span>
              </div>
            </div>
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: '#81B29A10' }}
            >
              <div className="text-xs mb-1" style={{ color: '#81B29A' }}>每日消耗 TDEE</div>
              <div className="text-lg font-bold" style={{ color: '#81B29A' }}>
                {tdee}
                <span className="text-xs font-normal ml-1">kcal</span>
              </div>
            </div>
          </div>

          {/* 热量等级标准 */}
          <div className="text-sm mb-3" style={{ color: '#3D405B' }}>
            对你来说，一餐的热量等级：
          </div>
          <div className="space-y-2">
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: '#81B29A15' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#81B29A' }} />
                <span className="text-sm" style={{ color: '#3D405B' }}>低卡（减脂友好）</span>
              </div>
              <span className="text-sm font-medium" style={{ color: '#81B29A' }}>
                &lt; {thresholds.low} kcal
              </span>
            </div>
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: '#F4A26115' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F4A261' }} />
                <span className="text-sm" style={{ color: '#3D405B' }}>正常一餐</span>
              </div>
              <span className="text-sm font-medium" style={{ color: '#F4A261' }}>
                {thresholds.low} ~ {thresholds.high} kcal
              </span>
            </div>
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: '#E07A5F15' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E07A5F' }} />
                <span className="text-sm" style={{ color: '#3D405B' }}>高热量</span>
              </div>
              <span className="text-sm font-medium" style={{ color: '#E07A5F' }}>
                &gt; {thresholds.high} kcal
              </span>
            </div>
          </div>
        </motion.div>

        {/* 保存按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="pt-2"
        >
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl text-white font-medium text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: saved ? '#81B29A' : '#E07A5F' }}
          >
            {saved ? '✓ 已保存' : '保存并应用'}
          </button>
          <p className="text-xs text-center mt-3" style={{ color: '#81B29A' }}>
            保存后，所有菜谱的热量标签将根据你的身体数据重新生成
          </p>
        </motion.div>
      </div>
    </div>
  );
}
