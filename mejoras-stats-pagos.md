# Mejoras en estadísticas y pagos

Pedido de Anyo (3/11/2026).

## Restricción principal

**No se puede borrar ningún dato.** Ni pagos, ni productos, ni servicios, ni nada existente. Los cambios tienen que ser solo aditivos (nuevas consultas, filtros, columnas nullable). Nada de migraciones destructivas, `DROP`, `DELETE`, ni borrar o recrear tablas.

## Problema

- En las estadísticas, los ingresos de productos y servicios solo se ven agrupados por categoría. No se puede saber cuánto ingresó cada ítem en particular.
- En la sección de **Pagos**, los filtros solo permiten elegir "Gimnasio" y "Clases". No hay forma de filtrar por producto ni por servicio.

## Qué se quiere

1. **Detalle de ingresos por ítem** (no solo por categoría), para calcular mejor gastos e ingresos. Ejemplos:
   - Cuánto se vendió de Powerade.
   - Cuántas antropometrías se vendieron.
2. **Filtros en Pagos** que permitan filtrar por:
   - Producto específico (ej. Powerade).
   - Servicio específico (ej. antropometría).
   - Además de los filtros actuales (Gimnasio, Clases).

## Criterios de aceptación

- [ ] En estadísticas se ve, por cada producto, la cantidad vendida y el ingreso total.
- [ ] En estadísticas se ve, por cada servicio, la cantidad vendida y el ingreso total.
- [ ] En Pagos se puede filtrar por un producto concreto y ver solo esos ingresos.
- [ ] En Pagos se puede filtrar por un servicio concreto y ver solo esos ingresos.
- [ ] Los filtros actuales (Gimnasio, Clases) siguen funcionando.
- [ ] Los totales respetan el rango de fechas que ya se usa en estadísticas y pagos.

## Notas

- Objetivo final: poder calcular mejor gastos e ingresos con más detalle.
- Los dos últimos mensajes (9:25) refuerzan el pedido: poder filtrar esos ingresos dentro de Pagos.
