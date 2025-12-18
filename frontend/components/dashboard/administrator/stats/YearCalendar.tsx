import dayjs from "dayjs";
import { MonthCalendar } from "./MonthCalendar";

interface Props {
    isActiveDay: (date: string) => boolean;
}

export const YearCalendar = ({ isActiveDay }: Props) => {
    const year = dayjs().year();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, monthIndex) => (
                <MonthCalendar
                    key={monthIndex}
                    year={year}
                    month={monthIndex}
                    isActiveDay={isActiveDay}
                />
            ))}
        </div>
    );
};
