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
import { BuildingDataSchema, BuildingFormSchema } from "@cw/schema";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Dispatch, SetStateAction } from "react";
import { SpinnerButton } from "./ui/SpinnerButton";
import { Textarea } from "./ui/textarea";
import { Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { toast } from "sonner";

export default function BuildingContent({
  setStep,
  propertyId,
  propertyName,
  setBuildings,
}: {
  setStep: Dispatch<SetStateAction<"property" | "building" | "unit">>;
  propertyId: string;
  propertyName: string;
  setBuildings: Dispatch<
    SetStateAction<
      {
        id: string;
        name: string;
      }[]
    >
  >;
}) {
  const form = useForm<z.infer<typeof BuildingFormSchema>>({
    resolver: zodResolver(BuildingFormSchema),
    defaultValues: {
      buildings: [
        {
          propertyId,
          name: "",
          street: "",
          house: 0,
          other: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "buildings",
  });

  async function onSubmit(data: z.infer<typeof BuildingFormSchema>) {
    try {
      const result = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/buildings`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const {
        successBuildings,
        failedBuildings,
      }: {
        successBuildings: {
          id: string;
          name: string;
        }[];
        failedBuildings: z.infer<typeof BuildingDataSchema>[];
      } = await result.json();
      if (failedBuildings.length > 0) {
        toast.error(
          `Failed to create buildings: ${failedBuildings.map((building) => building.name).join(", ")}`
        );
        return;
      }
      toast.success(
        `Successfully created buildings: ${successBuildings.map((building) => building.name).join(", ")}`
      );
      setBuildings(successBuildings);
      setStep("unit");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>New Building in {propertyName}</DialogTitle>
        <DialogDescription>Step 2/3 - Building Details</DialogDescription>
      </DialogHeader>
      <form id="building-form" onSubmit={form.handleSubmit(onSubmit)}>
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
              <h4 className="text-lg font-medium">Building {index + 1}</h4>
            </article>

            <Controller
              name={`buildings.${index}.name`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`building-form-name-${index}`}>
                    Building Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`building-form-name-${index}`}
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
              name={`buildings.${index}.street`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`building-form-street-${index}`}>
                    Street
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`building-form-street-${index}`}
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
              name={`buildings.${index}.house`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`building-form-house-${index}`}>
                    House Number
                  </FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    id={`building-form-house-${index}`}
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
              name={`buildings.${index}.other`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`building-form-other-${index}`}>
                    Other Details
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={`building-form-other-${index}`}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
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
              append({ propertyId, name: "", street: "", house: 0, other: "" })
            }
          >
            Add Building
          </Button>
        </article>
      </form>
      <DialogFooter>
        <SpinnerButton
          variant="default"
          type="submit"
          form="building-form"
          loading={form.formState.isSubmitting}
          disabled={form.formState.isSubmitting}
        >
          Next
        </SpinnerButton>
      </DialogFooter>
    </>
  );
}
