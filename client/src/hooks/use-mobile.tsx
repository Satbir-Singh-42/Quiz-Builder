import * as React from "react";
import { BREAKPOINTS } from "@shared/constants";

const MOBILE_BREAKPOINT = BREAKPOINTS.MOBILE;

interface MobileHookResult {
  isMobile: boolean;
}

export function useMobile(): MobileHookResult {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return { isMobile };
}
