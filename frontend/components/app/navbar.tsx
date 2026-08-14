'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Globe, HeartPulse, Menu, Mic, UserCheck, X } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
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
    { href: '/', label: 'Voice Assistant', icon: HeartPulse },
    { href: '/analytics', label: 'Call Analytics', icon: Activity },
    { href: '/dashboard', label: 'Operations Console', icon: UserCheck },
  ];

  return (
    <div className="pointer-events-none sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8">
      <header
        className={`pointer-events-auto mx-auto max-w-7xl rounded-2xl transition-all duration-300 ${
          scrolled
            ? 'glass-panel mt-2 border-[rgba(15,118,110,0.18)] py-2.5 shadow-lg'
            : 'glass-panel mt-4 py-3.5 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6">
          {/* Logo & Product Mark */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[#0F766E] text-[#FFFFFF] shadow-md transition group-hover:scale-105">
              <HeartPulse className="size-5 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold tracking-tight text-[#123532]">
                  MediSathi
                </span>
                <span className="hidden rounded-full border border-[rgba(15,118,110,0.16)] bg-[#E7F4F1] px-2.5 py-0.5 text-[11px] font-medium text-[#0F766E] sm:inline-block">
                  Health Access
                </span>
              </div>
              <p className="hidden text-[11px] text-[#78918D] sm:block">Healthcare that listens</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1.5 rounded-xl border border-[rgba(15,118,110,0.12)] bg-[#EEF7F5] p-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'border border-[rgba(15,118,110,0.15)] bg-[#FFFFFF] text-[#0F766E] shadow-sm'
                      : 'text-[#526C68] hover:bg-white/60 hover:text-[#123532]'
                  }`}
                >
                  <Icon className={`size-3.5 ${isActive ? 'text-[#0F766E]' : 'text-[#78918D]'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Language Selector & Primary CTA */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div
              className="hidden items-center gap-2 rounded-xl border border-[rgba(15,118,110,0.12)] bg-[#EEF7F5] px-3 py-2 text-[11px] font-semibold text-[#526C68] lg:flex"
              aria-label="MediSathi supports English and Hindi"
            >
              <Globe className="mr-1 ml-2 size-3.5 text-[#78918D]" />
              <span>English · हिन्दी</span>
            </div>

            {/* Primary CTA */}
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-[#FFFFFF] shadow-md shadow-[#0F766E]/20 transition hover:bg-[#115E59] active:scale-[0.98] sm:inline-flex"
            >
              <Mic className="size-3.5 text-[#5EEAD4]" />
              Talk to MediSathi
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-[rgba(15,118,110,0.12)] bg-[#EEF7F5] p-2 text-[#526C68] transition hover:text-[#123532] md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <nav className="mt-3 space-y-2 border-t border-[rgba(15,118,110,0.12)] px-4 pt-3 pb-2 md:hidden">
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
                      : 'text-[#526C68] hover:bg-[#EEF7F5] hover:text-[#123532]'
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? 'text-[#5EEAD4]' : 'text-[#78918D]'}`} />
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
