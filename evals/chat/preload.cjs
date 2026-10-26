// Fuera de Next, `import "server-only"` no resuelve (Next lo provee con un
// alias interno). El eval corre código de servidor a propósito, así que acá se
// reemplaza por un módulo vacío. Solo para scripts: la app no pasa por acá.
// CommonJS a propósito: lo carga `tsx --require` antes que todo.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Module = require("node:module");

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, ...rest) {
  if (request === "server-only") return require.resolve("./server-only-stub.cjs");
  return originalResolve.call(this, request, ...rest);
};
