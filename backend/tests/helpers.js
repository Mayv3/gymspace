// Respuesta de Express mínima para testear controllers sin levantar el servidor.
export function crearRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}
