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
  Wrench,
  FileText,
  ShieldAlert,
  Lightbulb
} from 'lucide-react';

const menuItems = [
  { href: '/npd', label: 'NPD', icon: Lightbulb },
  { href: '/planning', label: 'Planning', icon: ClipboardList },
  { href: '/production', label: 'Production', icon: Factory },
  { href: '/warehouse', label: 'Warehouse', icon: Warehouse },
  { href: '/scanner', label: 'Scanner', icon: ScanLine },
  { 
    href: '/technical', 
    label: 'Technical', 
    icon: Wrench,
    submenu: [
      { href: '/technical/bom', label: 'BOM', icon: FileText },
    ]
  },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/admin', label: 'Admin', icon: ShieldAlert },
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
            <div key={item.href}>
              <Link
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
              
              {item.submenu && isActive && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.submenu.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = pathname === subItem.href;
                    
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`
                          flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors
                          ${isSubActive 
                            ? 'bg-slate-700 text-white' 
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                          }
                        `}
                      >
                        <SubIcon className="w-4 h-4" />
                        <span>{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
