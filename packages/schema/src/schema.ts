import z from "zod";

export const PropertyReturnSchema = z.object({
  id: z.uuid(),
  type: z.enum(["WEG", "MV"]),
  name: z.string().min(2),
});

export const PropertySchema = z.object({
  ...PropertyReturnSchema.omit({ id: true }).shape,
  manager: z.string().min(2),
  accountant: z.string().min(2),
  url: z.url(),
});

export const BuildingDataSchema = z.object({
  propertyId: z.uuid(),
  name: z.string().min(2),
  street: z.string().min(2),
  house: z.coerce.number().int().min(0),
  other: z.string().min(2),
});

export const BuildingArraySchema = z.object({
  buildings: BuildingDataSchema.array().min(1),
});

export const UnitDataSchema = z.object({
  buildingId: z.uuid(),
  type: z.enum(["Apartment", "Office", "Garden", "Parking"]),
  number: z.number().int().min(0),
  floor: z.number().int().min(-1),
  entrance: z.string().min(2),
  size: z.number().int().min(0),
  ownershipShare: z.string().min(2),
  year: z.number().int().min(0),
  rooms: z.number().int().min(0),
});

export const UnitArraySchema = z.object({
  units: UnitDataSchema.array().min(1),
});

export const PresignedUrlSchema = z.object({
  contentType: z.string().min(2),
});
