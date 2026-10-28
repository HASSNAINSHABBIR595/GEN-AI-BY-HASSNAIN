import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 4000;

function useToast(duration = DEFAULT_DURATION) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  function showToast(message, type = "success") {
    window.clearTimeout(timerRef.current);

    setToast({ message, type });

    timerRef.current = window.setTimeout(() => {
      setToast(null);
    }, duration);
  }

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  return { toast, showToast };
}

export default useToast;
