export const stationConfig = {
  name: "Station BENKHALED",
  address: "DR OLD KHALED COMMUNE SIDI AISSA BEN SLIMANE PROVINCE ELKELAA DES SRAGHNA",
  ice: "000826987000072",
  rc: "5669",
  identifiantFiscal: "53654806",
  patente: "54287762",
  phone: "+212 6 61 74 75 42",
} as const;

export type StationConfig = typeof stationConfig;
