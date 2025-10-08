import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        <main className="pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
