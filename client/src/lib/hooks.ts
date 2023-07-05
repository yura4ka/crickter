import { useContext } from "react";
import { IThemeContext, ThemeContext } from "./ThemeContext";

export const useTheme = () => useContext<IThemeContext>(ThemeContext);
