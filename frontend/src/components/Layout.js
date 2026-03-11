import React, { useMemo, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  ArrowLeftRight, 
  BarChart3, 
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Repeat,
  ArrowDownToLine,
  ArrowUpToLine,
  FolderTree
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const routeKey = useMemo(() => location.pathname, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Wallet, label: 'Contas', path: '/accounts' },
    { icon: CreditCard, label: 'Cartões', path: '/cards' },
    { icon: FolderTree, label: 'Categorias', path: '/categories' },
    { icon: ArrowLeftRight, label: 'Transações', path: '/transactions' },
    { icon: Repeat, label: 'Recorrentes', path: '/recurring' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports' },
  ];

  return (
    <div className="min-h-screen bg-background app-shell">
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen w-64 border-r border-border/70 bg-card/85 backdrop-blur-xl transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Wallet className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>FinControl</span>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.path.slice(1)}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground hover:translate-x-1"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/transactions', { state: { quickAction: 'expense' } });
                  setSidebarOpen(false);
                }}
              >
                <ArrowDownToLine className="mr-2 h-4 w-4 text-error" />
                Nova Despesa
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/transactions', { state: { quickAction: 'income' } });
                  setSidebarOpen(false);
                }}
              >
                <ArrowUpToLine className="mr-2 h-4 w-4 text-success" />
                Nova Receita
              </Button>
            </div>
          </nav>

          {/* User Info & Actions */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleTheme}
                data-testid="theme-toggle"
                className="flex-1"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleLogout}
                data-testid="logout-button"
                className="flex-1"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between p-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-button"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              <span className="font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>FinControl</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8 lg:p-10">
          <div key={routeKey} className="route-fade-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

