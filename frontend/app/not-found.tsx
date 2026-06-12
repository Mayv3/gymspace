export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="w-full max-w-md bg-card rounded-3xl border border-border/60 shadow-floating px-8 py-12 flex flex-col items-center">
        <h1 className="text-[96px] font-bold leading-none tracking-tighter text-brand-500">404</h1>
        <p className="text-2xl font-bold mt-3 mb-3 text-foreground">
          Uy... no encontramos esta página
        </p>
        <p className="text-sm font-medium mb-8 text-muted-foreground">
          La dirección que ingresaste no existe o fue eliminada. Por favor verificá la URL o volvé a la página principal.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-brand-btn btn-press transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  )
}
