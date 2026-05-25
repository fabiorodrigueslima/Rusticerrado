/**
 * Índice de Utils
 * Exporta todas as funções utilitárias
 */

export * from "./formatters";
export * from "./validators";
export * from "./helpers";
export * from "./constants";

// Importar como objetos
import * as formatters from "./formatters";
import * as validators from "./validators";
import * as helpers from "./helpers";
import * as constants from "./constants";

// Exportar como objeto único
const utils = {
  formatters,
  validators,
  helpers,
  constants,
};

export default utils;
