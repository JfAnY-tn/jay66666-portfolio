import SectionHeading from '../ui/SectionHeading';
import ScrollReveal from '../ui/ScrollReveal';
import ContactForm from '../ui/ContactForm';
import siteConfig from '../../data/siteConfig.json';

const contactInfo = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: '邮箱',
    value: siteConfig.email,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    label: '微信',
    value: siteConfig.wechat,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: '所在地',
    value: siteConfig.location,
  },
];

export default function ContactSection() {
  return (
    <section id="contact" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          number="联系我"
          title="开启一个项目"
          subtitle="有任何剪辑需求或合作意向，欢迎随时联系。我会在 24 小时内回复。"
        />

        <div className="grid gap-12 lg:grid-cols-5">
          {/* Form */}
          <ScrollReveal className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 dark:border-cinema-surface bg-white dark:bg-cinema-dark/50 p-8">
              <ContactForm />
            </div>
          </ScrollReveal>

          {/* Contact info */}
          <ScrollReveal delay={100} className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 dark:border-cinema-surface bg-white dark:bg-cinema-dark/50 p-8 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-cinema-text">联系方式</h3>
                <div className="space-y-5">
                  {contactInfo.map((info) => (
                    <div key={info.label} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-vivid-purple-500/10 flex items-center justify-center text-vivid-purple-400 flex-shrink-0">
                        {info.icon}
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-cinema-text-muted">{info.label}</div>
                        <div className="text-sm font-medium text-gray-800 dark:text-cinema-text">{info.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social links */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-cinema-surface">
                <div className="text-sm text-gray-500 dark:text-cinema-text-muted mb-3">社交媒体</div>
                <div className="flex gap-3">
                  {Object.entries(siteConfig.socialLinks).map(([name, url]) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm capitalize text-gray-500 dark:text-cinema-text-muted bg-gray-100 dark:bg-cinema-surface rounded-lg hover:bg-vivid-purple-500/20 hover:text-vivid-purple-400 transition-all"
                    >
                      {name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
