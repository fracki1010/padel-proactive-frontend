import { Input, Select, SelectItem } from "@heroui/react";

const COUNTRIES = [
  { code: "AR", name: "Argentina",  dial: "54",  placeholder: "9 11 1234-5678",  flag: "🇦🇷" },
  { code: "UY", name: "Uruguay",    dial: "598", placeholder: "9 1234 5678",     flag: "🇺🇾" },
  { code: "CL", name: "Chile",      dial: "56",  placeholder: "9 1234 5678",     flag: "🇨🇱" },
  { code: "BR", name: "Brasil",     dial: "55",  placeholder: "11 91234-5678",   flag: "🇧🇷" },
  { code: "PY", name: "Paraguay",   dial: "595", placeholder: "981 123 456",     flag: "🇵🇾" },
  { code: "BO", name: "Bolivia",    dial: "591", placeholder: "7123 4567",       flag: "🇧🇴" },
  { code: "PE", name: "Perú",       dial: "51",  placeholder: "912 345 678",     flag: "🇵🇪" },
  { code: "CO", name: "Colombia",   dial: "57",  placeholder: "312 345 6789",    flag: "🇨🇴" },
  { code: "MX", name: "México",     dial: "52",  placeholder: "55 1234 5678",    flag: "🇲🇽" },
  { code: "ES", name: "España",     dial: "34",  placeholder: "612 345 678",     flag: "🇪🇸" },
];

export interface PhoneValue {
  countryCode: string; // ej: "54"
  localNumber: string; // lo que tipea el usuario
  dialEntry: string;   // código de país con "+" para mostrar
}

interface Props {
  value: PhoneValue;
  onChange: (v: PhoneValue) => void;
  isDisabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export const PhoneInput = ({ value, onChange, isDisabled, size = "sm" }: Props) => {
  const selected = COUNTRIES.find((c) => c.dial === value.countryCode) ?? COUNTRIES[0];

  const handleCountryChange = (keys: any) => {
    const dial = String([...keys][0] ?? "54");
    const country = COUNTRIES.find((c) => c.dial === dial) ?? COUNTRIES[0];
    onChange({ countryCode: country.dial, localNumber: "", dialEntry: `+${country.dial}` });
  };

  return (
    <div className="flex gap-2">
      <Select
        size={size}
        selectedKeys={new Set([selected.dial])}
        onSelectionChange={handleCountryChange}
        isDisabled={isDisabled}
        className="w-[110px] shrink-0"
        aria-label="País"
        renderValue={() => (
          <span className="flex items-center gap-1 text-sm">
            <span>{selected.flag}</span>
            <span className="text-default-500">+{selected.dial}</span>
          </span>
        )}
      >
        {COUNTRIES.map((c) => (
          <SelectItem key={c.dial} textValue={`${c.flag} +${c.dial} ${c.name}`}>
            <span className="flex items-center gap-2">
              <span>{c.flag}</span>
              <span className="text-xs text-default-500">+{c.dial}</span>
              <span className="text-sm">{c.name}</span>
            </span>
          </SelectItem>
        ))}
      </Select>

      <Input
        size={size}
        type="tel"
        placeholder={selected.placeholder}
        value={value.localNumber}
        onValueChange={(v) =>
          onChange({ ...value, localNumber: v, dialEntry: `+${selected.dial}` })
        }
        isDisabled={isDisabled}
        className="flex-1"
        aria-label="Número de teléfono"
      />
    </div>
  );
};

export const defaultPhone = (): PhoneValue => ({
  countryCode: "54",
  localNumber: "",
  dialEntry: "+54",
});
