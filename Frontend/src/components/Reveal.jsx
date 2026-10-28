import { useRef } from "react";

import { useScrollReveal } from "../animations/useScrollReveal.js";

function Reveal({
  as: Tag = "div",
  selector = "[data-reveal]",
  y,
  duration,
  staggerMs,
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);

  useScrollReveal(ref, { selector, y, duration, staggerMs });

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}

export default Reveal;
