import { useRef } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

import Brand from "./Brand";
import { useEntrance } from "../animations/useEntrance.js";

import libraryWarm from "../assets/images/library-warm.jpg";

function AuthShell({ title, subtitle, children, footer }) {
  const cardAreaRef = useRef(null);
  const asideRef = useRef(null);

  useEntrance(cardAreaRef, { staggerMs: 60, duration: 420, y: 12 });
  useEntrance(asideRef, { staggerMs: 70, duration: 460, y: 12 });

  return (
    <div className="auth-shell">
      <aside ref={asideRef} className="auth-aside">
        <div className="flex items-start justify-between gap-6">
          <div data-enter>
            <Brand inverse />
          </div>

          <Link
            to="/"
            className="hidden items-center gap-2 text-[15px] text-field-muted transition-colors hover:text-field-ink sm:inline-flex"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Home
          </Link>
        </div>

        <div className="max-w-[34ch]" data-enter>
          <h2 className="text-[clamp(40px,5.2vw,72px)] font-semibold leading-[1.02] tracking-[-0.04em] text-field-ink">
            Walk in ready.
          </h2>

          <p className="mt-5 max-w-[30ch] text-[18px] leading-6 text-field-muted">
            Your resume and the role, read together. The score, the gaps, the
            questions and the plan.
          </p>
        </div>

        <figure className="hidden lg:block" data-enter>
          <div className="h-[190px] overflow-hidden">
            <img
              src={libraryWarm}
              alt="A miniature eighteenth-century library in warm wood, with a chandelier and a writing table."
              width="1920"
              height="1627"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover grayscale"
            />
          </div>

          <figcaption className="mt-3 text-[13px] leading-5 text-field-muted">
            Miniature library room, c. 1937. Public domain.
          </figcaption>
        </figure>
      </aside>

      <main className="auth-main">
        <div className="mx-auto w-full max-w-[430px] lg:mx-0">
          <div ref={cardAreaRef}>
            <h1
              className="text-[clamp(34px,3.4vw,42px)] font-semibold leading-[1.08] tracking-[-0.035em] text-ink"
              data-enter
            >
              {title}
            </h1>

            <p className="mt-3 max-w-[38ch] text-[16px] leading-6 text-secondary" data-enter>
              {subtitle}
            </p>

            <div className="mt-8" data-enter>
              {children}
            </div>

            {footer ? (
              <div className="mt-7 text-[15px] text-secondary" data-enter>{footer}</div>
            ) : null}
          </div>

          <p className="mt-12 text-[13px] text-secondary" data-enter>
            © {new Date().getFullYear()} GEN+AI. Preparation, not prediction.
          </p>
        </div>
      </main>
    </div>
  );
}

export default AuthShell;




