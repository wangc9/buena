"use client";
import { useState } from "react";
import { DialogContent } from "./ui/dialog";
import PropertyContent from "./PropertyContent";

export default function PropertyDialog() {
  const [step, setStep] = useState<"property" | "building" | "unit">(
    "property"
  );
  const [propertyId, setPropertyId] = useState<string>("");
  const [propertyName, setPropertyName] = useState<string>("");

  return (
    <DialogContent className="max-h-[80vh] overflow-y-auto overflow-x-hidden">
      {step === "property" && (
        <PropertyContent
          setStep={setStep}
          setPropertyId={setPropertyId}
          setPropertyName={setPropertyName}
        />
      )}
    </DialogContent>
  );
}
