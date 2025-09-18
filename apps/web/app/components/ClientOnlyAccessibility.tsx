"use client";

import { useAccessibility } from "@aibos/ui";
import { ReactNode } from "react";

interface ClientOnlyAccessibilityProps {
    children: (accessibility: { preferences: any; updatePreference: (key: any, value: any) => void }) => ReactNode;
}

export function ClientOnlyAccessibility({ children }: ClientOnlyAccessibilityProps) {
    const { preferences, updatePreference } = useAccessibility();

    return <>{children({ preferences, updatePreference })}</>;
}
