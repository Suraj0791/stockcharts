"use client";

import { format } from "date-fns";

const Tooltip = ({ tooltipData, darkMode }) => {
  if (!tooltipData) return null;

  const { company, date, value, metric, x, y } = tooltipData;

  const formatValue = (value, metric) => {
    if (metric === "price") return `$${value.toFixed(2)}`;
    if (metric === "volume")
      return new Intl.NumberFormat("en-US", { notation: "compact" }).format(
        value
      );
    return `${value.toFixed(1)}%`;
  };

  return (
    <div
      className={`absolute z-50 pointer-events-none transform -translate-x-1/2 ${
        y > 300 ? "-translate-y-full -mt-2" : "translate-y-2"
      }`}
      style={{ left: x, top: y }}
    >
      <div
        className={`
          px-4 py-3 rounded-lg shadow-lg border
          ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-200 text-gray-900"
          }
        `}
      >
        <div className="flex flex-col gap-1">
          <div className="font-bold text-sm">{company}</div>
          <div className="text-xs opacity-80">
            {format(new Date(date), "MMM d, yyyy")}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs opacity-70 capitalize">{metric}:</span>
            <span
              className={`font-mono font-medium ${
                metric === "change"
                  ? value > 0
                    ? "text-green-500"
                    : value < 0
                    ? "text-red-500"
                    : ""
                  : ""
              }`}
            >
              {formatValue(value, metric)}
            </span>
          </div>
        </div>
      </div>
      <div
        className={`
          w-3 h-3 rotate-45 absolute left-1/2 
          ${y > 300 ? "bottom-full -mb-1.5" : "-mt-1.5"}
          -translate-x-1/2
          ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }
          border-r border-b
        `}
      />
    </div>
  );
};

export default Tooltip;
