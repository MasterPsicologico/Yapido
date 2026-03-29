
import { config } from 'dotenv';
config();

// Registro de flujos y herramientas para el entorno de desarrollo
import '@/ai/flows/generate-product-description.ts';
import '@/ai/agents/cliente/index.ts';
import '@/ai/agents/cliente/tools/validate-address.ts';
import '@/ai/agents/cliente/tools/calculate-total.ts';
import '@/ai/agents/cliente/tools/create-order.ts';
import '@/ai/agents/cliente/tools/get-nearby-stores.ts';
import '@/ai/agents/tienda/tools/inventory-sync.ts';
import '@/ai/agents/asignador/index.ts';
import '@/ai/agents/asignador/tools/calculate-score.ts';
import '@/ai/agents/asignador/tools/find-drivers.ts';
import '@/ai/agents/rutas/index.ts';
import '@/ai/agents/rutas/tools/calculate-eta.ts';
import '@/ai/agents/rutas/tools/get-route.ts';
import '@/ai/agents/rutas/tools/optimize-multi-route.ts';
import '@/ai/agents/precios/index.ts';
import '@/ai/agents/precios/tools/calculate-multiplier.ts';
import '@/ai/agents/pagos/index.ts';
import '@/ai/agents/pagos/tools/split-payment.ts';
import '@/ai/agents/pagos/tools/verify-payment.ts';
import '@/ai/agents/notificaciones/index.ts';
import '@/ai/agents/notificaciones/tools/send-push.ts';
import '@/ai/agents/notificaciones/tools/send-sms.ts';
import '@/ai/agents/notificaciones/tools/send-email.ts';
import '@/ai/agents/prediccion/index.ts';
import '@/ai/agents/prediccion/tools/predict-demand.ts';
import '@/ai/agents/prediccion/tools/analyze-history.ts';
import '@/ai/agents/fraude/index.ts';
import '@/ai/agents/fraude/tools/calculate-risk.ts';
import '@/ai/agents/fraude/tools/gps-checker.ts';
