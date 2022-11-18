export function clamp<T>(a: T, min: T, max: T) {
  if (a < min) return min;
  if (a > max) return max;
  return a;
}
