export function generateSKU(type: string): string {
  const typeCode = type.trim().substring(0, 3).toUpperCase();
  const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  return `${typeCode}-${dateCode}-${randomCode}`;
}
