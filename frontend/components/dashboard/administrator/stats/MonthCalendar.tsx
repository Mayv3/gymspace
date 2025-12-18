import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

interface Props {
  year: number;
  month: number; // 0–11
  isActiveDay: (date: string) => boolean;
}

const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];

export const MonthCalendar = ({ year, month, isActiveDay }: Props) => {
  const start = dayjs().year(year).month(month).startOf("month");
  const daysInMonth = start.daysInMonth();

  /**
   * dayjs().day():
   * 0 = domingo
   * 1 = lunes
   *
   * Queremos que lunes sea la primera columna.
   */
  const firstDayIndex = (start.day() + 6) % 7;

  return (
    <div className="border rounded p-2">
      <p className="text-sm font-semibold mb-2 text-center capitalize">
        {start.format("MMMM")}
      </p>

      {/* Encabezado días de la semana */}
      <div className="grid grid-cols-7 gap-1 text-[10px] mb-1 text-center text-muted-foreground">
        {WEEK_DAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Grilla del mes */}
      <div className="grid grid-cols-7 gap-1 text-xs">
        {/* Espacios vacíos antes del día 1 */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Días del mes */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = start.date(i + 1);
          const key = date.format("YYYY-MM-DD");
          const active = isActiveDay(key);

          return (
            <div
              key={key}
              className={`h-7 flex items-center justify-center rounded
                ${
                  active
                    ? "bg-orange-500 text-white"
                    : "bg-muted text-muted-foreground"
                }
              `}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};
