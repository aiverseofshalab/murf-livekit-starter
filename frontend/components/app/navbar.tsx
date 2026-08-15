'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Globe, HeartPulse, Menu, Mic, UserCheck, X } from 'lucide-react';
import { MediSathiLogo } from '@/components/app/medisathi-logo';
import { useLanguage } from '@/lib/language-context';

export function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: t.nav.home, icon: HeartPulse },
    { href: '/#how-it-works', label: t.nav.howItWorks, icon: Globe },
    { href: '/#features', label: t.nav.features, icon: HeartPulse },
    { href: '/analytics', label: t.nav.analytics, icon: Activity },
    { href: '/dashboard', label: t.nav.operations, icon: UserCheck },
  ];

  return (
    <div className="pointer-events-none sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8">
      <header
        className={`pointer-events-auto mx-auto max-w-7xl rounded-2xl transition-all duration-300 ${
          scrolled
            ? 'glass-panel-dark mt-2 border-[#2A4E49] bg-[#102F2B]/90 py-2.5 shadow-2xl'
            : 'glass-panel-dark mt-4 bg-[#102F2B]/80 py-3.5 shadow-xl'
        }`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6">
          {/* Brand Logo with Uppercase MEDISATHI */}
          <Link href="/" className="group flex items-center gap-3">
            <MediSathiLogo size={38} variant="dark" showText={true} />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 rounded-xl border border-[#2A4E49] bg-[#0B2522]/80 p-1 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href === '/' && pathname === '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'border border-[#5EEAD4]/40 bg-[#163A35] text-[#5EEAD4] shadow-xs'
                      : 'text-[#B8CBC8] hover:bg-[#102F2B] hover:text-[#F5FAF9]'
                  }`}
                >
                  <Icon className={`size-3.5 ${isActive ? 'text-[#5EEAD4]' : 'text-[#829A96]'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Functional Language Toggle & Primary CTA */}
          <div className="flex items-center gap-3">
            {/* Functional Language Toggle */}
            <div className="flex items-center rounded-xl border border-[#2A4E49] bg-[#0B2522] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  language === 'en'
                    ? 'bg-[#0F766E] text-[#FFFFFF] shadow-xs'
                    : 'text-[#829A96] hover:text-[#F5FAF9]'
                }`}
                aria-label="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`font-hindi rounded-lg px-2.5 py-1 transition ${
                  language === 'hi'
                    ? 'bg-[#0F766E] text-[#FFFFFF] shadow-xs'
                    : 'text-[#829A96] hover:text-[#F5FAF9]'
                }`}
                aria-label="हिंदी भाषा चुनें"
              >
                हिन्दी
              </button>
            </div>

            {/* Primary CTA */}
            <Link
              href="/#voice-pod"
              className="hidden items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-bold tracking-wider text-[#FFFFFF] uppercase shadow-lg shadow-[#0F766E]/20 transition hover:bg-[#115E59] active:scale-[0.98] sm:inline-flex"
            >
              <Mic className="size-3.5 text-[#5EEAD4]" />
              {t.nav.talkCta}
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-[#2A4E49] bg-[#0B2522] p-2 text-[#B8CBC8] transition hover:text-[#F5FAF9] lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <nav className="mt-3 space-y-2 border-t border-[#2A4E49] px-4 pt-3 pb-2 lg:hidden">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#0F766E] text-[#FFFFFF]'
                      : 'text-[#B8CBC8] hover:bg-[#163A35] hover:text-[#F5FAF9]'
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? 'text-[#5EEAD4]' : 'text-[#829A96]'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </header>
    </div>
  );
}
