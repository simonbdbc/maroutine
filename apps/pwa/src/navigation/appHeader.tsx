import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppHeaderControls = {
  left?: ReactNode | null;
  right?: ReactNode | null;
  secondary?: ReactNode | null;
  title?: string | null;
};

type AppHeaderControlsState = {
  left: ReactNode | null;
  right: ReactNode | null;
  secondary: ReactNode | null;
  title: string | null;
};

type AppHeaderControlsContextValue = AppHeaderControlsState & {
  setHeaderControls: (controls: AppHeaderControls) => void;
  resetHeaderControls: () => void;
};

const EMPTY_CONTROLS: AppHeaderControlsState = {
  left: null,
  right: null,
  secondary: null,
  title: null,
};

const AppHeaderControlsContext = createContext<AppHeaderControlsContextValue | null>(null);

export function AppHeaderControlsProvider({ children }: { children: ReactNode }) {
  const [controls, setControls] = useState<AppHeaderControlsState>(EMPTY_CONTROLS);

  const setHeaderControls = useCallback((nextControls: AppHeaderControls) => {
    setControls({
      left: nextControls.left ?? null,
      right: nextControls.right ?? null,
      secondary: nextControls.secondary ?? null,
      title: nextControls.title ?? null,
    });
  }, []);

  const resetHeaderControls = useCallback(() => {
    setControls(EMPTY_CONTROLS);
  }, []);

  const value = useMemo(
    () => ({
      ...controls,
      setHeaderControls,
      resetHeaderControls,
    }),
    [controls, resetHeaderControls, setHeaderControls],
  );

  return (
    <AppHeaderControlsContext.Provider value={value}>
      {children}
    </AppHeaderControlsContext.Provider>
  );
}

function useAppHeaderControlsContext() {
  const context = useContext(AppHeaderControlsContext);
  if (!context) {
    throw new Error("useAppHeaderControls must be used inside AppHeaderControlsProvider");
  }
  return context;
}

export function useAppHeaderControlsState() {
  return useAppHeaderControlsContext();
}

export function useAppHeaderControls(controls: AppHeaderControls) {
  const { setHeaderControls, resetHeaderControls } = useAppHeaderControlsContext();

  useEffect(() => {
    setHeaderControls(controls);
    return resetHeaderControls;
  }, [controls.left, controls.right, controls.secondary, controls.title, resetHeaderControls, setHeaderControls]);
}
