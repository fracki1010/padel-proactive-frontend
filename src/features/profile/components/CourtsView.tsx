import { Button, Card, CardBody, Input, Switch } from "@heroui/react";
import { ChevronLeft, MapPin } from "lucide-react";

type CourtsViewProps = {
  courts: any[];
  newCourtName: string;
  createCourtPending: boolean;
  onBack: () => void;
  onCourtNameChange: (value: string) => void;
  onCreateCourt: () => void;
  onToggleCourt: (id: string, isActive: boolean) => void;
};

export const CourtsView = ({
  courts,
  newCourtName,
  createCourtPending,
  onBack,
  onCourtNameChange,
  onCreateCourt,
  onToggleCourt,
}: CourtsViewProps) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          onClick={onBack}
          className="bg-black/5 dark:bg-white/5 text-foreground rounded-2xl"
        >
          <ChevronLeft size={20} />
        </Button>
        <h3 className="text-xl font-black text-foreground uppercase italic">
          Mis Canchas
        </h3>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {courts.map((court: any) => (
          <Card
            key={court._id}
            className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-[2rem]"
          >
            <CardBody className="p-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 ${court.isActive ? "bg-primary/10 text-primary" : "bg-black/5 dark:bg-white/5 text-gray-500"} rounded-2xl flex items-center justify-center transition-colors`}
                >
                  <MapPin size={24} />
                </div>
                <div>
                  <p
                    className={`font-bold ${court.isActive ? "text-foreground" : "text-gray-500"} text-lg transition-colors`}
                  >
                    {court.name}
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    Estado: {court.isActive ? "Activa" : "Inactiva"}
                  </p>
                </div>
              </div>
              <Switch
                isSelected={court.isActive}
                onValueChange={(value) => onToggleCourt(court._id, value)}
                color="primary"
                size="sm"
              />
            </CardBody>
          </Card>
        ))}
        <div className="mt-2 xl:col-span-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
          <Input
            value={newCourtName}
            onValueChange={onCourtNameChange}
            placeholder="Nombre de la nueva cancha"
            classNames={{
              inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-14 rounded-2xl px-4",
              input: "text-foreground font-bold",
            }}
          />
          <Button
            className="h-14 bg-primary text-black font-black rounded-2xl uppercase"
            onPress={onCreateCourt}
            isLoading={createCourtPending}
          >
            Añadir Cancha
          </Button>
        </div>
      </div>
    </div>
  );
};
