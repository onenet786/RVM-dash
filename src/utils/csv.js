// Shared CSV cell formatter: quotes every cell, escapes embedded quotes and
// neutralizes spreadsheet formula injection (cells starting with = + - @ TAB CR).
export function csvCell(value) {
  let str;
  if (value === null || value === undefined) str = '';
  else if (typeof value === 'object') str = JSON.stringify(value);
  else str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  return `"${str.replace(/"/g, '""')}"`;
}
