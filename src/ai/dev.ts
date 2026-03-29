
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
import '@/ai/agents/asignador/flows/match-engine.ts';
