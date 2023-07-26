import { RefObject, useContext, useEffect, useState } from "react";
import { IThemeContext, ThemeContext } from "./ThemeContext";

export const useTheme = () => useContext<IThemeContext>(ThemeContext);

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useInfiniteScroll(target: RefObject<Element>, nextPage: () => void) {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        nextPage();
      }
    }, {});

    if (target.current) observer.observe(target.current);

    return () => observer.disconnect();
  }, [target, nextPage]);
}
