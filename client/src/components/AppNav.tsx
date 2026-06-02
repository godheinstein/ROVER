import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Search, GitCompare, SlidersHorizontal, Settings, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Search", icon: Search },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/matrix", label: "Evaluation Matrix", icon: SlidersHorizontal },
];

export default function AppNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const isAdmin = user?.role === "admin";

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
            <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">{APP_TITLE}</h1>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button variant={active ? "default" : "ghost"} size="sm">
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin">
              <Button variant={location === "/admin" ? "default" : "outline"} size="sm">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          )}
          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="sm">Login</Button>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
