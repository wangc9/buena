"use client";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import z from "zod";
import { UnitArraySchema, UnitDataSchema } from "@cw/schema";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Dispatch, SetStateAction } from "react";
import { SpinnerButton } from "./ui/SpinnerButton";
import { Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function UnitContent({
  setStep,
  propertyName,
  buildings,
  setOpen,
  buildingIdMap,
  parsedUnits,
}: {
  setStep: Dispatch<SetStateAction<"property" | "building" | "unit">>;
  propertyName: string;
  buildings: {
    id: string;
    name: string;
  }[];
  setOpen: Dispatch<SetStateAction<boolean>>;
  buildingIdMap: Record<string, string>;
  parsedUnits: z.infer<typeof UnitArraySchema> | null;
}) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof UnitArraySchema>>({
    resolver: zodResolver(UnitArraySchema),
    defaultValues: {
      units: parsedUnits?.units
        ? parsedUnits.units.map((unit) => ({
            ...unit,
            buildingId: buildingIdMap[unit.buildingTempId] || buildings[0].id,
          }))
        : [
            {
              buildingId: buildings[0].id,
              type: "Apartment",
              number: 0,
              floor: 0,
              entrance: "",
              size: 0,
              ownershipShare: "",
              year: 0,
              rooms: -1,
              buildingTempId: "",
            },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "units",
  });

  async function onSubmit(data: z.infer<typeof UnitArraySchema>) {
    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/units`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const {
        successUnits,
        failedUnits,
      }: {
        successUnits: {
          number: number;
        }[];
        failedUnits: z.infer<typeof UnitDataSchema>[];
      } = await result.json();
      if (failedUnits.length > 0) {
        toast.error(
          `Failed to create units: ${failedUnits.map((unit) => unit.number).join(", ")}`
        );
        return;
      }
      toast.success(
        `Successfully created units: ${successUnits.map((unit) => unit.number).join(", ")}`
      );
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setOpen(false);
      setStep("property");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>New Units in {propertyName}</DialogTitle>
        <DialogDescription>Step 3/3 - Unit Details</DialogDescription>
      </DialogHeader>
      <form id="unit-form" onSubmit={form.handleSubmit(onSubmit)}>
        {fields.map((_, index) => (
          <FieldGroup key={index}>
            <article className="flex gap-x-2 items-center">
              <Button
                onClick={() => remove(index)}
                variant="destructive"
                size="icon"
              >
                <Trash2 />
              </Button>
              <h4 className="text-lg font-medium">Unit {index + 1}</h4>
            </article>

            <input
              type="hidden"
              {...form.register(`units.${index}.buildingTempId`)}
            />

            <Controller
              name={`units.${index}.buildingId`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`unit-form-buildingId-${index}`}>
                    Building
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id={`unit-form-buildingId-${index}`}
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name={`units.${index}.type`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`unit-form-type-${index}`}>
                    Unit Type
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id={`unit-form-type-${index}`}
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select unit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Garden">Garden</SelectItem>
                      <SelectItem value="Parking">Parking</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name={`units.${index}.number`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`unit-form-number-${index}`}>
                    Unit Number
                  </FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    id={`unit-form-number-${index}`}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name={`units.${index}.floor`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`unit-form-floor-${index}`}>
                    Floor Number
                  </FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    id={`unit-form-floor-${index}`}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name={`units.${index}.entrance`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`unit-form-entrance-${index}`}>
                    Entrance Details
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`unit-form-entrance-${index}`}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name={`units.${index}.size`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`unit-form-size-${index}`}>
                    Unit Size (m²)
                  </FieldLabel>
                  <Input
                    {...field}
                    type="text"
                    inputMode="decimal"
                    step="any"
                    id={`unit-form-size-${index}`}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    onChange={(e) => {
                      const value = e.target.value;
                      const valueWithDot = value.replace(",", ".");
                      if (
                        valueWithDot === "" ||
                        /^-?\d*\.?\d*$/.test(valueWithDot)
                      ) {
                        field.onChange(valueWithDot);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      field.onChange(parseFloat(value));
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name={`units.${index}.ownershipShare`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`unit-form-ownershipShare-${index}`}>
                    Ownership Share
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`unit-form-ownershipShare-${index}`}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name={`units.${index}.year`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`unit-form-year-${index}`}>
                    Year Built
                  </FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    id={`unit-form-year-${index}`}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name={`units.${index}.rooms`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`unit-form-rooms-${index}`}>
                    Number of Rooms
                  </FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    id={`unit-form-rooms-${index}`}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Separator className="mb-4" />
          </FieldGroup>
        ))}
        <article className="flex justify-center pt-4">
          <Button
            onClick={() =>
              append({
                buildingId: buildings[0].id,
                type: "Apartment",
                number: 0,
                floor: 0,
                entrance: "",
                size: 0,
                ownershipShare: "",
                year: 0,
                rooms: -1,
                buildingTempId: "",
              })
            }
          >
            Add Unit
          </Button>
        </article>
      </form>
      <DialogFooter>
        <SpinnerButton
          variant="default"
          type="submit"
          form="unit-form"
          loading={form.formState.isSubmitting}
          disabled={form.formState.isSubmitting}
        >
          Next
        </SpinnerButton>
      </DialogFooter>
    </>
  );
}
