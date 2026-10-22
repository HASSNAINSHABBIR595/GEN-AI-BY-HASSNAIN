import { Link } from "react-router";

import Brand from "./Brand";

const YEAR = new Date().getFullYear();

function Footer() {
  return (
    <footer className="footer">
      <div className="shell pt-20 pb-8 sm:pt-24">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Brand showTagline inverse />

            <p className="mt-6 max-w-sm text-[18px] leading-7 text-field-muted">
              A resume, a job description, and an honest report on how ready you
              are for the room.
            </p>
          </div>

          <div className="md:col-span-2 md:col-start-7">
            <h2 className="text-[15px] font-semibold text-field-ink">Product</h2>

            <ul className="mt-4 space-y-2.5">
              {[
                { href: "#how-it-works", label: "How it works" },
                { href: "#report", label: "The report" },
                { href: "#inside", label: "What's inside" },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-[15px] text-field-muted transition-colors hover:text-field-ink"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-[15px] font-semibold text-field-ink">Account</h2>

            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/login"
                  className="text-[15px] text-field-muted transition-colors hover:text-field-ink"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-[15px] text-field-muted transition-colors hover:text-field-ink"
                >
                  Create account
                </Link>
              </li>
              <li>
                <Link
                  to="/app/report-studio"
                  className="text-[15px] text-field-muted transition-colors hover:text-field-ink"
                >
                  Report studio
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-[15px] font-semibold text-field-ink">The rooms</h2>

            <p className="mt-4 text-[15px] leading-6 text-field-muted">
              Our photographs are miniature library rooms by Narcissa Niblack
              Thorne, c. 1937, held by the Art Institute of Chicago and in the
              public domain.
            </p>
          </div>
        </div>

        <div className="mt-24">
          <Link
            to="/"
            aria-label="GEN+AI home"
            className="footer-wordmark"
            data-footer-wordmark
          >
            GEN+AI
          </Link>

          <div className="mt-8 flex flex-col gap-3 text-[13px] leading-5 text-field-muted sm:flex-row sm:items-end sm:justify-between">
            <p>© {YEAR} GEN+AI. All rights reserved.</p>
            <p>
              Reports are preparation material, not a prediction of a hiring
              decision.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

