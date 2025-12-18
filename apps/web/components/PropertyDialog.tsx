"use client";
import { useState } from "react";
import { DialogContent } from "./ui/dialog";
import PropertyContent from "./PropertyContent";
import BuildingContent from "./BuildingContent";
import UnitContent from "./UnitContent";

export default function PropertyDialog() {
  const [step, setStep] = useState<"property" | "building" | "unit">(
    "property"
  );
  const [propertyId, setPropertyId] = useState<string>("");
  const [propertyName, setPropertyName] = useState<string>("");
  const [buildings, setBuildings] = useState<
    {
      id: string;
      name: string;
    }[]
  >([]);

  return (
    <DialogContent className="max-h-[80vh] overflow-y-auto overflow-x-hidden">
      {step === "property" && (
        <PropertyContent
          setStep={setStep}
          setPropertyId={setPropertyId}
          setPropertyName={setPropertyName}
        />
      )}
      {step === "building" && (
        <BuildingContent
          setStep={setStep}
          propertyId={propertyId}
          propertyName={propertyName}
          setBuildings={setBuildings}
        />
      )}
      {step === "unit" && (
        <UnitContent
          setStep={setStep}
          propertyName={propertyName}
          buildings={buildings}
        />
      )}
    </DialogContent>
  );
}
