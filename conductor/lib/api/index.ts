/**
 * Wrappers para llamadas HTTP a las Cloud Functions.
 * Cada método valida input/output con Zod.
 */

import { httpsCallable } from 'firebase/functions';
import { firebaseFunctions } from '@/lib/firebase/client';
import {
  CreateTripInputSchema,
  CreateTripOutputSchema,
  RateTripInputSchema,
  CancelTripInputSchema,
  FareEstimateInputSchema,
  FareEstimateOutputSchema,
  SetOnlineInputSchema,
  AcceptOfferInputSchema,
  StartTripInputSchema,
  CompleteTripInputSchema,
  type CreateTripInput,
  type CreateTripOutput,
  type RateTripInput,
  type CancelTripInput,
  type FareEstimateInput,
  type FareEstimateOutput,
  type SetOnlineInput,
  type AcceptOfferInput,
  type StartTripInput,
  type CompleteTripInput,
} from '@/lib/contracts';

const functions = firebaseFunctions();

async function call<I, O>(
  name: string,
  input: I,
  inputSchema: { parse: (x: unknown) => I },
  outputSchema: { parse: (x: unknown) => O }
): Promise<O> {
  const validated = inputSchema.parse(input);
  const fn = httpsCallable<I, unknown>(functions, name);
  const result = await fn(validated);
  return outputSchema.parse(result.data);
}

// ---------- Trips ----------
export const apiCreateTrip = (input: CreateTripInput) =>
  call<CreateTripInput, CreateTripOutput>('createTrip', input, CreateTripInputSchema, CreateTripOutputSchema);

export const apiCancelTrip = (tripId: string, input: CancelTripInput) =>
  call<CancelTripInput, { ok: true }>('cancelTrip', input, CancelTripInputSchema, /* loose */ { parse: (x) => x as { ok: true } });

export const apiRateTrip = (tripId: string, input: RateTripInput) =>
  call<RateTripInput, { ok: true; newDriverRating?: number }>('rateTrip', input, RateTripInputSchema, { parse: (x) => x as { ok: true; newDriverRating?: number } });

// ---------- Driver ----------
export const apiSetOnline = (input: SetOnlineInput) =>
  call<SetOnlineInput, { ok: true }>('setOnline', input, SetOnlineInputSchema, { parse: (x) => x as { ok: true } });

export const apiAcceptOffer = (tripId: string, input: AcceptOfferInput) =>
  call<AcceptOfferInput, { ok: true }>('acceptOffer', input, AcceptOfferInputSchema, { parse: (x) => x as { ok: true } });

export const apiStartTrip = (tripId: string, input: StartTripInput) =>
  call<StartTripInput, { ok: true }>('startTrip', input, StartTripInputSchema, { parse: (x) => x as { ok: true } });

export const apiCompleteTrip = (tripId: string, input: CompleteTripInput) =>
  call<CompleteTripInput, { ok: true; fare: unknown }>('completeTrip', input, CompleteTripInputSchema, { parse: (x) => x as { ok: true; fare: unknown } });

// ---------- Fare ----------
export const apiFareEstimate = (input: FareEstimateInput) =>
  call<FareEstimateInput, FareEstimateOutput>('fareEstimate', input, FareEstimateInputSchema, FareEstimateOutputSchema);

