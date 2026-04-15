import { Button, Card, CardBody, Switch } from "@heroui/react";

type BootstrapStepProps = {
  shouldAssignData: boolean;
  shouldAssignAdmins: boolean;
  selectedCompanyId: string;
  bootstrapDone: boolean;
  bootstrapPending: boolean;
  onAssignDataChange: (value: boolean) => void;
  onAssignAdminsChange: (value: boolean) => void;
  onRunBootstrap: () => void;
  onBack: () => void;
  onContinue: () => void;
};

export const BootstrapStep = ({
  shouldAssignData,
  shouldAssignAdmins,
  selectedCompanyId,
  bootstrapDone,
  bootstrapPending,
  onAssignDataChange,
  onAssignAdminsChange,
  onRunBootstrap,
  onBack,
  onContinue,
}: BootstrapStepProps) => {
  return (
    <Card className="bg-dark-100/70 border border-black/10 dark:border-white/10 rounded-[2rem]">
      <CardBody className="p-5 sm:p-6 space-y-4">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
          Paso 2 • Migración inicial
        </p>
        <p className="text-xs text-gray-300 font-bold leading-relaxed">
          Podés migrar datos viejos sin tenant (reservas, usuarios, canchas, etc.) a la
          empresa seleccionada.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 rounded-2xl p-3 border border-black/10 dark:border-white/10">
            <p className="text-xs text-foreground font-bold">Asignar datos operativos sin empresa</p>
            <Switch
              isSelected={shouldAssignData}
              onValueChange={onAssignDataChange}
              color="primary"
              size="sm"
            />
          </div>
          <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 rounded-2xl p-3 border border-black/10 dark:border-white/10">
            <p className="text-xs text-foreground font-bold">Asignar admins sin empresa</p>
            <Switch
              isSelected={shouldAssignAdmins}
              onValueChange={onAssignAdminsChange}
              color="primary"
              size="sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            className="h-12 bg-blue-500 text-white font-black uppercase rounded-2xl"
            isLoading={bootstrapPending}
            onPress={onRunBootstrap}
            isDisabled={!selectedCompanyId}
          >
            Ejecutar
          </Button>
          <Button
            className="h-12 bg-black/10 dark:bg-white/10 text-foreground font-black uppercase rounded-2xl"
            onPress={onBack}
          >
            Volver
          </Button>
          <Button
            className="h-12 bg-primary text-black font-black uppercase rounded-2xl"
            onPress={onContinue}
          >
            Continuar
          </Button>
        </div>

        {bootstrapDone && (
          <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">
            Bootstrap completado correctamente.
          </p>
        )}
      </CardBody>
    </Card>
  );
};
