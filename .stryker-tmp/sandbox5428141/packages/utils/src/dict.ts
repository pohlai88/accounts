// @ts-nocheck
// Typed dictionaries / builders for safe indexing & reduces.

export const typedFromEntries = <K extends string, V>(
    entries: Iterable<readonly [K, V]>
): Record<K, V> => Object.fromEntries(entries) as Record<K, V>;

export const groupBy = <T, K extends string>(
    items: readonly T[],
    keyOf: (t: T) => K
): Record<K, T[]> => {
    const out = {} as Record<K, T[]>;
    for (const it of items) {
        const k = keyOf(it);
        (out[k] ||= []).push(it);
    }
    return out;
};

export type ById<T extends { id: string }> = Record<string, T>;
export const byId = <T extends { id: string }>(items: readonly T[]) =>
    typedFromEntries(items.map(i => [i.id, i] as const));

export function typedKeys<T extends object>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>;
}

export function ensureRecord(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === "object" && !Array.isArray(v);
}
