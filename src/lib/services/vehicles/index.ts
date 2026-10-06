// Lógica de negocio de vehículos, compartida por los handlers del dashboard y
// las tools del MCP. Acá viven permisos, guards de venta, límite del plan e
// invalidación de cache: un canal nuevo NO reimplementa nada de eso.
export { listVehicles, getVehicle, type ListVehiclesParams } from "./read";
export { createVehicle } from "./create";
export { updateVehicle } from "./update";
export { setVehiclePublished, toggleVehiclePublished, type PublishResult } from "./publish";
export { setVehicleStatus } from "./status";
export { deleteVehicle } from "./delete";
