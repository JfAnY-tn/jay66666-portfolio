import { useTheme } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HeroSection from './components/sections/HeroSection';
import PortfolioSection from './components/sections/PortfolioSection';
import ServicesSection from './components/sections/ServicesSection';
import AboutSection from './components/sections/AboutSection';
import TestimonialsSection from './components/sections/TestimonialsSection';
import ContactSection from './components/sections/ContactSection';

const darkBg = `
  url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E") repeat,
  radial-gradient(ellipse at 20% 0%, #1A1040 0%, transparent 50%),
  radial-gradient(ellipse at 80% 100%, #1A1030 0%, transparent 50%),
  linear-gradient(180deg, #0C0C1E 0%, #101028 50%, #0C0C1E 100%)
`;

const lightBg = `
  radial-gradient(ellipse at 20% 0%, #EDE9FE 0%, transparent 50%),
  radial-gradient(ellipse at 80% 100%, #FCE7F3 0%, transparent 50%),
  linear-gradient(180deg, #FAFAFA 0%, #F5F3FF 50%, #FAFAFA 100%)
`;

export default function App() {
  const { dark } = useTheme();

  return (
    <div
      className="min-h-screen text-cinema-text animate-bg floating-grid"
      style={{
        color: dark ? undefined : '#1A1A2E',
        background: dark ? darkBg : lightBg,
        backgroundSize: dark ? 'auto, 150% 150%, 150% 150%, auto' : 'auto, 150% 150%, 150% 150%, auto',
        backgroundAttachment: 'fixed',
      }}
    >
      <Navbar />
      <main>
        <HeroSection />
        <PortfolioSection />
        <ServicesSection />
        <AboutSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
