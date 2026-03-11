import { createContext, useContext } from "react";

const ShellContext = createContext({ openMenu: () => {} });

export function ShellProvider({ value, children }) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  return useContext(ShellContext);
}
