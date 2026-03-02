import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Link as LinkIcon, Camera, Type, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { recipeStorage } from '../utils/recipeStorage';
import { saveImage } from '../utils/imageStorage';
import { estimateCalories, isCalorieTrustworthy } from '../utils/calorieEstimator';
import { generateRecipeTags } from '../utils/recipeTagGenerator';
import { Ingredient, Recipe } from '../types/recipe';

type InputMode = 'link' | 'photo' | 'text';

const PANTRY_KEYWORDS = [
  '盐', '糖', '酱', '醋', '油', '料酒', '生抽', '老抽', '胡椒', '淀粉', '耗油', '蚝油', 'ketchup', 'salt', 'sugar', 'soy', 'oil'
];

const NAME_BLACKLIST = ['食材', '步骤', '做法', 'ingredients', 'instructions', 'method'];
const DISH_HINT = /(soup|chicken|beef|pork|egg|tofu|fish|salad|noodle|rice|炒|汤|鸡|肉|鱼|豆腐|面|饭)/i;
const AI_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
const AI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
const AI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

function guessCategory(name: string): 'fresh' | 'pantry' {
  const lower = name.toLowerCase();
  return PANTRY_KEYWORDS.some(keyword => lower.includes(keyword)) ? 'pantry' : 'fresh';
}

function parseAiJson(content: string): { recipeName?: string; calories?: number; ingredients?: Array<{ name: string; amount?: string; unit?: string; category?: 'fresh' | 'pantry' }> } | null {
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;

  try {
    return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
  } catch {
    return null;
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read_file_failed'));
    reader.readAsDataURL(file);
  });

  // 压缩大图以提高识别成功率（限制最大 2048px，质量 0.9）
  return await new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 2048;
      let { width, height } = img;
      if (width <= MAX && height <= MAX) {
        resolve(raw);
        return;
      }
      const scale = Math.min(MAX / width, MAX / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(raw);
    img.src = raw;
  });
}

function parseIngredientsFromText(text: string): Ingredient[] {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.replace(/[•·●□\[\]()]/g, ' ').trim())
    .filter(Boolean);

  const patternNameFirst = /^([\u4e00-\u9fa5a-zA-Z\s-]{1,40}?)\s+([0-9]+(?:\.[0-9]+)?|\d+\/\d+|适量|少许)?\s*(g|kg|ml|l|个|颗|盒|勺|汤匙|茶匙|瓣|片|cup|cups|tbsp|tsp|teaspoon|tablespoon)?$/i;
  const patternAmountFirst = /^([0-9]+(?:\.[0-9]+)?|\d+\/\d+)\s*(g|kg|ml|l|cup|cups|tbsp|tsp|teaspoon|teaspoons|tablespoon|tablespoons|个|颗|盒|瓣|片)?\s+([\u4e00-\u9fa5a-zA-Z\s-]{1,50})$/i;
  const parsed: Ingredient[] = [];

  for (const raw of lines) {
    if (parsed.length >= 25) break;
    const line = raw.replace(/\s+/g, ' ');
    if (!line || line.length > 90) continue;
    if (/步骤|做法|step|minute|min|°|serve|rating|servings/i.test(line)) continue;

    let name = '';
    let amount = '适量';
    let unit = '';

    const m1 = line.match(patternNameFirst);
    const m2 = line.match(patternAmountFirst);

    if (m1) {
      name = (m1[1] || '').trim();
      amount = (m1[2] || '适量').trim();
      unit = (m1[3] || '').trim();
    } else if (m2) {
      amount = (m2[1] || '适量').trim();
      unit = (m2[2] || '').trim();
      name = (m2[3] || '').trim();
    } else {
      continue;
    }

    if (!name || name.length < 2) continue;

    parsed.push({
      name,
      amount,
      unit,
      category: guessCategory(name),
      originalText: `${name} ${amount}${unit}`.trim(),
    });
  }

  const unique = new Map<string, Ingredient>();
  parsed.forEach(item => {
    const key = `${item.name}-${item.amount}-${item.unit}`;
    if (!unique.has(key)) unique.set(key, item);
  });

  return Array.from(unique.values());
}

function extractRecipeNameFromText(text: string, fallbackName: string): string {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 40);

  const scored = lines
    .map(line => {
      const lower = line.toLowerCase();
      if (line.length < 2 || line.length > 60) return { line, score: -999 };
      if (NAME_BLACKLIST.some(key => lower.includes(key))) return { line, score: -999 };
      if (/^[0-9\s.,:/+\-]+$/.test(line)) return { line, score: -999 };
      let score = 0;
      if (DISH_HINT.test(line)) score += 10;
      if (/^[A-Za-z\s'&-]+$/.test(line)) score += 3;
      if (/^[\u4e00-\u9fa5]{2,12}$/.test(line)) score += 5;
      score -= Math.floor(line.length / 25);
      return { line, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0] && scored[0].score > 0 ? scored[0].line : fallbackName;
}

async function recognizeWithVisionAI(file: File, fallbackName: string): Promise<{ name: string; ingredients: Ingredient[]; calories?: number } | null> {
  if (!AI_API_KEY) return null;

  const dataUrl = await fileToDataUrl(file);

  // 智谱 API 需要纯 base64 字符串（不带 data:image/...;base64, 前缀）
  const isZhipu = AI_BASE_URL.includes('bigmodel.cn');
  const imageUrl = isZhipu ? dataUrl.replace(/^data:image\/[^;]+;base64,/, '') : dataUrl;

  const promptText = `你是专业食谱提取助手，服务于"一人食"场景（1人份）。
请仔细观察图片中【所有区域】的文字，包括：大标题、食材列表、每一张小图上的步骤说明文字、角落标注等，不要遗漏任何一处文字。
完整提取菜名和每一种食材与调味料。所有内容必须使用简体中文输出。
category 分类规则：生鲜蔬菜肉蛋奶豆腐=fresh，油盐酱醋糖调味料香料=pantry。只输出 JSON，不要解释。
JSON 格式: {"recipeName":"中文菜名","calories":数字,"ingredients":[{"name":"中文食材名","amount":"数量","unit":"单位","category":"fresh|pantry"}]}

要求：
1）recipeName 必须是一个具体的菜品名称（如"红烧排骨""番茄鸡蛋汤"），如果图片标题不是具体菜品名而是泛称或分类，则根据食材自动生成一个简短具体的菜品名；
2）【最最重要-调味料完整提取】你必须逐一扫描图片中每一张小图、每一段步骤文字，提取其中提到的所有调味料！
  常见遗漏场景举例（你必须避免这些遗漏）：
  - 步骤图上写"少油煎" → 必须提取"食用油"
  - 步骤图上写"放一勺生抽" → 必须提取"生抽"
  - 步骤图上写"适量盐" → 必须提取"盐"
  - 步骤图上写"加蚝油" → 必须提取"蚝油"
  - 步骤图上写"撒胡椒粉" → 必须提取"胡椒粉"
  一道菜至少应包含油和盐这两种基础调味料。如果图片中确实没有写任何调味料，也要根据菜品类型自动补充油（15ml）和盐（3g）；
3）所有字段用简体中文输出（英文翻译成中文）；
4）【重要-食材名称规范化】
  - "大米""白米""米"统一写为"米饭"（因为我们计算的是煮熟后的热量）
  - "口蘑""蘑菇""白蘑菇"统一写为"口蘑"
  - amount 表示的是该食材在最终成品中的重量（熟食重量），而非生食重量；
5）【重要-用量智能推荐】amount 和 unit 必须是具体的数值和单位，不能写"适量""少许"。如果图片中没有标注具体克重，根据1人份合理烹饪用量自动推荐。参考：主食材100-200g，配菜50-100g，肉类100-150g，鸡蛋1-2个，调味料（盐2-3g、生抽5-10ml、料酒10ml、油15ml、蚝油5-10ml、醋5ml等）。unit 使用 g/ml/个 等常见单位；
6）【重要-卡路里精确计算】calories 为1人份总热量（kcal）。你必须按以下步骤逐一计算：
  对每种食材：热量 = 用量(g) / 100 × 每100g热量。对调味料：热量 = 用量(ml或g) / 10 × 每10ml热量。最后求和。
  热量参考（每100g熟食）：米饭116、杂粮饭130、面条110、猪肉395、牛肉125、鸡胸肉133、鸡肉167、鸡蛋72/个、虾仁87、豆腐81、番茄19、胡萝卜37、西兰花34、口蘑20、土豆77、山药56、排骨264、玉米112、白菜15、娃娃菜12、火腿330。
  调味料（每10ml/g）：油90、生抽5、蚝油9、盐0、糖39。
  示例：牛肉150g = 150/100×125 = 187.5；米饭100g = 100/100×116 = 116；食用油15ml = 15/10×90 = 135。
  禁止输出整百数（如500、300、400、800），必须是精确计算结果。`;

  // 构建请求体，智谱与 OpenAI 在部分参数上有差异
  const requestBody: Record<string, unknown> = {
    model: AI_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: promptText }
        ]
      }
    ]
  };

  // 非智谱 API 才加这些参数（智谱可能不支持）
  if (!isZhipu) {
    requestBody.temperature = 0.1;
    requestBody.max_tokens = 2048;
  }

  console.log('[AI识别] 发送请求到:', `${AI_BASE_URL}/chat/completions`, '模型:', AI_MODEL, '图片大小:', Math.round(imageUrl.length / 1024), 'KB');

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    console.error('[AI识别] 请求失败:', response.status, errBody);
    throw new Error(`vision_api_failed: ${response.status} ${errBody}`);
  }

  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return null;

  const parsed = parseAiJson(content);
  if (!parsed) return null;

  const name = (parsed.recipeName || '').trim() || fallbackName;
  const aiCalories = typeof parsed.calories === 'number' && parsed.calories > 0 ? Math.round(parsed.calories) : undefined;
  const ingredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients
        .filter(item => item?.name)
        .map(item => {
          const cleanName = String(item.name).trim();
          let cleanAmount = String(item.amount || '适量').trim();
          let cleanUnit = String(item.unit || '').trim();

          // 修复 AI 返回 amount/unit 重复问题（如 amount="1颗" unit="颗" → "1颗颗"）
          if (cleanUnit && cleanAmount.endsWith(cleanUnit)) {
            cleanAmount = cleanAmount.slice(0, -cleanUnit.length).trim() || cleanAmount;
          }
          // 修复 amount 内嵌单位但 unit 为空的情况（如 amount="1颗" unit=""）
          if (!cleanUnit) {
            const m = cleanAmount.match(/^([0-9]+(?:\.[0-9]+)?)\s*(g|kg|ml|l|个|颗|只|根|片|瓣|朵|棵|盒|勺|汤匙|茶匙|cup|cups|tbsp|tsp)$/i);
            if (m) {
              cleanAmount = m[1];
              cleanUnit = m[2];
            }
          }

          const category = item.category === 'pantry' ? 'pantry' : guessCategory(cleanName);
          return {
            name: cleanName,
            amount: cleanAmount,
            unit: cleanUnit,
            category,
            originalText: `${cleanName} ${cleanAmount}${cleanUnit}`.trim(),
          } as Ingredient;
        })
    : [];

  // 兜底：如果 AI 没有返回任何调味料（pantry），自动补充基础调味料
  const hasPantry = ingredients.some(i => i.category === 'pantry');
  if (!hasPantry && ingredients.length > 0) {
    console.log('[AI识别] 未返回调味料，自动补充基础调味料');
    const basePantry: Ingredient[] = [
      { name: '食用油', amount: '15', unit: 'ml', category: 'pantry', originalText: '食用油 15ml' },
      { name: '盐', amount: '3', unit: 'g', category: 'pantry', originalText: '盐 3g' },
      { name: '生抽', amount: '5', unit: 'ml', category: 'pantry', originalText: '生抽 5ml' },
    ];
    ingredients.push(...basePantry);
  }

  // 卡路里策略：本地估算为主，AI值为参考
  // 本地估算器基于完整食材库，比AI计算更稳定可靠
  const localCal = estimateCalories(ingredients, name);
  let calories = aiCalories;

  if (localCal > 0) {
    if (!calories || !isCalorieTrustworthy(calories)) {
      // AI 返回的是整百数或无效值，直接用本地
      console.log(`[卡路里] AI返回${aiCalories ?? '无'}不可信，使用本地估算: ${localCal}`);
      calories = localCal;
    } else {
      // AI 返回了非整百数，但仍需与本地比对——偏差超30%则用本地值
      const deviation = Math.abs(calories - localCal) / localCal;
      if (deviation > 0.3) {
        console.log(`[卡路里] AI返回${calories}与本地估算${localCal}偏差${(deviation * 100).toFixed(0)}%，使用本地值`);
        calories = localCal;
      }
    }
  }

  return { name, ingredients, calories };
}

export function AddRecipePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<InputMode | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSimulateAI = async () => {
    if (!canSubmit) return;

    setIsProcessing(true);

    if (mode === 'photo' && selectedFile) {
      const fallbackName = recipeName.trim() || selectedFile.name.replace(/\.[^/.]+$/, '') || '图片识别菜谱';

      if (!AI_API_KEY) {
        toast.info('未检测到云端AI密钥，当前使用本地OCR识别');
      }

      try {
        const aiResult = await recognizeWithVisionAI(selectedFile, fallbackName);

        if (aiResult && aiResult.name) {
          const finalIngredients = aiResult.ingredients.length > 0
            ? aiResult.ingredients
            : [
                { name: '主料', amount: '100', unit: 'g', category: 'fresh' as const, originalText: '主料 100g' },
                { name: '配菜', amount: '50', unit: 'g', category: 'fresh' as const, originalText: '配菜 50g' },
                { name: '调味料', amount: '适量', unit: '', category: 'pantry' as const, originalText: '调味料 适量' },
              ];

          const recipeId = Date.now().toString();
          const imageDataUrl = await fileToDataUrl(selectedFile);
          await saveImage(recipeId, imageDataUrl);

          recipeStorage.add({
            id: recipeId,
            name: aiResult.name,
            imageUrl: `indexeddb://${recipeId}`,
            servings: 1,
            calories: aiResult.calories,
            tags: generateRecipeTags(aiResult.name, finalIngredients, aiResult.calories),
            selected: false,
            ingredients: finalIngredients,
          });

          toast.success(`AI识别完成：${aiResult.name}`);
          navigate('/');
          setIsProcessing(false);
          return;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[AI识别] 异常:', msg);
        toast.warning(`云端AI识别失败(${msg})，已切换本地OCR识别`);
      }

      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng+chi_sim');
        const { data } = await worker.recognize(selectedFile);
        await worker.terminate();

        const detectedName = extractRecipeNameFromText(data.text, fallbackName);
        const detectedIngredients = parseIngredientsFromText(data.text);

        const ingredients = detectedIngredients.length > 0
          ? detectedIngredients
          : [
              { name: '主料', amount: '100', unit: 'g', category: 'fresh' as const, originalText: '主料 100g' },
              { name: '配菜', amount: '50', unit: 'g', category: 'fresh' as const, originalText: '配菜 50g' },
              { name: '调味料', amount: '适量', unit: '', category: 'pantry' as const, originalText: '调味料 适量' },
            ];

        const ocrRecipeId = Date.now().toString();
        const ocrImageDataUrl = await fileToDataUrl(selectedFile);
        await saveImage(ocrRecipeId, ocrImageDataUrl);

        recipeStorage.add({
          id: ocrRecipeId,
          name: detectedName,
          imageUrl: `indexeddb://${ocrRecipeId}`,
          servings: 1,
          tags: generateRecipeTags(detectedName, ingredients),
          selected: false,
          ingredients,
        });

        if (detectedIngredients.length === 0) {
          toast.warning('OCR未能完整识别食材，已使用默认食材模板');
        } else {
          toast.success(`OCR识别完成：${detectedName}`);
        }

        navigate('/');
      } catch {
        toast.error('图片识别失败，请更换清晰截图后重试');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    setTimeout(() => {
      const defaultIngredients: Ingredient[] = [
        { name: '主料', amount: '100', unit: 'g', category: 'fresh', originalText: '主料 100g' },
        { name: '配菜', amount: '50', unit: 'g', category: 'fresh', originalText: '配菜 50g' },
        { name: '调味料', amount: '适量', unit: '', category: 'pantry', originalText: '调味料 适量' },
      ];
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: recipeName,
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
        servings: 1,
        tags: generateRecipeTags(recipeName, defaultIngredients),
        selected: false,
        ingredients: defaultIngredients,
      };

      recipeStorage.add(newRecipe);
      setIsProcessing(false);
      navigate('/');
    }, 1200);
  };

  const handleSelectFile = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    if (!recipeName.trim()) {
      setRecipeName(file.name.replace(/\.[^/.]+$/, '') || '图片识别菜谱');
    }
  };

  const canSubmit = mode === 'photo' ? !!selectedFile : !!recipeName.trim();

  return (
    <div className="min-h-screen px-6 py-6" style={{ backgroundColor: '#F9F7F2' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full transition-colors hover:bg-white/50"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3D405B' }} />
          </button>
          <div>
            <h2 className="text-2xl" style={{ color: '#3D405B' }}>智能采集</h2>
            <p className="text-sm mt-1" style={{ color: '#81B29A' }}>
              什么都能吃的入口
            </p>
          </div>
        </div>

        {/* Mode Selection */}
        {!mode && (
          <div className="space-y-4">
            <ModeButton
              icon={<LinkIcon className="w-8 h-8" />}
              title="粘贴链接"
              description="下厨房 / B站 / 小红书"
              onClick={() => setMode('link')}
              color="#E07A5F"
            />
            <ModeButton
              icon={<Camera className="w-8 h-8" />}
              title="拍照识别"
              description="餐厅菜品 / 食谱截图"
              onClick={() => setMode('photo')}
              color="#81B29A"
            />
            <ModeButton
              icon={<Type className="w-8 h-8" />}
              title="输入菜名"
              description="番茄炒蛋 / 宫保鸡丁"
              onClick={() => setMode('text')}
              color="#F4A261"
            />
          </div>
        )}

        {/* Input Area */}
        {mode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {mode === 'text' && (
                <div className="space-y-4">
                  <label className="block text-sm" style={{ color: '#3D405B' }}>
                    输入菜名
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="例如：番茄炒蛋"
                    className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-colors focus:border-opacity-50"
                    style={{ 
                      borderColor: '#E07A5F',
                      backgroundColor: '#F9F7F2',
                      color: '#3D405B'
                    }}
                  />
                </div>
              )}
              
              {mode === 'link' && (
                <div className="space-y-4">
                  <label className="block text-sm" style={{ color: '#3D405B' }}>
                    粘贴菜谱链接
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-colors focus:border-opacity-50"
                    style={{ 
                      borderColor: '#E07A5F',
                      backgroundColor: '#F9F7F2',
                      color: '#3D405B'
                    }}
                  />
                </div>
              )}

              {mode === 'photo' && (
                <div className="space-y-4">
                  <label className="block text-sm" style={{ color: '#3D405B' }}>
                    上传菜品照片
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSelectFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleSelectFile(e.dataTransfer.files?.[0] || null);
                    }}
                    className="w-full border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors hover:border-opacity-70"
                    style={{ borderColor: '#81B29A' }}
                  >
                    <Camera className="w-12 h-12 mx-auto mb-3" style={{ color: '#81B29A' }} />
                    <p className="text-sm" style={{ color: '#81B29A' }}>
                      {selectedFile ? `已选择：${selectedFile.name}` : '点击上传或拖拽图片'}
                    </p>
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMode(null);
                  setRecipeName('');
                  setSelectedFile(null);
                }}
                className="flex-1 py-3 rounded-xl border-2 transition-all hover:bg-white active:scale-95"
                style={{ borderColor: '#E07A5F', color: '#E07A5F' }}
              >
                返回
              </button>
              <button
                onClick={handleSimulateAI}
                disabled={!canSubmit || isProcessing}
                className="flex-1 py-3 rounded-xl text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#E07A5F' }}
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    AI 处理中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    AI 识别
                  </>
                )}
              </button>
            </div>

            {/* AI Note */}
            <div className="bg-white rounded-xl p-4 text-sm" style={{ color: '#81B29A' }}>
              <div className="flex gap-2">
                <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>AI 预处理：</strong>
                  自动转换为1人份，智能取整（如遇0.3个洋葱，会建议买1个，余下可做洋葱圈或冷藏）
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface ModeButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}

function ModeButton({ icon, title, description, onClick, color }: ModeButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 text-left"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '20' }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg mb-1" style={{ color: '#3D405B' }}>{title}</h3>
        <p className="text-sm" style={{ color: '#81B29A' }}>{description}</p>
      </div>
      <div className="text-2xl" style={{ color }}>→</div>
    </motion.button>
  );
}
