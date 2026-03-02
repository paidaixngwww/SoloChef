import { Link, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Link2, 
  Camera, 
  Type, 
  ShoppingCart, 
  Layers, 
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { DesignShowcase } from '../components/DesignShowcase';

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F2' }}>
      {/* Header */}
      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full transition-colors hover:bg-white/50 mb-6"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3D405B' }} />
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl mb-3" style={{ color: '#3D405B' }}>
              SoloChef
            </h1>
            <p className="text-xl mb-2" style={{ color: '#E07A5F' }}>
              一人食，不将就
            </p>
            <p style={{ color: '#81B29A' }}>
              买得精准，吃得从容
            </p>
          </div>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="px-6 pb-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Core Problem */}
          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#E07A5F20' }}
              >
                <Info className="w-6 h-6" style={{ color: '#E07A5F' }} />
              </div>
              <div>
                <h2 className="text-2xl mb-2" style={{ color: '#3D405B' }}>
                  核心痛点
                </h2>
                <p style={{ color: '#81B29A' }}>
                  专为独居青年设计的膳食管理与智能采购助手
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <PainPoint text="一个人做饭买菜太难控制份量" />
              <PainPoint text="多道菜怎么合并买菜最划算" />
              <PainPoint text="食材用不完容易浪费" />
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-2xl mb-6 text-center" style={{ color: '#3D405B' }}>
              功能模块
            </h2>
            <div className="space-y-6">
              <FeatureCard
                icon={<Sparkles className="w-6 h-6" />}
                title="智能采集"
                subtitle="What: 多模态输入"
                description="支持粘贴链接（下厨房/B站）、拍照识别、输入菜名三种方式。AI自动提取食材并转换为1人份。"
                color="#E07A5F"
                steps={[
                  { icon: <Link2 className="w-5 h-5" />, text: "粘贴菜谱链接" },
                  { icon: <Camera className="w-5 h-5" />, text: "拍照识别菜品" },
                  { icon: <Type className="w-5 h-5" />, text: "输入菜名" },
                ]}
              />

              <FeatureCard
                icon={<Layers className="w-6 h-6" />}
                title="膳食购物车"
                subtitle="What: 菜谱组合系统"
                description="像电商购物车一样管理菜谱。勾选本周想吃的3-5道菜，系统实时显示预计食材种类。"
                color="#81B29A"
                highlight="核心亮点：一键合并生成采购单"
              />

              <FeatureCard
                icon={<ShoppingCart className="w-6 h-6" />}
                title="智能归并引擎"
                subtitle="What: 多菜一买"
                description="自动处理同义词（西红柿=番茄）、单位换算、食材去重。分类展示生鲜（需买）和粮油调味（检查库存）。"
                color="#F4A261"
                steps={[
                  { icon: <Check className="w-5 h-5" />, text: "同义词识别" },
                  { icon: <Check className="w-5 h-5" />, text: "单位换算" },
                  { icon: <Check className="w-5 h-5" />, text: "智能分类" },
                ]}
              />

              <FeatureCard
                icon={<Check className="w-6 h-6" />}
                title="极简执行清单"
                subtitle="What: 购物助手"
                description="超市购物时使用。滑动划掉已买商品，长按查看食材来源（哪几道菜会用到），支持文本导出。"
                color="#E07A5F"
              />
            </div>
          </section>

          {/* Design Philosophy */}
          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl mb-6 text-center" style={{ color: '#3D405B' }}>
              设计理念
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <PhilosophyItem
                emoji="🌾"
                title="日式极简"
                description="Muji / Kinfolk 风格，大量留白，温暖治愈"
              />
              <PhilosophyItem
                emoji="🎯"
                title="智能高效"
                description="AI辅助，减少决策疲劳，一键完成复杂操作"
              />
              <PhilosophyItem
                emoji="💚"
                title="无负担感"
                description="柔和配色，流畅动画，让一人食也能从容优雅"
              />
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ backgroundColor: '#E07A5F' }}
            >
              <Sparkles className="w-5 h-5" />
              开始使用
            </Link>
          </div>
        </div>
      </div>

      {/* Design Showcase */}
      <div className="border-t-4" style={{ borderColor: '#E07A5F' }}>
        <DesignShowcase />
      </div>
    </div>
  );
}

function PainPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div 
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: '#E07A5F' }}
      />
      <p style={{ color: '#3D405B' }}>{text}</p>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  steps?: { icon: React.ReactNode; text: string }[];
  highlight?: string;
}

function FeatureCard({ icon, title, subtitle, description, color, steps, highlight }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '20' }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl mb-1" style={{ color: '#3D405B' }}>
            {title}
          </h3>
          <p className="text-sm mb-2" style={{ color }}>
            {subtitle}
          </p>
          <p style={{ color: '#81B29A' }}>
            {description}
          </p>
        </div>
      </div>
      
      {steps && (
        <div className="flex flex-wrap gap-2 mt-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: color + '10' }}
            >
              <div style={{ color }}>{step.icon}</div>
              <span className="text-sm" style={{ color }}>{step.text}</span>
            </div>
          ))}
        </div>
      )}

      {highlight && (
        <div 
          className="mt-4 px-4 py-3 rounded-lg"
          style={{ backgroundColor: '#F9F7F2' }}
        >
          <p className="text-sm" style={{ color: '#3D405B' }}>
            ✨ <strong>{highlight}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

function PhilosophyItem({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="mb-2" style={{ color: '#3D405B' }}>{title}</h3>
      <p className="text-sm" style={{ color: '#81B29A' }}>{description}</p>
    </div>
  );
}
