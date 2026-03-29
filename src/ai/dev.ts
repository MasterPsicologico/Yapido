
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-product-description.ts';
import '@/ai/agents/cliente/flows/process-order.ts';
import '@/ai/agents/tienda/tools/inventory-sync.ts';
import '@/ai/agents/asignador/flows/match-engine.ts';
// Los demás se registrarán conforme se llenen con lógica
