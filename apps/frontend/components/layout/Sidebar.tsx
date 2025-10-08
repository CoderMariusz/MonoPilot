'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Factory, 
  Warehouse, 
  ScanLine, 
  Settings, 
  Wrench 
} from 'lucide-react';

const menuItems = [
  { href: '/planning', label: 'Planning', icon: ClipboardList },
  { href: '/production', label: 'Production', icon: Factory },
  { href: '/warehouse', label: 'Warehouse', icon: Warehouse },
  { href: '/scanner', label: 'Scanner', icon: ScanLine },
  { href: '/technical', label: 'Technical', icon: Wrench },
  { href: '/admin', label: 'Admin', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Forza MES</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors
                ${isActive 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
