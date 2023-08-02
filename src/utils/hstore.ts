export function toHStore(obj: object) {
  const hstore = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      hstore.push(`"${key}"=>NULL`);
    } else {
      hstore.push(`"${key}"=>"${value}"`);
    }
  }
  return hstore.join(',');
}
