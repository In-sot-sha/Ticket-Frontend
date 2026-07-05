export const downloadCSV = (headers: string[], rows: any[][], filename: string) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(val => {
        const str = val === null || val === undefined ? '' : String(val);
        // Escape quotes
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
