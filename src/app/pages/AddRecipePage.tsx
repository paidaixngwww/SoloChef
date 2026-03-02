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

  const promptText = '你是专业食谱提取助手，服务于"一人食"场景（1人份）。请仔细观察图片中的所有文字（包括标题、食材列表、步骤说明、配图文字等每一处），完整提取菜名和每一种食材与调味料（不要遗漏任何食材和调味料！）。所有内容必须使用简体中文输出（英文请翻译成中文）。category 分类规则：生鲜蔬菜肉蛋奶豆腐=fresh，油盐酱醋糖调味料香料=pantry。只输出 JSON，不要解释。\nJSON 格式: {"recipeName":"中文菜名","calories":数字,"ingredients":[{"name":"中文食材名","amount":"数量","unit":"单位","category":"fresh|pantry"}]}\n\n请仔细识别这张菜谱图片中的所有文字内容。要求：\n1）recipeName 必须是一个具体的菜品名称（如"红烧排骨""番茄鸡蛋汤"），如果图片标题不是具体菜品名而是泛称或分类（如早餐、午餐、一周食谱、减脂餐、Day1等），则根据食材自动生成一个简短具体的菜品名；\n2）【最重要-完整提取】你必须提取图片中出现的每一种食材和调味料，不能遗漏！特别注意：很多调味料（如蚝油、生抽、料酒、盐、糖、醋、胡椒粉等）不会出现在食材列表中，而是写在烹饪步骤/做法说明的文字里（如"加入葱姜，蚝油"），你必须仔细阅读步骤中的每一句话，把其中提到的所有调味料也提取出来；\n3）所有字段用简体中文输出（英文翻译成中文）；\n4）【重要-用量智能推荐】amount 和 unit 必须是具体的数值和单位。如果图片中食材没有标注具体克重（如写了"适量""少许""一勺""若干"或完全没写用量），你必须根据该菜品1人份的合理烹饪用量，自动推荐具体的数值。参考标准：主食材100-200g，配菜50-100g，肉类100-150g，鸡蛋1-2个，调味料（盐2-3g、生抽5-10ml、料酒10ml、油15ml、蚝油5-10ml、醋5ml等）。unit 使用 g/ml/个/根/片 等常见单位；\n5）【重要-卡路里精确计算】calories 字段为该菜谱1人份的总热量（千卡/kcal）。你必须逐一根据每种食材的用量分别计算热量，然后求和。常见热量参考（每100g）：米饭116、面条110、猪肉395、牛肉125、鸡肉167、鸡蛋72/个、虾仁87、豆腐81、番茄19、胡萝卜37、西兰花34、土豆77、山药56、排骨264、玉米112、白菜15；调味料（每10ml/g）：油90、生抽5、蚝油9、盐0、糖39。禁止输出500、300、400、600等整百数作为默认值，必须是根据食材精确计算的结果。如果图片上已标注卡路里则直接使用该数值。';

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
          const cleanAmount = String(item.amount || '适量').trim();
          const cleanUnit = String(item.unit || '').trim();
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

  // 优先使用可信的 AI 卡路里，否则用本地精确估算
  let calories = aiCalories;
  if (!calories || !isCalorieTrustworthy(calories)) {
    const localCal = estimateCalories(ingredients, name);
    if (localCal > 0) {
      console.log(`[卡路里] AI返回${aiCalories ?? '无'}不可信，本地估算: ${localCal}`);
      calories = localCal;
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
