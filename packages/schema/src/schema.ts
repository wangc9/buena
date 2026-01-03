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
  house: z.number().int().min(0),
  other: z.string().min(2),
});

export const BuildingWithTempIdSchema = BuildingDataSchema.extend({
  tempId: z.string(),
});

export const BuildingArraySchema = z.object({
  buildings: BuildingWithTempIdSchema.array().min(1),
});

export const UnitDataSchema = z.object({
  buildingId: z.uuid(),
  type: z.enum(["Apartment", "Office", "Garden", "Parking"]),
  number: z.number().int().min(0),
  floor: z.number().int().min(-1),
  entrance: z.string().min(2),
  size: z.number().min(0),
  ownershipShare: z.string().min(2),
  year: z.number().int().min(0),
  rooms: z.number().int().min(0),
});

export const UnitWithTempIdSchema = UnitDataSchema.extend({
  buildingTempId: z.string(),
});

export const UnitArraySchema = z.object({
  units: UnitWithTempIdSchema.array().min(1),
});

export const PresignedUrlSchema = z.object({
  contentType: z.string().min(2),
});

export const FullPropertySchema = z.object({
  buildings: z.array(BuildingWithTempIdSchema),
  units: z.array(UnitWithTempIdSchema),
});
