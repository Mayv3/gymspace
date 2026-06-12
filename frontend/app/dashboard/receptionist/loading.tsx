export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500"
        role="status"
        aria-label="Cargando"
      />
    </div>
  )
}
