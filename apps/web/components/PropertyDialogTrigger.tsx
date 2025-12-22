"use client";

import { useState } from "react";
import BuildingContent from "./BuildingContent";
import PropertyContent from "./PropertyContent";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import UnitContent from "./UnitContent";

export default function PropertyDialogTrigger() {
  const [open, setOpen] = useState<boolean>(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Add Property</Button>
      </DialogTrigger>
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
            setOpen={setOpen}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
