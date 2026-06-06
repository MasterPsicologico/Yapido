"use client";

import { useMemo } from 'react';
import { 
  X, ArrowLeft, Truck, Clock, DollarSign, Star, 
  Calendar, AlertTriangle, Activity, TrendingUp,
  CheckCircle2, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, startOfMonth, isWithinInterval, endOfDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface DriverMetricsSheetProps {
  driver: any;
  orders: any[];
  store: any;
  onClose: () => void;
}

export function DriverMetricsSheet({ driver, orders, store, onClose }: DriverMetricsSheetProps) {
  const metrics = useMemo(() => {
    const driverOrders = orders.filter(o => o.deliveryDriverId === driver.id);
    const completed = driverOrders.filter(o => ['completed', 'delivered'].includes(o.status));
    const released = driverOrders.filter(o => o.releasedBy === driver.id);
    const total = completed.length + released.length;
    const fulfillmentRate = total > 0 ? Math.round((completed.length / total) * 100) : 100;

    // Average delivery time
    const deliveryTimes = completed.map(o => {
      const accepted = o.acceptedAt?.toMillis?.() || (o.acceptedAt?.seconds ? o.acceptedAt.seconds * 1000 : 0);
      const delivered = o.deliveredAt?.toMillis?.() || (o.deliveredAt?.seconds ? o.deliveredAt.seconds * 1000 : 0);
      if (!accepted || !delivered) return 0;
      return (delivered - accepted) / 60000; // minutes
    }).filter(t => t > 0);
    const avgDeliveryTime = deliveryTimes.length > 0 
      ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length) 
      : 0;

    // Revenue
    const totalRevenue = completed.reduce((acc, o) => acc + (o.totalPrice || 0), 0);

    // Today's orders
    const today = new Date();
    const todayOrders = completed.filter(o => {
      const ts = o.completedAt || o.deliveredAt || o.createdAt;
      const date = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);
      if (!date) return false;
      return isWithinInterval(date, { start: startOfDay(today), end: endOfDay(today) });
    });

    // Active days this month
    const monthStart = startOfMonth(today);
    const uniqueDays = new Set(
      completed.map(o => {
        const ts = o.completedAt || o.deliveredAt || o.createdAt;
        const date = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);
        if (!date || date < monthStart) return null;
        return format(date, 'yyyy-MM-dd');
      }).filter(Boolean)
    );

    // Last activity
    const lastUpdate = driver.updatedAt?.toDate?.() || (driver.updatedAt?.seconds ? new Date(driver.updatedAt.seconds * 1000) : null);

    return {
      completedCount: completed.length,
      fulfillmentRate,
      avgDeliveryTime,
      totalRevenue,
      avgRating: driver.avgRating || 5.0,
      activeDaysThisMonth: uniqueDays.size,
      lastActivity: lastUpdate,
      releasedCount: released.length,
      todayCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0),
    };
  }, [driver, orders]);

  const metricItems = [
    {
      icon: Truck,
      label: 'Entregas Completadas',
      value: metrics.completedCount.toString(),
      sublabel: `${metrics.todayCount} hoy`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: CheckCircle2,
      label: 'Tasa de Cumplimiento',
      value: `${metrics.fulfillmentRate}%`,
      sublabel: metrics.fulfillmentRate >= 90 ? 'Excelente' : metrics.fulfillmentRate >= 70 ? 'Aceptable' : 'Bajo',
      color: metrics.fulfillmentRate >= 90 ? 'text-green-600' : metrics.fulfillmentRate >= 70 ? 'text-yellow-600' : 'text-red-600',
      bgColor: metrics.fulfillmentRate >= 90 ? 'bg-green-50' : metrics.fulfillmentRate >= 70 ? 'bg-yellow-50' : 'bg-red-50',
    },
    {
      icon: Clock,
      label: 'Tiempo Prom. de Entrega',
      value: metrics.avgDeliveryTime > 0 ? `${metrics.avgDeliveryTime} min` : 'N/A',
      sublabel: metrics.avgDeliveryTime <= 30 ? 'Rápido' : metrics.avgDeliveryTime <= 60 ? 'Normal' : 'Lento',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: DollarSign,
      label: 'Ingresos Generados',
      value: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(metrics.totalRevenue),
      sublabel: `${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(metrics.todayRevenue)} hoy`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Star,
      label: 'Calificación Promedio',
      value: metrics.avgRating.toFixed(1),
      sublabel: metrics.avgRating >= 4.5 ? '⭐ Destacado' : '📊 En desarrollo',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: Calendar,
      label: 'Días Activos este Mes',
      value: metrics.activeDaysThisMonth.toString(),
      sublabel: `de ${new Date().getDate()} días transcurridos`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: Activity,
      label: 'Última Actividad',
      value: metrics.lastActivity ? formatDistanceToNow(metrics.lastActivity, { addSuffix: true, locale: es }) : 'Sin datos',
      sublabel: metrics.lastActivity ? format(metrics.lastActivity, "dd MMM, HH:mm", { locale: es }) : '',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
    },
    {
      icon: AlertTriangle,
      label: 'Órdenes Liberadas',
      value: metrics.releasedCount.toString(),
      sublabel: metrics.releasedCount === 0 ? 'Sin liberaciones' : 'Requiere atención',
      color: metrics.releasedCount > 3 ? 'text-red-600' : 'text-orange-600',
      bgColor: metrics.releasedCount > 3 ? 'bg-red-50' : 'bg-orange-50',
    },
  ];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[250] bg-[#f8fafc] flex flex-col"
    >
      {/* Header */}
      <div className="shrink-0 bg-white px-6 py-5 flex items-center gap-4 border-b border-slate-100 shadow-sm safe-area-top">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="w-12 h-12 shadow-md ring-2 ring-white shrink-0">
            <AvatarImage src={driver.photoURL} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
              {driver.displayName?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 truncate leading-none">{driver.displayName}</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {driver.deliveryActive ? '🟢 En línea' : '⚫ Desconectado'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-safe">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {metricItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex items-center gap-4"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", item.bgColor)}>
                <item.icon className={cn("w-6 h-6", item.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{item.label}</p>
                <p className={cn("text-2xl font-black tracking-tighter leading-none mt-1", item.color)}>{item.value}</p>
              </div>
              {item.sublabel && (
                <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none rounded-full px-3 h-6 text-[8px] font-black uppercase shrink-0">
                  {item.sublabel}
                </Badge>
              )}
            </motion.div>
          ))}

          {/* Individual Report Section */}
          <div className="pt-6 border-t border-slate-100 mt-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 px-2">Informe evolutivo del repartidor</p>
            <div className="bg-slate-50 rounded-[24px] p-6 text-center space-y-3">
              <Zap className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-500">Análisis integral</p>
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                  {metrics.completedCount > 5
                    ? `${driver.displayName} mantiene un desempeño ${metrics.fulfillmentRate >= 90 ? 'sobresaliente' : 'estable'} con ${metrics.completedCount} entregas y una tasa de cumplimiento del ${metrics.fulfillmentRate}%.`
                    : `${driver.displayName} aún está construyendo su historial. Se recomienda asignar más misiones para obtener métricas significativas.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
