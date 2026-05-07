"use client";

import { useMemo } from 'react';

export type ServiceType = 'PURCHASE' | 'RENTAL';

export function getServiceType(order: { type?: string; productName?: string; storeId?: string }): ServiceType {
  const orderType = order.type?.toUpperCase() || '';
  
  if (orderType.includes('WASHER') || orderType.includes('RENTAL') || orderType.includes('ALQUILER')) {
    return 'RENTAL';
  }
  
  if (order.productName?.toLowerCase().includes('alquiler')) {
    return 'RENTAL';
  }
  
  return 'PURCHASE';
}

export function getServiceLabel(type: ServiceType, isStoreOwner: boolean, status?: string): { label: string; action: string } {
  if (type === 'RENTAL') {
    if (isStoreOwner) {
      if (status === 'pending') return { label: 'Alquiler: Nueva Solicitud', action: 'SOLICITUD' };
      if (status === 'preparing') return { label: 'Alquiler: Preparando', action: 'PREPARANDO' };
      if (status === 'ready_for_pickup') return { label: 'Alquiler: Lista para Entrega', action: 'LISTA' };
      if (status === 'shipped') return { label: 'Alquiler: En Ruta', action: 'RUTA' };
      return { label: 'Alquiler: Activo', action: 'ACTIVO' };
    } else {
      if (status === 'shipped' || status === 'delivered_to_driver') return { label: 'Alquiler: Confirmar Recepción', action: 'CONFIRMAR' };
      if (status === 'pending' || status === 'preparing') return { label: 'Alquiler: Solicitud en Proceso', action: 'PROCESO' };
      return { label: 'Alquiler: En Curso', action: 'CURSO' };
    }
  }
  
  if (isStoreOwner) {
    if (status === 'pending') return { label: 'Venta: Nuevo Pedido', action: 'PEDIDO' };
    if (status === 'preparing') return { label: 'Venta: Preparando', action: 'PREPARANDO' };
    if (status === 'ready_for_pickup') return { label: 'Venta: Listo en Tienda', action: 'LISTA' };
    if (status === 'shipped') return { label: 'Venta: En Reparto', action: 'RUTA' };
    return { label: 'Venta: Activa', action: 'ACTIVA' };
  }
  
  if (status === 'shipped' || status === 'delivered_to_driver') return { label: 'Compra: Confirmar Entrega', action: 'CONFIRMAR' };
  return { label: 'Compra: En Seguimiento', action: 'SEGUIMIENTO' };
}