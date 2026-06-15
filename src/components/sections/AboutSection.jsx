import { useInView } from 'react-intersection-observer';
import SectionHeading from '../ui/SectionHeading';
import ScrollReveal from '../ui/ScrollReveal';
import useCountUp from '../../hooks/useCountUp';

const stats = [
  { value: 100, suffix: '+', label: '完成项目' },
  { value: 8, suffix: '', label: '年经验' },
  { value: 50, suffix: '+', label: '合作客户' },
  { value: 3, suffix: '', label: '行业奖项' },
];

const skills = [
  { name: 'Premiere Pro', level: 95 },
  { name: 'DaVinci Resolve', level: 90 },
  { name: 'After Effects', level: 85 },
  { name: 'Final Cut Pro', level: 80 },
  { name: 'CapCut', level: 90 },
];

function StatCard({ value, suffix, label, start }) {
  const count = useCountUp(value, start, 2000);
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-cinema-surface bg-white dark:bg-cinema-dark/50 p-6 text-center">
      <div className="text-3xl font-bold text-vivid-purple-400">
        {count}{suffix}
      </div>
      <div className="mt-1 text-sm text-gray-500 dark:text-cinema-text-muted">{label}</div>
    </div>
  );
}

function SkillBar({ name, level, start }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span>{name}</span>
        <span className="text-gray-500 dark:text-cinema-text-muted">{start ? <AnimatedPercent target={level} start={start} /> : '0'}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-cinema-surface overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-vivid-purple-500 to-hot-pink-500 transition-all duration-1000 ease-out"
          style={{ width: start ? `${level}%` : '0%' }}
        />
      </div>
    </div>
  );
}

function AnimatedPercent({ target, start }) {
  const count = useCountUp(target, start, 1000);
  return count;
}

export default function AboutSection() {
  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const { ref: skillsRef, inView: skillsInView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <section id="about" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          number="关于我"
          title="用剪辑讲述故事"
          subtitle="8 年剪辑经验，擅长广告、MV、宣传片等多种类型。对画面节奏和色彩有着天生的敏感，致力于为每个项目找到最合适的视觉语言。"
        />

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Bio */}
          <ScrollReveal>
            <div className="rounded-2xl border border-gray-200 dark:border-cinema-surface bg-white dark:bg-cinema-dark/50 p-8">
              <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-cinema-text">个人简介</h3>
              <div className="space-y-4 text-gray-500 dark:text-cinema-text-muted leading-relaxed">
                <p>
                  你好，我是 Jay66666，一名专业视频剪辑师。2016 年入行，从广告公司剪辑师起步，
                  逐步建立起自己的剪辑工作室。擅长企业宣传片、课程制作、短视频及活动记录制作。
                </p>
                <p>
                  我的剪辑理念是：每一帧都应该有存在的理由。无论是 15 秒的短视频还是 10 分钟的宣传片，
                  节奏感和情感的传递永远是核心。善于倾听客户需求，用镜头语言准确传达品牌信息。
                </p>
                <p>
                  工作之外，我也是一名摄影爱好者，喜欢用镜头记录城市街头的瞬间。
                  这些日常观察也反哺了我的剪辑审美。
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Stats + Skills */}
          <div className="space-y-8">
            <ScrollReveal delay={100}>
              <div ref={statsRef} className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <StatCard key={stat.label} {...stat} start={statsInView} />
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div ref={skillsRef} className="rounded-2xl border border-gray-200 dark:border-cinema-surface bg-white dark:bg-cinema-dark/50 p-8">
                <h3 className="mb-6 text-lg font-bold text-gray-800 dark:text-cinema-text">技能与工具</h3>
                <div className="space-y-4">
                  {skills.map((skill) => (
                    <SkillBar key={skill.name} {...skill} start={skillsInView} />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
