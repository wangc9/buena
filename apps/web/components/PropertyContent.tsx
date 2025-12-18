"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import z from "zod";
import { PropertySchema } from "@cw/schema";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import WEGIcon from "@/public/WEG.png";
import MVIcon from "@/public/MV.png";
import Image from "next/image";
import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import { SpinnerButton } from "./ui/SpinnerButton";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { CircleCheck, CircleX } from "lucide-react";
import { Spinner } from "./ui/spinner";

export default function PropertyContent({
  setStep,
  setPropertyId,
  setPropertyName,
}: {
  setStep: Dispatch<SetStateAction<"property" | "building" | "unit">>;
  setPropertyId: Dispatch<SetStateAction<string>>;
  setPropertyName: Dispatch<SetStateAction<string>>;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof PropertySchema>>({
    resolver: zodResolver(PropertySchema),
    defaultValues: {
      type: "WEG",
      name: "",
      manager: "",
      accountant: "",
      url: "",
    },
  });

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setLoading(true);
    const files = e.target.files;
    if (files) {
      const file = files[0];
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/file`, {
        method: "POST",
        body: JSON.stringify({
          contentType: file.type,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data: { url: string; key: string } = await result.json();
      if (data.url) {
        const s3UploadResult = await fetch(data.url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!s3UploadResult.ok) throw new Error("S3 upload failed");
        form.setValue("url", `${process.env.NEXT_PUBLIC_S3_URL}/${data.key}`);
      }
    }
    setLoading(false);
  }

  async function onSubmit(data: z.infer<typeof PropertySchema>) {
    try {
      const result = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/property`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const res: { id: string; name: string } = await result.json();
      setPropertyId(res.id);
      setPropertyName(res.name);
      setStep("building");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>New Property</DialogTitle>
        <DialogDescription>Step 1/3 - Property Details</DialogDescription>
      </DialogHeader>
      <form id="property-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="property-form-type">
                  Property Type
                </FieldLabel>
                <article className="flex items-center justify-between">
                  <Button
                    className={
                      field.value === "WEG"
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }
                    variant="default"
                    size="icon-xl"
                    type="button"
                    onClick={() => field.onChange("WEG")}
                  >
                    <Image src={WEGIcon} alt="WEG" width={150} height={150} />
                  </Button>
                  <Button
                    className={
                      field.value === "MV"
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }
                    variant="default"
                    size="icon-xl"
                    type="button"
                    onClick={() => field.onChange("MV")}
                  >
                    <Image src={MVIcon} alt="MV" width={150} height={150} />
                  </Button>
                </article>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="property-form-name">
                  Property Name
                </FieldLabel>
                <Input
                  {...field}
                  id="property-form-name"
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
            name="manager"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="property-form-manager">
                  Manager Name
                </FieldLabel>
                <Input
                  {...field}
                  id="property-form-manager"
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
            name="accountant"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="property-form-accountant">
                  Accountant Name
                </FieldLabel>
                <Input
                  {...field}
                  id="property-form-accountant"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Field>
            <FieldLabel htmlFor="property-form-file">Property File</FieldLabel>
            <InputGroup>
              <InputGroupInput
                type="file"
                id="property-form-file"
                onChange={onFileChange}
              />
              <InputGroupAddon>
                {loading ? (
                  <Spinner />
                ) : form.getValues("url") === "" ? (
                  <CircleX />
                ) : (
                  <CircleCheck />
                )}
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <SpinnerButton
          variant="default"
          type="submit"
          form="property-form"
          loading={form.formState.isSubmitting}
          disabled={form.formState.isSubmitting}
        >
          Next
        </SpinnerButton>
      </DialogFooter>
    </>
  );
}
