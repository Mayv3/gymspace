import Skeleton from "@mui/material/Skeleton";

export function DashboardSkeleton() {
    const CardSkeleton = () => (
        <Skeleton variant="rounded" width='100%' height={300} />
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
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
