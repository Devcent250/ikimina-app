import { useMemo } from "react";

export default function useSettings() {
  const settings: any = useMemo(() => {
    return {};
  }, []);

  return {
    settings: settings,
  };
}
