import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogOut, Menu, X } from "lucide-react";

import Brand from "./Brand";
import { useEntrance } from "../animations/useEntrance.js";
import { useAuth } from "../features/auth/hooks/useAuth";

const SECTIONS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#report", label: "The report" },
  { href: "#inside", label: "What's inside" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const mobileMenuRef = useRef(null);

  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  useEntrance(mobileMenuRef, {
    enabled: menuOpen,
    selector: "[data-menu-item]",
    staggerMs: 35,
    duration: 240,
    y: -4,
  });

  useEffect(() => {
    if (!menuOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  async function onLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await handleLogout();
      localStorage.setItem("isLoggedIn", "false");
      navigate("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <header className="nav">
      <div className="shell nav-inner">
        <Brand />

        <nav aria-label="Primary" className="nav-links hidden lg:flex">
          {SECTIONS.map((section) => (
            <a key={section.href} href={section.href} className="nav-link">
              {section.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions hidden lg:flex">
          {user ? (
            <>
              <Link to="/app" className="btn btn-primary btn-sm">
                Open workspace
              </Link>

              <button
                type="button"
                onClick={onLogout}
                disabled={loggingOut}
                className="btn btn-ghost btn-sm"
              >
                <LogOut size={15} aria-hidden="true" />
                {loggingOut ? "Signing out" : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>

              <Link to="/register" className="btn btn-primary btn-sm">
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          className="nav-toggle lg:hidden"
        >
          {menuOpen ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
        </button>
      </div>

      {menuOpen ? (
        <div id="mobile-navigation" ref={mobileMenuRef} className="lg:hidden">
          <nav aria-label="Mobile primary" className="mobile-nav">
            {SECTIONS.map((section) => (
              <a
                key={section.href}
                href={section.href}
                data-menu-item
                onClick={() => setMenuOpen(false)}
                className="mobile-nav-link"
              >
                {section.label}
              </a>
            ))}

            <div data-menu-item className="mt-6 flex flex-col gap-3">
              {user ? (
                <>
                  <p className="text-sm text-secondary">
                    Signed in as{" "}
                    <span className="font-medium text-ink">{user.username}</span>
                  </p>

                  <Link
                    to="/app"
                    onClick={() => setMenuOpen(false)}
                    className="btn btn-primary btn-block"
                  >
                    Open workspace
                  </Link>

                  <button
                    type="button"
                    onClick={onLogout}
                    disabled={loggingOut}
                    className="btn btn-secondary btn-block"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    {loggingOut ? "Signing out" : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="btn btn-secondary btn-block"
                  >
                    Sign in
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="btn btn-primary btn-block"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
