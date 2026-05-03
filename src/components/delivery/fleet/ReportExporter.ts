import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DriverReport {
  name: string;
  todayDeliveries: number;
  avgTime: number;
  todayRevenue: number;
  fulfillment: number;
  performance: 'excellent' | 'good' | 'warning';
  totalDeliveries: number;
  releasedCount: number;
}

interface ReportData {
  driverReports: DriverReport[];
  totalDeliveriesToday: number;
  totalRevenueToday: number;
  suggestion: string;
  generatedAt: Date;
}

function formatCOP(val: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
}

function buildReportHTML(data: ReportData, store: any): string {
  const dateStr = format(data.generatedAt, "dd 'de' MMMM yyyy • HH:mm", { locale: es });
  
  const driverRows = data.driverReports.map(d => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:700;font-size:13px;">${d.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:800;font-size:16px;">${d.todayDeliveries}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${d.avgTime > 0 ? d.avgTime + ' min' : 'N/A'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700;color:#059669;">${formatCOP(d.todayRevenue)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">
        <span style="background:${d.fulfillment >= 90 ? '#dcfce7' : d.fulfillment >= 70 ? '#fef9c3' : '#fee2e2'};color:${d.fulfillment >= 90 ? '#166534' : d.fulfillment >= 70 ? '#854d0e' : '#991b1b'};padding:2px 10px;border-radius:999px;font-weight:800;font-size:11px;">${d.fulfillment}%</span>
      </td>
    </tr>
  `).join('');

  return `
    <div style="font-family:'Segoe UI',Roboto,Arial,sans-serif;max-width:700px;margin:0 auto;background:#fff;padding:40px;color:#0f172a;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px 0;">Informe Evolutivo</h1>
        <p style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:3px;">${store?.name || 'Mi Negocio'} • ${dateStr}</p>
      </div>

      <div style="display:flex;gap:20px;margin-bottom:32px;">
        <div style="flex:1;background:#0f172a;border-radius:20px;padding:24px;text-align:center;">
          <p style="color:#7dd3fc;font-size:32px;font-weight:900;margin:0;">${data.totalDeliveriesToday}</p>
          <p style="color:#64748b;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Entregas del día</p>
        </div>
        <div style="flex:1;background:#0f172a;border-radius:20px;padding:24px;text-align:center;">
          <p style="color:#34d399;font-size:24px;font-weight:900;margin:0;">${formatCOP(data.totalRevenueToday)}</p>
          <p style="color:#64748b;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Ingresos del día</p>
        </div>
      </div>

      <h2 style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#94a3b8;margin-bottom:12px;">Desempeño por Repartidor</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
        <thead>
          <tr style="border-bottom:2px solid #e2e8f0;">
            <th style="padding:8px 12px;text-align:left;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Nombre</th>
            <th style="padding:8px 12px;text-align:center;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Entregas</th>
            <th style="padding:8px 12px;text-align:center;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Tiempo</th>
            <th style="padding:8px 12px;text-align:center;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Ingresos</th>
            <th style="padding:8px 12px;text-align:center;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Cumplimiento</th>
          </tr>
        </thead>
        <tbody>${driverRows}</tbody>
      </table>

      <div style="background:#f0fdf4;border-radius:16px;padding:20px;border:1px solid #bbf7d0;">
        <p style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:3px;color:#16a34a;margin:0 0 6px 0;">💡 Sugerencia del día</p>
        <p style="font-size:12px;color:#166534;font-weight:600;margin:0;line-height:1.6;">${data.suggestion}</p>
      </div>

      <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9;">
        <p style="font-size:9px;color:#cbd5e1;font-weight:700;">Generado automáticamente por Yapido • ${dateStr}</p>
      </div>
    </div>
  `;
}

export async function exportReportToPDF(data: ReportData, store: any): Promise<void> {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');

    // Create a temporary container with the report HTML
    const container = document.createElement('div');
    container.innerHTML = buildReportHTML(data, store);
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '700px';
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#ffffff',
      logging: false,
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`informe-flota-${format(data.generatedAt, 'yyyy-MM-dd')}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    // Fallback: open as printable HTML
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head><title>Informe de Flota</title></head>
        <body style="margin:0;padding:20px;">${buildReportHTML(data, store)}</body></html>
      `);
      win.document.close();
      win.print();
    }
  }
}

export function exportReportToWord(data: ReportData, store: any): void {
  const html = buildReportHTML(data, store);
  const blob = new Blob([`
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>Informe Evolutivo</title></head>
    <body>${html}</body></html>
  `], { type: 'application/msword' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `informe-flota-${format(data.generatedAt, 'yyyy-MM-dd')}.doc`;
  link.click();
  URL.revokeObjectURL(url);
}
