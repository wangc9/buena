import Image from "next/image";
import Logo from "@/public/buena.svg";
import PropertyTable from "@/components/PropertyTable";
import PropertyDialogTrigger from "@/components/PropertyDialogTrigger";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <header className="flex py-2 px-4 md:py-4 md:px-8">
        <div className="h-10 w-10">
          <Image
            src={Logo}
            alt="Buena logo"
            width={40}
            height={40}
            className="dark:invert"
          />
        </div>
      </header>
      <main className="flex min-h-screen w-full max-w-3xl flex-col self-center items-center justify-between py-32 px-16 gap-y-4">
        <PropertyTable />
        <PropertyDialogTrigger />
      </main>
    </div>
  );
}
