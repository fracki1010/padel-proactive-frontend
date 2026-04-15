import { Card, CardBody } from "@heroui/react";

type SetupProgressProps = {
  step: 1 | 2 | 3;
  progress: number;
};

export const SetupProgress = ({ step, progress }: SetupProgressProps) => {
  return (
    <Card className="bg-dark-100/70 border border-black/10 dark:border-white/10 rounded-[2rem]">
      <CardBody className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
          <span className="text-gray-500">Paso {step} de 3</span>
          <span className="text-primary">{progress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardBody>
    </Card>
  );
};
