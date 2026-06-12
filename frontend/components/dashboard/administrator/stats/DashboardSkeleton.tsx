export function DashboardSkeleton() {
    const CardSkeleton = () => (
        <div className="w-full h-[300px] rounded-2xl border border-border/60 bg-muted/60" />
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
    );
}
