"use client";

import { Bar, BarChart, XAxis, YAxis, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChallengeChartProps {
  orders: any[] | null;
  commissionRate?: number;
  isAdmin?: boolean;
}

/**
 * ChallengeChart - Motor de Visualización de Transacciones Reales.
 * Refleja el flujo de caja diario en pesos colombianos.
 */
export function ChallengeChart({ orders, commissionRate = 0.20, isAdmin = false }: ChallengeChartProps) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start, end }).map(date => {
    const dayName = format(date, 'EEE', { locale: es }).toUpperCase();
    
    // Filtrado de órdenes con validación estricta de fecha
    const dayOrders = orders?.filter(o => {
      const ts = o.completedAt || o.deliveredAt || o.createdAt;
      const orderDate = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);
      if (!orderDate) return false;
      return isSameDay(orderDate, date);
    }) || [];

    // SUMA DE VALORES DE TRANSACCIÓN REALES
    const montoBruto = dayOrders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
    const montoComision = Math.round(montoBruto * commissionRate);
    const montoNegocio = montoBruto - montoComision;

    return {
      name: dayName,
      montoComision,
      montoNegocio,
      montoBruto
    };
  });

  const chartConfig: ChartConfig = {
    montoComision: { label: "Comisión", color: "#10b981" },
    montoNegocio: { label: "Negocio", color: "#3b82f6" },
  };

  const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  return (
    <div className="w-full space-y-6">
      {/* Gráfica de Ganancias del Repartidor */}
      <div className="w-full">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tus Ganancias (Repartidor)</h3>
        <div className="h-[140px] w-full">
          <ChartContainer config={{ montoComision: { label: "Ganancia", color: "#10b981" } }}>
            <BarChart data={days}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border-none font-black italic text-[10px] animate-in zoom-in duration-200 flex flex-col">
                        <span className="text-emerald-400 mb-1">Ganancia:</span>
                        <span className="text-base">{currencyFormatter.format(payload[0].payload.montoComision)}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="montoComision" radius={[6, 6, 0, 0]}>
                {days.map((entry, index) => (
                  <Cell 
                    key={`cell-comision-${index}`} 
                    fill={entry.montoComision > 0 ? '#10b981' : '#f1f5f9'} 
                    className="transition-all duration-500 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Gráfica de Ingresos del Negocio (Solo para dueños) */}
      {isAdmin && (
        <div className="w-full pt-4 border-t border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ingresos del Negocio</h3>
          <div className="h-[140px] w-full">
            <ChartContainer config={{ montoNegocio: { label: "Negocio", color: "#3b82f6" } }}>
              <BarChart data={days}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border-none font-black italic text-[10px] animate-in zoom-in duration-200 flex flex-col">
                          <span className="text-blue-400 mb-1">Negocio:</span>
                          <span className="text-base">{currencyFormatter.format(payload[0].payload.montoNegocio)}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="montoNegocio" radius={[6, 6, 0, 0]}>
                  {days.map((entry, index) => (
                    <Cell 
                      key={`cell-negocio-${index}`} 
                      fill={entry.montoNegocio > 0 ? '#3b82f6' : '#f1f5f9'} 
                      className="transition-all duration-500 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      )}
    </div>
  );
}
