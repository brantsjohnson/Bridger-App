import React from 'react';

export type ThemeMode = 'light' | 'dark';

type ThemeValue = {theme: ThemeMode;setTheme: (t: ThemeMode) => void;toggle: () => void;};

const ThemeContext = React.createContext<ThemeValue>({
  theme: 'light',
  setTheme: () => {},
  toggle: () => {}
});

/**
 * One switch for the whole product. Flips the `dark` class on the document,
 * which retargets every surface token in index.css — accents stay vivid.
 */
export function ThemeProvider({
  children,
  initial = 'light'



}: {children: React.ReactNode;initial?: ThemeMode;}) {
  const [theme, setTheme] = React.useState<ThemeMode>(initial);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  const value = React.useMemo<ThemeValue>(
    () => ({
      theme,
      setTheme,
      toggle: () => setTheme((t) => t === 'dark' ? 'light' : 'dark')
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return React.useContext(ThemeContext);
}