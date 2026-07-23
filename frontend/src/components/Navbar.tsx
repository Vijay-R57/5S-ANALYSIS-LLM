import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, History, ChevronDown, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo-new.png";

interface NavChildLink {
  to: string;
  label: string;
  badge?: string;
  description?: string;
}

interface NavItem {
  label: string;
  to?: string;
  children?: NavChildLink[];
}

const navLinks: NavItem[] = [
  { to: "/", label: "Home" },
  {
    label: "5S Modules",
    children: [
      {
        to: "/5s-audit",
        label: "5S Audit",
        description: "Perform 5S workplace audit & scoring",
      },
      {
        to: "/5s-comparison",
        label: "5S Comparison",
        description: "Compare audits & track Before vs After",
      },
    ],
  },
  { to: "/history", label: "History" },
  { to: "/about", label: "About" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileModulesOpen, setMobileModulesOpen] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { employee, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helper to determine if a route is active
  const isAuditRoute = (pathname: string) => pathname === "/5s-audit" || pathname === "/analysis";
  const isComparisonRoute = (pathname: string) => pathname === "/5s-comparison";

  const isChildActive = (childTo: string) => {
    if (childTo === "/5s-audit") return isAuditRoute(location.pathname);
    if (childTo === "/5s-comparison") return isComparisonRoute(location.pathname);
    return location.pathname === childTo;
  };

  const isParentActive = (item: NavItem) => {
    if (item.to) return location.pathname === item.to;
    if (item.children) {
      return item.children.some((child) => isChildActive(child.to));
    }
    return false;
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDesktopDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDesktopDropdownOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDesktopDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDesktopDropdownOpen(false);
    }, 150);
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Arcolab" className="h-20 sm:h-28 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              if (link.children) {
                const parentActive = isParentActive(link);
                return (
                  <div
                    key={link.label}
                    ref={dropdownRef}
                    className="relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => setDesktopDropdownOpen((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                        parentActive ? "text-primary font-semibold" : "text-muted-foreground"
                      }`}
                      aria-expanded={desktopDropdownOpen}
                      aria-haspopup="true"
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          desktopDropdownOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {desktopDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-64 rounded-xl bg-card border border-border shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 border-b border-border/50 mb-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Select Module
                          </p>
                        </div>
                        {link.children.map((child) => {
                          const childActive = isChildActive(child.to);
                          return (
                            <Link
                              key={child.to}
                              to={child.to}
                              onClick={() => setDesktopDropdownOpen(false)}
                              className={`flex items-start justify-between px-3 py-2.5 mx-1 rounded-lg text-sm transition-colors ${
                                childActive
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-foreground hover:bg-accent hover:text-primary"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{child.label}</span>
                                  {child.badge && (
                                    <span className="bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.2 rounded border border-primary/20">
                                      {child.badge}
                                    </span>
                                  )}
                                </div>
                                {child.description && (
                                  <p className="text-[11px] text-muted-foreground font-normal line-clamp-1">
                                    {child.description}
                                  </p>
                                )}
                              </div>
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
                  key={link.to}
                  to={link.to!}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isParentActive(link) ? "text-primary font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
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
            {navLinks.map((link) => {
              if (link.children) {
                const parentActive = isParentActive(link);
                return (
                  <div key={link.label} className="space-y-1">
                    <button
                      onClick={() => setMobileModulesOpen(!mobileModulesOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-base font-medium rounded-md transition-colors ${
                        parentActive
                          ? "text-primary bg-primary/5 font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {link.label}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${mobileModulesOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {mobileModulesOpen && (
                      <div className="pl-6 space-y-1 border-l-2 border-primary/20 ml-4 py-1">
                        {link.children.map((child) => {
                          const childActive = isChildActive(child.to);
                          return (
                            <Link
                              key={child.to}
                              to={child.to}
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                childActive
                                  ? "text-primary bg-primary/10 font-semibold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                              }`}
                            >
                              <span>{child.label}</span>
                              {child.badge && (
                                <span className="bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.2 rounded border border-primary/20">
                                  {child.badge}
                                </span>
                              )}
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
                  key={link.to}
                  to={link.to!}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isParentActive(link)
                      ? "text-primary bg-primary/5 font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.to === "/history" && <History className="h-4 w-4" />}
                  {link.label}
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
