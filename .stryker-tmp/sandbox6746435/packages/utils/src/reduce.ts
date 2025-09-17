// @ts-nocheck
export const reduceTyped = <A, T>(
    arr: readonly T[],
    seed: A,
    step: (acc: A, t: T, i: number) => A
): A => arr.reduce<A>(step, seed);
