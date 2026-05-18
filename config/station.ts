export const stationConfig = {
  name: "Station AFRIQUIA - Al Baraka",
  address: "Route Nationale N1, Km 12, Berrechid, Maroc",
  ice: "002345678000045",
  rc: "12345",
  identifiantFiscal: "45678901",
  patente: "78901234",
  phone: "+212 5 22 33 44 55",
} as const;

export type StationConfig = typeof stationConfig;
