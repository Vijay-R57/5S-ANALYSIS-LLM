import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, History, ChevronDown, ClipboardCheck, GitCompare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo-new.png";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface NavSubItem {
  to: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  label: string;
  to?: string;
  subItems?: NavSubItem[];
}

const navItems: NavItem[] = [
  { to: "/", label: "Home" },
  {
    label: "5S Modules",
    subItems: [
      {
        to: "/5s-audit",
        label: "5S Audit",
        description: "AI-powered 5S workplace organization analysis",
        icon: ClipboardCheck,
      },
      {
        to: "/5s-comparison",
        label: "5S Comparison",
        description: "Compare workplace audits & track improvements",
        icon: GitCompare,
      },
    ],
  },
  { to: "/audit", label: "Audit" },
  { to: "/lean-maintenance", label: "Lean Maintenance" },
  { to: "/history", label: "History" },
  { to: "/about", label: "About" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<string | null>("5S Modules");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { employee, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Grace timer for desktop hover (prevents dropdown from vanishing when moving mouse across gaps)
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 250);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Check if a subItem is active (supports /5s-audit and legacy /analysis)
  const isSubItemActive = (subPath: string) => {
    if (location.pathname === subPath) return true;
    if (subPath === "/5s-audit" && location.pathname === "/analysis") return true;
    return false;
  };

  // Check if parent nav item is active
  const isNavItemActive = (item: NavItem) => {
    if (item.to) {
      return location.pathname === item.to;
    }
    if (item.subItems) {
      return item.subItems.some((subItem) => isSubItemActive(subItem.to));
    }
    return false;
  };

  // Close desktop dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Arcolab" className="h-20 sm:h-28 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const active = isNavItemActive(item);

              if (item.subItems) {
                return (
                  <DropdownMenu
                    key={item.label}
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                  >
                    <div
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      className="relative inline-block py-2"
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                            active ? "text-primary font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          <span>{item.label}</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              dropdownOpen ? "rotate-180 text-primary" : ""
                            }`}
                          />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="start"
                        sideOffset={8}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        className="w-64 rounded-xl border border-border bg-popover/95 p-2 shadow-lg backdrop-blur-md z-50 before:absolute before:-top-3 before:left-0 before:w-full before:h-3"
                      >
                        {item.subItems.map((subItem) => {
                          const subActive = isSubItemActive(subItem.to);
                          const IconComponent = subItem.icon;

                          return (
                            <DropdownMenuItem
                              key={subItem.to}
                              asChild
                              className="p-0 focus:bg-transparent focus:text-foreground"
                            >
                              <Link
                                to={subItem.to}
                                onClick={() => setDropdownOpen(false)}
                                className={`flex items-start gap-3 p-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                                  subActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                              >
                                {IconComponent && (
                                  <IconComponent
                                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                                      subActive ? "text-primary" : "text-muted-foreground"
                                    }`}
                                  />
                                )}
                                <div>
                                  <div className="font-medium text-sm leading-none mb-1">
                                    {subItem.label}
                                  </div>
                                  {subItem.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {subItem.description}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </div>
                  </DropdownMenu>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to!}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    active ? "text-primary font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{employee?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/select-office"
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                Employee Login
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-border pt-4 space-y-3">
            {navItems.map((item) => {
              const active = isNavItemActive(item);

              if (item.subItems) {
                const isOpen = mobileDropdownOpen === item.label;

                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        setMobileDropdownOpen(isOpen ? null : item.label)
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 text-base font-medium rounded-md transition-colors ${
                        active
                          ? "text-primary bg-primary/5 font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="pl-4 space-y-1">
                        {item.subItems.map((subItem) => {
                          const subActive = isSubItemActive(subItem.to);
                          const IconComponent = subItem.icon;

                          return (
                            <Link
                              key={subItem.to}
                              to={subItem.to}
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                subActive
                                  ? "text-primary bg-primary/10 font-semibold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                              }`}
                            >
                              {IconComponent && (
                                <IconComponent className="h-4 w-4 shrink-0" />
                              )}
                              <span>{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to!}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    active
                      ? "text-primary bg-primary/5 font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.to === "/history" && <History className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="mx-3 flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-3 py-2 hover:bg-accent transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <div>
                    <span className="font-medium text-foreground block">{employee?.name}</span>
                    <span className="text-xs">{employee?.department}</span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="block mx-3 w-[calc(100%-1.5rem)] text-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/select-office"
                onClick={() => setMobileOpen(false)}
                className="block mx-3 text-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Employee Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
