export function filterInPlace<T>(array: T[], condition: (value: T, index?: number, array?: T[]) => boolean) {
  let i = 0, j = 0;

  while (i < array.length) {
    const val = array[i];
    if (condition(val, i, array)) array[j++] = val;
    i++;
  }

  array.length = j;
  return array;
}