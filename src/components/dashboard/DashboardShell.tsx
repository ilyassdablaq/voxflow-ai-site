import { ReactNode, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bot,
  CircleHelp,
  CreditCard,
  Database,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Menu,
  Mic,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PlanBadge } from "@/components/PlanBadge";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DashboardShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

const navItems = [
  { to: "/dashboard", label: "Conversations", icon: LayoutDashboard },
  { to: "/dashboard/data-sources", label: "Data Sources", icon: Database },
  { to: "/dashboard/workflows", label: "Workflows", icon: GitBranch },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/voice", label: "Voice Controls", icon: Bot },
  { to: "/dashboard/developer", label: "Developer", icon: KeyRound },
  { to: "/dashboard/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/dashboard/integrations", label: "Integrations", icon: LinkIcon },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/faq", label: "Help / FAQ", icon: CircleHelp },
];

export function DashboardShell({ title, description, children }: DashboardShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeNavLabel =
    navItems.find((item) =>
      item.to === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.to),
    )?.label ?? "Dashboard";

  const handleLogout = () => {
    logout();
    navigate("/");
    toast({ title: "Logged out", description: "See you soon!" });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-72 border-r border-border bg-card hidden md:flex md:flex-col">
        <div className="px-6 py-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary" />
            </div>
            <h1 className="font-heading font-bold text-xl text-foreground">
              Vox<span className="text-primary">AI</span>
            </h1>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="px-4 sm:px-6 lg:px-8 py-5 flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden w-11 h-11 shrink-0" aria-label="Open dashboard menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
                  <SheetHeader className="p-5 border-b border-border text-left">
                    <SheetTitle>Dashboard Menu</SheetTitle>
                    <SheetDescription>{activeNavLabel}</SheetDescription>
                  </SheetHeader>
                  <div className="px-4 py-4 border-b border-border">
                    <PlanBadge />
                  </div>
                  <nav className="p-3 space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <SheetClose asChild key={item.to}>
                          <NavLink
                            to={item.to}
                            end={item.to === "/dashboard"}
                            className={({ isActive }) =>
                              `flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              }`
                            }
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </NavLink>
                        </SheetClose>
                      );
                    })}
                  </nav>
                  <div className="p-3 border-t border-border mt-auto">
                    <Button
                      variant="outline"
                      className="w-full min-h-11 justify-start"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>

            <div className="hidden md:block">
              <PlanBadge />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-8">{children}</main>
        <footer className="border-t border-border bg-card/70 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground">
            <p>VoxAI Dashboard</p>
            <p>All core features available on desktop and mobile.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
