import { Palette, Type, Layout, Sparkles } from 'lucide-react';

export function DesignShowcase() {
  return (
    <div className="min-h-screen px-6 py-12" style={{ backgroundColor: '#F9F7F2' }}>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-3" style={{ color: '#3D405B' }}>
            SoloChef 设计系统
          </h1>
          <p className="text-lg" style={{ color: '#81B29A' }}>
            日式极简 · 温暖治愈
          </p>
        </div>

        {/* Color Palette */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6" style={{ color: '#E07A5F' }} />
            <h2 className="text-2xl" style={{ color: '#3D405B' }}>色彩系统</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorSwatch
              name="奶油白"
              hex="#F9F7F2"
              usage="背景色"
              textDark
            />
            <ColorSwatch
              name="柿子红"
              hex="#E07A5F"
              usage="主要按钮 / 强调"
            />
            <ColorSwatch
              name="鼠尾草绿"
              hex="#81B29A"
              usage="成功 / 蔬菜标签"
            />
            <ColorSwatch
              name="深炭灰"
              hex="#3D405B"
              usage="主要文字"
            />
          </div>
        </section>

        {/* Typography */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Type className="w-6 h-6" style={{ color: '#E07A5F' }} />
            <h2 className="text-2xl" style={{ color: '#3D405B' }}>字体层级</h2>
          </div>
          <div className="bg-white rounded-2xl p-6 space-y-4">
            <div>
              <h1 style={{ color: '#3D405B' }}>标题一 - SoloChef</h1>
              <p className="text-sm mt-1" style={{ color: '#81B29A' }}>
                32px / Medium / Inter & Noto Sans SC
              </p>
            </div>
            <div>
              <h2 style={{ color: '#3D405B' }}>标题二 - 智能采集</h2>
              <p className="text-sm mt-1" style={{ color: '#81B29A' }}>
                24px / Medium
              </p>
            </div>
            <div>
              <h3 style={{ color: '#3D405B' }}>标题三 - 番茄炒蛋</h3>
              <p className="text-sm mt-1" style={{ color: '#81B29A' }}>
                18px / Medium
              </p>
            </div>
            <div>
              <p style={{ color: '#3D405B' }}>正文 - 一人食，不将就。买得精准，吃得从容。</p>
              <p className="text-sm mt-1" style={{ color: '#81B29A' }}>
                16px / Regular
              </p>
            </div>
          </div>
        </section>

        {/* Components */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Layout className="w-6 h-6" style={{ color: '#E07A5F' }} />
            <h2 className="text-2xl" style={{ color: '#3D405B' }}>核心组件</h2>
          </div>
          <div className="space-y-6">
            {/* Primary Button */}
            <div>
              <p className="text-sm mb-3" style={{ color: '#81B29A' }}>主要按钮</p>
              <button
                className="px-6 py-3 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#E07A5F' }}
              >
                生成采购单
              </button>
            </div>

            {/* Card */}
            <div>
              <p className="text-sm mb-3" style={{ color: '#81B29A' }}>卡片容器</p>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="mb-2" style={{ color: '#3D405B' }}>菜谱卡片</h3>
                <p className="text-sm" style={{ color: '#81B29A' }}>
                  圆角: 16px · 阴影: 柔和 · 过渡: 流畅
                </p>
              </div>
            </div>

            {/* Tag */}
            <div>
              <p className="text-sm mb-3" style={{ color: '#81B29A' }}>标签</p>
              <div className="flex gap-2">
                <span
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{ backgroundColor: '#E07A5F20', color: '#E07A5F' }}
                >
                  快手
                </span>
                <span
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{ backgroundColor: '#81B29A20', color: '#81B29A' }}
                >
                  健康
                </span>
                <span
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{ backgroundColor: '#F4A26120', color: '#F4A261' }}
                >
                  家常
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Design Principles */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6" style={{ color: '#E07A5F' }} />
            <h2 className="text-2xl" style={{ color: '#3D405B' }}>设计原则</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <PrincipleCard
              title="极简留白"
              description="大量呼吸空间，避免信息过载"
              icon="○"
            />
            <PrincipleCard
              title="温暖治愈"
              description="柔和色彩与圆润圆角营造安心感"
              icon="♡"
            />
            <PrincipleCard
              title="智能高效"
              description="一键操作，AI辅助，减少决策疲劳"
              icon="✦"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

interface ColorSwatchProps {
  name: string;
  hex: string;
  usage: string;
  textDark?: boolean;
}

function ColorSwatch({ name, hex, usage, textDark }: ColorSwatchProps) {
  return (
    <div className="space-y-2">
      <div
        className="h-24 rounded-xl shadow-sm"
        style={{ backgroundColor: hex }}
      />
      <div>
        <p className="font-medium" style={{ color: '#3D405B' }}>{name}</p>
        <p className="text-sm" style={{ color: '#81B29A' }}>{hex}</p>
        <p className="text-xs mt-1" style={{ color: '#81B29A' }}>{usage}</p>
      </div>
    </div>
  );
}

interface PrincipleCardProps {
  title: string;
  description: string;
  icon: string;
}

function PrincipleCard({ title, description, icon }: PrincipleCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
      <div className="text-4xl mb-3" style={{ color: '#E07A5F' }}>
        {icon}
      </div>
      <h3 className="mb-2" style={{ color: '#3D405B' }}>{title}</h3>
      <p className="text-sm" style={{ color: '#81B29A' }}>{description}</p>
    </div>
  );
}
