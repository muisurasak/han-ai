'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Status' },
  { href: '/config', label: 'Config' },
  { href: '/projects', label: 'Projects' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 border-b border-zinc-800 px-6 py-3 bg-zinc-950">
      <span className="mr-6 font-bold text-cyan-400 text-sm tracking-widest">HAN AI</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            pathname === l.href
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
