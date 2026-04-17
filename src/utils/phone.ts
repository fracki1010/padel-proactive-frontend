export type PhoneCountryId = "AR" | "CL" | "UY" | "PY" | "BO" | "BR" | "US" | "MX" | "ES";

export type PhoneCountryOption = {
  id: PhoneCountryId;
  label: string;
  dialCode: string;
  storagePrefix: string;
};

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { id: "AR", label: "Argentina", dialCode: "+54", storagePrefix: "549" },
  { id: "CL", label: "Chile", dialCode: "+56", storagePrefix: "56" },
  { id: "UY", label: "Uruguay", dialCode: "+598", storagePrefix: "598" },
  { id: "PY", label: "Paraguay", dialCode: "+595", storagePrefix: "595" },
  { id: "BO", label: "Bolivia", dialCode: "+591", storagePrefix: "591" },
  { id: "BR", label: "Brasil", dialCode: "+55", storagePrefix: "55" },
  { id: "US", label: "Estados Unidos", dialCode: "+1", storagePrefix: "1" },
  { id: "MX", label: "México", dialCode: "+52", storagePrefix: "52" },
  { id: "ES", label: "España", dialCode: "+34", storagePrefix: "34" },
];

export const DEFAULT_PHONE_COUNTRY_ID: PhoneCountryId = "AR";

const onlyDigits = (value: string) => String(value || "").replace(/\D/g, "");

const getCountryById = (countryId: PhoneCountryId) =>
  PHONE_COUNTRY_OPTIONS.find((country) => country.id === countryId) ||
  PHONE_COUNTRY_OPTIONS[0];

export const composePhoneForStorage = (
  countryId: PhoneCountryId,
  localNumber: string,
) => {
  const country = getCountryById(countryId);
  const localDigits = onlyDigits(localNumber);
  const maxLocalDigits = Math.max(0, 15 - country.storagePrefix.length);
  const trimmedLocalDigits = localDigits.slice(0, maxLocalDigits);
  if (!trimmedLocalDigits) return "";
  return `${country.storagePrefix}${trimmedLocalDigits}`;
};

export const parseStoredPhone = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) {
    return {
      countryId: DEFAULT_PHONE_COUNTRY_ID,
      localNumber: "",
    };
  }

  if (digits.startsWith("549")) {
    return {
      countryId: "AR" as PhoneCountryId,
      localNumber: digits.slice(3),
    };
  }

  const matchedCountry = PHONE_COUNTRY_OPTIONS.find(
    (country) =>
      country.id !== "AR" &&
      country.storagePrefix.length >= 2 &&
      digits.startsWith(country.storagePrefix),
  );

  if (matchedCountry) {
    return {
      countryId: matchedCountry.id,
      localNumber: digits.slice(matchedCountry.storagePrefix.length),
    };
  }

  if (digits.startsWith("54")) {
    return {
      countryId: "AR" as PhoneCountryId,
      localNumber: digits.slice(2).replace(/^9/, ""),
    };
  }

  return {
    countryId: DEFAULT_PHONE_COUNTRY_ID,
    localNumber: digits,
  };
};
