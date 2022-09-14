export function shortenRarity(v: string) {
  return v
    .split('_')
    .map((a) => a[0])
    .join('');
}

export function localeCompare(a: any, b: any) {
  if (typeof a !== 'string') a = '';
  if (typeof b !== 'string') b = '';
  return (a as string).localeCompare(b as string);
}
