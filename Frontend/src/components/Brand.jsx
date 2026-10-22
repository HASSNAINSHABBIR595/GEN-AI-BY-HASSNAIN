import { Link } from "react-router";

function Brand({
  to = "/",
  showTagline = false,
  inverse = false,
  className = "",
}) {
  return (
    <Link
      to={to}
      aria-label="GEN+AI home"
      className={`group inline-flex flex-col gap-1.5 ${className}`}
    >
      <span className={`wordmark ${inverse ? "text-field-ink" : ""}`}>
        GEN<span className="wordmark-plus">+</span>AI
      </span>

      {showTagline ? (
        <span
          className={`text-[13px] leading-none ${
            inverse ? "text-field-muted" : "text-secondary"
          }`}
        >
          Interview intelligence
        </span>
      ) : null}
    </Link>
  );
}

export default Brand;
