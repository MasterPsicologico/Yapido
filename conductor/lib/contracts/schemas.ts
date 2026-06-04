import { z } from 'zod';

/**
 * Schemas Zod compartidos cliente ↔ servidor.
 * Cada Cloud Function valida su input con estos schemas.
 */

// ---------- Primitivos ----------
export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type LatLng = z.infer<typeof LatLngSchema>;

export const GeohashSchema = z.string().regex(/^[0-9b-hjkmnp-z]{1,12}$/);

export const TimestampSchema = z.union([
  z.number(),          // ms epoch
  z.object({           // Firestore Timestamp
    _seconds: z.number(),
    _nanoseconds: z.number().optional(),
  }),
  z.date(),
]);

// ---------- User ----------
export const UserRoleSchema = z.enum(['passenger', 'driver', 'both', 'admin']);

export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().regex(/^\+\d{8,15}$/, 'E.164 format').nullable().optional(),
  displayName: z.string().min(1).max(80),
  photoURL: z.string().url().nullable().optional(),
  role: UserRoleSchema,
  fcmTokens: z.array(z.string()).default([]),
  createdAt: TimestampSchema.optional(),
  updatedAt: TimestampSchema.optional(),
  status: z.enum(['active', 'suspended', 'banned']).default('active'),
  locale: z.string().default('es-CO'),
  citiesActive: z.array(z.string()).default([]),
});
export type User = z.infer<typeof UserSchema>;

// ---------- PassengerProfile ----------
export const PassengerProfileSchema = z.object({
  uid: z.string(),
  defaultPaymentMethodId: z.string().nullable().default(null),
  homeAddress: LatLngSchema.extend({ address: z.string() }).nullable().default(null),
  workAddress: LatLngSchema.extend({ address: z.string() }).nullable().default(null),
  ratingAvg: z.number().min(0).max(5).default(5),
  ratingCount: z.number().int().min(0).default(0),
  totalTrips: z.number().int().min(0).default(0),
  promoCodes: z.array(z.string()).default([]),
  defaultCityId: z.string().default('aguachica'),
});
export type PassengerProfile = z.infer<typeof PassengerProfileSchema>;

// ---------- DriverProfile ----------
export const DriverProfileSchema = z.object({
  uid: z.string(),
  status: z.enum(['pending_docs', 'approved', 'rejected', 'blocked']).default('pending_docs'),
  ratingAvg: z.number().min(0).max(5).default(5),
  ratingCount: z.number().int().min(0).default(0),
  totalTrips: z.number().int().min(0).default(0),
  acceptRate30d: z.number().min(0).max(1).default(1),
  cancelRate30d: z.number().min(0).max(1).default(0),
  vehicleId: z.string().nullable().default(null),
  documentsId: z.string().optional(),
  bankAccount: z
    .object({
      provider: z.string(),
      maskedAccount: z.string(),
      holderName: z.string(),
    })
    .nullable()
    .default(null),
  online: z.boolean().default(false),
  currentLocation: LatLngSchema.nullable().default(null),
  currentGeohash6: z.string().nullable().default(null),
  citiesActive: z.array(z.string()).default([]),
  currentCityId: z.string().default('aguachica'),
  flaggedAt: TimestampSchema.nullable().default(null),
  onboarding: z
    .object({
      channel: z.enum(['in_person', 'remote']).default('remote'),
      verificationCity: z.string().optional(),
      verifiedBy: z.string().nullable().default(null),
      verifiedAt: TimestampSchema.nullable().default(null),
      verificationNotes: z.string().nullable().default(null),
    })
    .default({}),
  market: z
    .object({
      primaryZone: z.string().default('centro'),
      worksWeekends: z.boolean().default(true),
      worksNights: z.boolean().default(false),
      vehicleInspectionPassed: z.boolean().default(false),
    })
    .default({}),
  city: z.string().default('aguachica'),
});
export type DriverProfile = z.infer<typeof DriverProfileSchema>;

// ---------- DriverVehicle ----------
export const DriverVehicleSchema = z.object({
  vehicleId: z.string(),
  driverId: z.string(),
  type: z.enum(['moto', 'auto', 'auto_comfort']),
  plate: z.string().min(1).max(10),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().min(1),
  capacity: z.number().int().min(1).max(8),
  photoFront: z.string().url().optional(),
  photoSide: z.string().url().optional(),
  photoBack: z.string().url().optional(),
  insuranceExpiry: TimestampSchema.nullable().default(null),
  soatExpiry: TimestampSchema.nullable().default(null),
  verifiedAt: TimestampSchema.nullable().default(null),
});
export type DriverVehicle = z.infer<typeof DriverVehicleSchema>;

// ---------- DriverDocuments ----------
export const DriverDocumentsSchema = z.object({
  uid: z.string(),
  ccFrontUrl: z.string().url().optional(),
  ccBackUrl: z.string().url().optional(),
  licenseUrl: z.string().url().optional(),
  licenseExpiry: TimestampSchema.nullable().default(null),
  backgroundCheckUrl: z.string().url().nullable().default(null),
  selfieWithCcUrl: z.string().url().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  reviewedBy: z.string().nullable().default(null),
  reviewedAt: TimestampSchema.nullable().default(null),
  rejectionReason: z.string().nullable().default(null),
  updatedAt: TimestampSchema.optional(),
});
export type DriverDocuments = z.infer<typeof DriverDocumentsSchema>;

// ---------- City ----------
export const PricingSchema = z.object({
  base: z.number().int().min(0),
  perKm: z.number().int().min(0),
  perMin: z.number().int().min(0),
  minFare: z.number().int().min(0),
  currency: z.literal('COP').default('COP'),
  commissionPct: z.number().min(0).max(1).default(0.20),
  waitingFeePerMin: z.number().int().min(0).default(200),
});
export type Pricing = z.infer<typeof PricingSchema>;

export const CityPricingSchema = z.object({
  moto: PricingSchema,
  auto: PricingSchema,
  auto_comfort: PricingSchema.optional(),
  surge: z
    .object({
      enabled: z.boolean().default(false),
      max: z.number().min(1).max(3).default(1.5),
    })
    .default({ enabled: false, max: 1.5 }),
});
export type CityPricing = z.infer<typeof CityPricingSchema>;

export const GeoPolygonSchema = z.object({
  type: z.literal('polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(3),
});

export const CitySchema = z.object({
  cityId: z.string().min(2),
  displayName: z.string().min(1),
  region: z.string(),
  country: z.literal('CO').default('CO'),
  currency: z.literal('COP').default('COP'),
  timezone: z.string().default('America/Bogota'),
  geofence: GeoPolygonSchema,
  serviceArea: GeoPolygonSchema,
  centerLat: z.number(),
  centerLng: z.number(),
  population: z.number().int().min(0).optional(),
  pricing: CityPricingSchema,
  status: z.enum(['active', 'launching', 'paused']).default('launching'),
  launchedAt: TimestampSchema.nullable().default(null),
  supportPhone: z.string().optional(),
  supportWhatsapp: z.string().optional(),
  stats: z
    .object({
      activeDrivers: z.number().int().min(0).default(0),
      tripsToday: z.number().int().min(0).default(0),
      avgWaitMin: z.number().min(0).default(0),
    })
    .default({}),
  updatedAt: TimestampSchema.optional(),
});
export type City = z.infer<typeof CitySchema>;

// ---------- Trip ----------
export const TripFareSchema = z.object({
  currency: z.literal('COP').default('COP'),
  base: z.number().int().min(0),
  distance: z.number().min(0),
  time: z.number().min(0),
  surge: z.number().min(1).max(3).default(1),
  tolls: z.number().int().min(0).default(0),
  wait: z.number().int().min(0).default(0),
  total: z.number().int().min(0),
  driverEarning: z.number().int().min(0),
  platformFee: z.number().int().min(0),
  tip: z.number().int().min(0).default(0),
});
export type TripFare = z.infer<typeof TripFareSchema>;

export const TripTimelineSchema = z.object({
  requestedAt: TimestampSchema,
  matchedAt: TimestampSchema.nullable().default(null),
  acceptedAt: TimestampSchema.nullable().default(null),
  arrivedAt: TimestampSchema.nullable().default(null),
  startedAt: TimestampSchema.nullable().default(null),
  completedAt: TimestampSchema.nullable().default(null),
  cancelledAt: TimestampSchema.nullable().default(null),
  cancelledBy: z.enum(['passenger', 'driver', 'system']).nullable().default(null),
  cancelReason: z.string().nullable().default(null),
  ratedAt: TimestampSchema.nullable().default(null),
});
export type TripTimeline = z.infer<typeof TripTimelineSchema>;

export const TripSchema = z.object({
  tripId: z.string(),
  cityId: z.string(),
  status: z.enum([
    'searching', 'offered', 'accepted', 'arriving', 'in_progress',
    'completed', 'cancelled', 'no_drivers', 'rated',
  ]),
  type: z.enum(['moto', 'auto', 'auto_comfort']),
  passenger: z.object({
    uid: z.string(),
    displayName: z.string(),
    photoURL: z.string().url().nullable().optional(),
    rating: z.number().min(0).max(5).default(5),
    phone: z.string().optional(),
  }),
  driver: z
    .object({
      uid: z.string(),
      displayName: z.string(),
      photoURL: z.string().url().nullable().optional(),
      rating: z.number().min(0).max(5).default(5),
      phone: z.string().optional(),
      plate: z.string().optional(),
      vehicleDesc: z.string().optional(),
    })
    .nullable()
    .default(null),
  pickup: LatLngSchema.extend({
    address: z.string(),
    notes: z.string().optional(),
  }),
  dropoff: LatLngSchema.extend({
    address: z.string(),
    notes: z.string().optional(),
  }),
  routePolyline: z.string().optional(),
  distanceMeters: z.number().min(0).default(0),
  durationSeconds: z.number().int().min(0).default(0),
  fare: TripFareSchema,
  payment: z.object({
    method: z.enum(['cash', 'card', 'wompi', 'pse']),
    status: z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
    transactionId: z.string().nullable().default(null),
    paidAt: TimestampSchema.nullable().default(null),
  }),
  timeline: TripTimelineSchema,
  offerLog: z
    .array(
      z.object({
        driverId: z.string(),
        offeredAt: TimestampSchema,
        expiredAt: TimestampSchema.nullable().default(null),
        reason: z.string().optional(),
      })
    )
    .default([]),
  createdAt: TimestampSchema.optional(),
});
export type Trip = z.infer<typeof TripSchema>;

// ---------- API Contracts ----------

// POST /trips
export const CreateTripInputSchema = z.object({
  requestId: z.string().uuid(),
  type: z.enum(['moto', 'auto', 'auto_comfort']),
  pickup: LatLngSchema.extend({ address: z.string(), notes: z.string().optional() }),
  dropoff: LatLngSchema.extend({ address: z.string(), notes: z.string().optional() }),
  paymentMethod: z.enum(['cash', 'card', 'wompi', 'pse']),
  paymentMethodId: z.string().optional(),
  notes: z.string().max(280).optional(),
  promoCode: z.string().optional(),
});
export type CreateTripInput = z.infer<typeof CreateTripInputSchema>;

export const CreateTripOutputSchema = z.object({
  tripId: z.string(),
  status: z.literal('searching'),
  fare: z.object({
    total: z.number().int(),
    currency: z.literal('COP'),
    surge: z.number(),
  }),
  eta: z.number().int().optional(),
});
export type CreateTripOutput = z.infer<typeof CreateTripOutputSchema>;

// POST /trips/:id/cancel
export const CancelTripInputSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().min(1).max(80),
});
export type CancelTripInput = z.infer<typeof CancelTripInputSchema>;

// POST /trips/:id/rate
export const RateTripInputSchema = z.object({
  requestId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  tags: z.array(z.string()).max(10).default([]),
  comment: z.string().max(500).optional(),
  tip: z.number().int().min(0).max(100_000).default(0),
});
export type RateTripInput = z.infer<typeof RateTripInputSchema>;

// GET /fare-estimate
export const FareEstimateInputSchema = z.object({
  type: z.enum(['moto', 'auto', 'auto_comfort']),
  pickup: LatLngSchema,
  dropoff: LatLngSchema,
  cityId: z.string().default('aguachica'),
});
export type FareEstimateInput = z.infer<typeof FareEstimateInputSchema>;

export const FareEstimateOutputSchema = z.object({
  fare: TripFareSchema,
  distanceMeters: z.number(),
  durationSeconds: z.number(),
  routePolyline: z.string(),
  surge: z.number(),
  eta: z.number().int().optional(),
});
export type FareEstimateOutput = z.infer<typeof FareEstimateOutputSchema>;

// POST /driver/set-online
export const SetOnlineInputSchema = z.object({
  requestId: z.string().uuid(),
  online: z.boolean(),
  cityId: z.string(),
  loc: LatLngSchema,
});
export type SetOnlineInput = z.infer<typeof SetOnlineInputSchema>;

// POST /driver/location (RTDB path más eficiente, pero dejamos endpoint de fallback)
export const UpdateLocationInputSchema = z.object({
  requestId: z.string().uuid(),
  loc: LatLngSchema.extend({
    h: z.number().min(0).max(360).optional(),   // heading
    s: z.number().min(0).max(200).optional(),   // speed km/h
  }),
  cityId: z.string(),
});
export type UpdateLocationInput = z.infer<typeof UpdateLocationInputSchema>;

// POST /trips/:id/accept
export const AcceptOfferInputSchema = z.object({
  requestId: z.string().uuid(),
  offerId: z.string(),
});
export type AcceptOfferInput = z.infer<typeof AcceptOfferInputSchema>;

// POST /trips/:id/start
export const StartTripInputSchema = z.object({
  requestId: z.string().uuid(),
  pickupCode: z.string().length(4).optional(), // código que el pasajero da
});
export type StartTripInput = z.infer<typeof StartTripInputSchema>;

// POST /trips/:id/complete
export const CompleteTripInputSchema = z.object({
  requestId: z.string().uuid(),
  finalLocation: LatLngSchema.optional(),
});
export type CompleteTripInput = z.infer<typeof CompleteTripInputSchema>;

// ---------- Helper: Response genérico ----------
export function okResponse<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({ ok: z.literal(true), data: dataSchema });
}

export function errResponse(error: z.ZodTypeAny = z.string()) {
  return z.object({ ok: z.literal(false), error });
}

