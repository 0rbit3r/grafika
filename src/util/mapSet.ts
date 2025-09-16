export function* mapSet<T, U>(set: Set<T>, fn: (x: T) => U) {
  for (const item of set) yield fn(item);
}