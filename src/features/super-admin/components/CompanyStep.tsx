import { Button, Card, CardBody, Input } from "@heroui/react";

type CompanyStepProps = {
  companies: any[];
  selectedCompanyId: string;
  companyName: string;
  companySlug: string;
  normalizedSuggestedSlug: string;
  companyNameError: string;
  slugError: string;
  createCompanyPending: boolean;
  onSelectCompany: (id: string) => void;
  onCompanyNameChange: (value: string) => void;
  onCompanySlugChange: (value: string) => void;
  onCreateCompany: () => void;
  onContinue: () => void;
};

export const CompanyStep = ({
  companies,
  selectedCompanyId,
  companyName,
  companySlug,
  normalizedSuggestedSlug,
  companyNameError,
  slugError,
  createCompanyPending,
  onSelectCompany,
  onCompanyNameChange,
  onCompanySlugChange,
  onCreateCompany,
  onContinue,
}: CompanyStepProps) => {
  return (
    <Card className="bg-dark-100/70 border border-white/10 rounded-[2rem]">
      <CardBody className="p-5 sm:p-6 space-y-4">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
          Paso 1 • Empresa
        </p>

        {companies.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-300 font-bold">
              Ya existen empresas. Seleccioná una para continuar o creá otra.
            </p>
            <select
              value={selectedCompanyId}
              onChange={(event) => onSelectCompany(event.target.value)}
              className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white font-bold w-full"
            >
              <option value="" disabled>
                Seleccionar empresa
              </option>
              {companies.map((company: any) => (
                <option key={company._id} value={company._id} className="text-black">
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Nombre de empresa"
          labelPlacement="outside"
          placeholder="Ej: PADEXA Centro"
          value={companyName}
          onValueChange={onCompanyNameChange}
          isInvalid={Boolean(companyNameError)}
          errorMessage={companyNameError}
          classNames={{
            inputWrapper: "bg-white/5 border-white/10 h-12 rounded-2xl",
            input: "text-white font-bold",
            label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
          }}
        />

        <Input
          label="Slug"
          labelPlacement="outside"
          placeholder="padexa-centro"
          value={companySlug}
          onValueChange={onCompanySlugChange}
          isInvalid={Boolean(slugError)}
          errorMessage={slugError}
          description={`Sugerido: ${normalizedSuggestedSlug || "(ingresá nombre)"}`}
          classNames={{
            inputWrapper: "bg-white/5 border-white/10 h-12 rounded-2xl",
            input: "text-white font-bold",
            label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
            description: "text-gray-500 text-[10px]",
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            className="h-12 bg-primary text-black font-black uppercase rounded-2xl"
            isLoading={createCompanyPending}
            onPress={onCreateCompany}
          >
            Crear Empresa
          </Button>
          <Button
            className="h-12 bg-white/10 text-white font-black uppercase rounded-2xl"
            onPress={onContinue}
            isDisabled={!selectedCompanyId}
          >
            Continuar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
