import PropertyDialog from "./PropertyDialog";
import { Button } from "./ui/button";
import { Dialog, DialogTrigger } from "./ui/dialog";

export default function PropertyDialogTrigger() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">Add Property</Button>
      </DialogTrigger>
      <PropertyDialog />
    </Dialog>
  );
}
