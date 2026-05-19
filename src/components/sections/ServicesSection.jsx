import SectionHeading from '../ui/SectionHeading';
import ScrollReveal from '../ui/ScrollReveal';
import ServiceCard from '../ui/ServiceCard';
import services from '../../data/services.json';

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          number="服务"
          title="我能为你做什么"
          subtitle="从品牌广告到短视频，从婚礼记录到创意 MV，提供全类型视频剪辑服务。"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((svc, i) => (
            <ScrollReveal key={svc.id} delay={i * 100} className="h-full">
              <ServiceCard {...svc} index={i} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
