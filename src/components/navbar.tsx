import { Link, useLocation } from 'react-router-dom';
import { Calendar, LineChart, Home, User, Baby, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const location = useLocation();
  const { isAuthenticated, maritalStatus } = useAuth();
  
  // Don't show navbar on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }
  
  // Only show navbar if authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/calendar', label: 'Period', icon: Calendar },
    { path: '/symptoms', label: 'Symptoms', icon: Activity },
    // Conditionally render Pregnancy link based on marital status
    ...(maritalStatus === 'married' ? [{ path: '/pregnancy', label: 'Pregnancy', icon: Baby }] : []),
    { path: '/insights', label: 'Insights', icon: LineChart },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-lg">
      <div className="container mx-auto h-16 flex items-center justify-around px-2 sm:px-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-xs font-medium transition-colors px-1 sm:px-2",
              location.pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}
          >
            <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden xs:inline">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
