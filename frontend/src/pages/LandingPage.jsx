import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Star, ArrowRight, Users, BriefcaseMedical, ShieldCheck, MessageSquareHeart } from 'lucide-react';

/* ─── Reveal wrapper ─── */
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Live clock ─── */
function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      let h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      setTime(`${h}:${m} ${ampm}`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ═════════════════════════════════════════════
   LANDING PAGE
   ═════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const time = useClock();
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [navShrunk, setNavShrunk] = useState(false);

  /* scroll tracking */
  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      setNavShrunk(window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const heroContentStyle = scrollY < 1000
    ? { transform: `translateY(${scrollY * 0.4}px)`, opacity: Math.max(0, 1 - scrollY / 600) }
    : { opacity: 0 };

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-gold selection:text-white">

      {/* ── Global noise overlay ── */}
      {/* noise overlay removed — external resource was returning 403 */}

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-500
        ${navShrunk
          ? 'py-4 bg-[#050505]/80 backdrop-blur-md border-b border-white/5'
          : 'py-8 bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <span className="text-2xl font-bold tracking-tighter font-serif select-none cursor-default">
            NeuraLyn.<span className="text-gold">.</span>
          </span>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium
                       bg-white text-black hover:scale-105 hover:bg-gray-100 transition-all duration-300 cursor-pointer"
          >
            Enter
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 bg-[#050505]">

        {/* Background atmosphere */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <div className="absolute top-0 left-0 w-full h-full opacity-60 mix-blend-screen">
            <img
              src="https://framerusercontent.com/images/9zvwRJAavKKacVyhFCwHyXW1U.png?width=1536&height=1024"
              alt=""
              className="w-full h-full object-cover object-center opacity-80"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 via-transparent to-red-900/30 z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505] z-10" />
        </div>

        {/* Ambient Text Glow */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[800px] h-[400px] bg-gradient-to-r from-teal-500/20 via-transparent to-red-500/20 blur-[120px] rounded-[100%] opacity-60 z-0 pointer-events-none mix-blend-screen" />

        {/* Floating surrealist hands */}
        <div className="absolute -left-[10%] top-[-10%] md:left-[-5%] md:top-[-15%] w-[50vw] md:w-[40vw] max-w-[800px] z-10 pointer-events-none mix-blend-hard-light opacity-90 animate-float-left hue-rotate-[160deg] saturate-150 brightness-110">
          <img
            src="https://framerusercontent.com/images/KNhiA5A2ykNYqNkj04Hk6BVg5A.png?width=1540&height=1320"
            alt=""
            className="w-full h-auto object-contain"
          />
        </div>
        <div className="absolute -right-[10%] bottom-[-10%] md:right-[-5%] md:bottom-[-5%] w-[45vw] md:w-[35vw] max-w-[700px] z-10 pointer-events-none mix-blend-hard-light opacity-90 animate-float-right">
          <img
            src="https://framerusercontent.com/images/X89VFCABCEjjZ4oLGa3PjbOmsA.png?width=1542&height=1002"
            alt=""
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Hero content */}
        <div className="container mx-auto px-6 relative z-20 text-center flex flex-col items-center justify-center h-full">
          <div style={heroContentStyle} className="max-w-4xl mx-auto transition-none relative z-10">
            <Reveal>
              <h1
                className="text-5xl md:text-7xl font-medium leading-[1.1] tracking-tight mb-6 text-white mix-blend-overlay font-serif"
                style={{ textShadow: '0 0 16px rgba(200,255,255,0.4), 0 0 30px rgba(255,200,200,0.4)' }}
              >
                NeuraLyn.<span className="text-teal-300">.</span> <br />
                <span className="italic font-light text-white/90 text-3xl md:text-5xl mt-4 block">The mental wellness agent.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p
                className="text-base md:text-lg text-white/80 max-w-lg mx-auto mb-16 font-light tracking-wide leading-relaxed mix-blend-overlay"
                style={{ textShadow: '0 0 8px rgba(255,255,255,0.5)' }}
              >
                We turn the unseen into the understood. An AI-powered companion for those who dare to prioritize their mind.
              </p>
            </Reveal>

            <Reveal delay={0.4} className="flex flex-col items-center gap-6">
              <button
                onClick={() => navigate('/register')}
                className="relative group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                <div className="relative border border-white/20 bg-white/5 backdrop-blur-sm px-6 py-2 rounded-full flex items-center gap-3 text-xs md:text-sm text-white/80 uppercase tracking-widest hover:bg-white/10 transition-colors duration-300">
                  <span>Enter the Void</span>
                </div>
              </button>

              <div className="flex items-center gap-4 text-[10px] md:text-xs text-white/40 uppercase tracking-widest mt-8 font-mono">
                <span>{time}</span>
                <span className="w-px h-3 bg-white/20" />
                <span>IND</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <Reveal className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-[10px] uppercase tracking-[0.32em] text-white/35 mb-4">Application Portals</p>
            <h2 className="text-4xl md:text-6xl text-white font-serif leading-tight">
              Dedicated dashboards for every <span className="italic text-gold">support role</span>.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: 'Youth Support',
                copy: 'Chat, assessments, mood history, and mentor booking.',
                icon: MessageSquareHeart,
              },
              {
                title: 'Peer Mentor',
                copy: 'Availability publishing, active sessions, and live case notes.',
                icon: Users,
              },
              {
                title: 'Experienced Mentor',
                copy: 'Escalated high-risk cases and professional follow-up workflow.',
                icon: BriefcaseMedical,
              },
              {
                title: 'NGO Dashboard',
                copy: 'Alerts, triage analytics, and organization-wide oversight.',
                icon: ShieldCheck,
              },
            ].map((portal, index) => (
              <Reveal key={portal.title} delay={index * 0.08}>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full text-left rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md hover:bg-white/[0.06] hover:border-gold/30 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/15 to-transparent border border-white/10 flex items-center justify-center mb-6">
                    <portal.icon size={22} className="text-white/80 group-hover:text-gold transition-colors" />
                  </div>
                  <h3 className="text-2xl font-serif text-white mb-3">{portal.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed mb-6">{portal.copy}</p>
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-gold/80">
                    Enter Portal
                    <ArrowRight size={14} />
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <Reveal className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl lg:text-6xl leading-tight text-white/90 mb-12 font-serif">
              We design the safe space where your <span className="italic text-gold">mental clarity</span> truly lives.
            </h2>
            <p className="text-xl md:text-2xl text-gray-400 leading-relaxed font-light">
              Compassion meets technology. We remove the noise so your mind resonates with absolute calm.
            </p>
          </Reveal>

          {/* Logo / trust markers */}
          <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {['NEURAL', 'EMPATHY', 'CLARITY', 'EVOLVE'].map((w, i) => (
              <Reveal key={w} delay={i * 0.1}>
                <span className="font-bold text-xl tracking-widest">{w}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARDS ── */}
      <section className="py-40 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <Reveal className="mb-32">
            <h2 className="text-5xl md:text-7xl text-center font-serif">
              Define your <br />
              <span className="italic">digital presence</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card 1 — Gold accent */}
            <div style={{ transform: `translateY(${scrollY * 0.05}px)` }}>
              <Reveal>
                <div className="bg-[#a78b71] rounded-3xl p-8 md:p-12 aspect-[4/5] flex flex-col justify-between shadow-2xl
                                hover:shadow-[0_20px_50px_rgba(167,139,113,0.3)] transition-all duration-500 group cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                      <Star size={24} className="text-black" />
                    </div>
                    <span className="text-black font-medium text-sm border border-black/20 px-3 py-1 rounded-full">01</span>
                  </div>
                  <div>
                    <h3 className="text-4xl md:text-5xl text-black mb-4 leading-none tracking-tight font-serif">
                      AI <br />Companion
                    </h3>
                    <p className="text-black/80 text-lg leading-snug">
                      Your safe space. An intelligent, empathetic listener available 24/7 to help you navigate your emotions.
                    </p>
                  </div>
                  <div className="w-full h-px bg-black/10 mt-8" />
                </div>
              </Reveal>
            </div>

            {/* Card 2 — Dark */}
            <div style={{ transform: `translateY(${scrollY * -0.05}px)` }} className="md:mt-24">
              <Reveal delay={0.15}>
                <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 aspect-[4/5] flex flex-col justify-between shadow-2xl
                                group cursor-pointer hover:border-gold/50 transition-all duration-500">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <ArrowRight size={24} className="text-white -rotate-45" />
                    </div>
                    <span className="text-white/50 font-medium text-sm border border-white/10 px-3 py-1 rounded-full">02</span>
                  </div>
                  <div>
                    <h3 className="text-4xl md:text-5xl text-white mb-4 leading-none tracking-tight font-serif">
                      Human <br />Connection
                    </h3>
                    <p className="text-gray-400 text-lg leading-snug">
                      When algorithms aren't enough. Seamlessly escalate to trained peer mentors or professional support.
                    </p>
                  </div>
                  <div className="w-full h-px bg-white/10 mt-8" />
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* Background dot pattern */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 border-t border-white/5 bg-[#050505] relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
            <div className="w-full md:w-auto">
              <h2 className="text-[10vw] leading-[0.8] tracking-tighter text-white/10 font-bold select-none pointer-events-none">
                NEURALYN.
              </h2>
            </div>
            <div className="flex flex-col gap-8 text-right">
              <div className="flex flex-col gap-4 text-gray-400">
                {['Instagram', 'Twitter', 'LinkedIn'].map(link => (
                  <a key={link} href="#" className="hover:text-white transition-colors duration-300 cursor-pointer">{link}</a>
                ))}
              </div>
              <p className="text-sm text-gray-600">© 2026 NeuraLyn. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
