"use client";

import { useState } from "react";
import * as d3 from "d3";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, BarChart, LineChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Define colors outside the component to avoid recreating them
const COMPANY_COLORS = [
  "#1f77b4", // blue
  "#ff7f0e", // orange
  "#2ca02c", // green
  "#d62728", // red
  "#9467bd", // purple
];

/**
 * Controls panel for chart interaction
 */
const ChartControls = ({
  darkMode,
  setDarkMode,
  companies,
  visibleCompanies,
  toggleCompany,
  dataPoints,
  handleDataPointsChange,
  generateRandomData,
  chartType,
  setChartType,
  filteredMetric,
  handleFilterChange,
  timeRange,
  setTimeRange,
}) => {
  const [showControls, setShowControls] = useState(true);

  // Get color for a company
  const getCompanyColor = (company) => {
    const index = companies.indexOf(company);
    return COMPANY_COLORS[index] || "#666666";
  };

  return (
    <Card
      className={`p-6 ${
        darkMode ? "bg-gray-800" : "bg-white"
      } shadow-lg rounded-xl`}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-xl">Chart Settings</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowControls(!showControls)}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2"
          >
            {showControls ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </div>

        {showControls && (
          <div className="space-y-8">
            {/* Chart Type Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Chart Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={chartType === "line" ? "default" : "outline"}
                  onClick={() => setChartType("line")}
                  className={`w-full py-6 ${
                    chartType === "line"
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                >
                  <LineChart className="w-5 h-5 mr-2" />
                  Line
                </Button>
                <Button
                  variant={chartType === "bar" ? "default" : "outline"}
                  onClick={() => setChartType("bar")}
                  className={`w-full py-6 ${
                    chartType === "bar"
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                >
                  <BarChart className="w-5 h-5 mr-2" />
                  Bar
                </Button>
              </div>
            </div>

            <Separator />

            {/* Data Display Options */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Data Metric</Label>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={filteredMetric === "price" ? "default" : "outline"}
                  onClick={() => handleFilterChange("price")}
                  className={`w-full py-6 ${
                    filteredMetric === "price"
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                >
                  Price
                </Button>
                <Button
                  variant={filteredMetric === "volume" ? "default" : "outline"}
                  onClick={() => handleFilterChange("volume")}
                  className={`w-full py-6 ${
                    filteredMetric === "volume"
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                >
                  Volume
                </Button>
                <Button
                  variant={filteredMetric === "change" ? "default" : "outline"}
                  onClick={() => handleFilterChange("change")}
                  className={`w-full py-6 ${
                    filteredMetric === "change"
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                >
                  Change %
                </Button>
              </div>
            </div>

            <Separator />

            {/* Time Range Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Time Range</Label>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={timeRange === "day" ? "default" : "outline"}
                  onClick={() => setTimeRange("day")}
                  className={`w-full py-6 ${
                    timeRange === "day"
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                >
                  Day
                </Button>
                <Button
                  variant={timeRange === "week" ? "default" : "outline"}
                  onClick={() => setTimeRange("week")}
                  className={`w-full py-6 ${
                    timeRange === "week"
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                >
                  Week
                </Button>
                <Button
                  variant={timeRange === "month" ? "default" : "outline"}
                  onClick={() => setTimeRange("month")}
                  className={`w-full py-6 ${
                    timeRange === "month"
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                >
                  Month
                </Button>
              </div>
            </div>

            <Separator />

            {/* Data Points Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Data Points</Label>
              <div className="grid grid-cols-3 gap-4">
                {[15, 30, 60].map((points) => (
                  <Button
                    key={points}
                    variant={dataPoints === points ? "default" : "outline"}
                    onClick={() => handleDataPointsChange([points])}
                    className={`w-full py-6 ${
                      dataPoints === points
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    }`}
                  >
                    {points}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Company Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Companies</Label>
              <div className="grid grid-cols-2 gap-4">
                {companies.map((company) => (
                  <Button
                    key={company}
                    variant={
                      visibleCompanies.includes(company) ? "default" : "outline"
                    }
                    onClick={() => toggleCompany(company)}
                    className={`justify-start py-6 ${
                      visibleCompanies.includes(company)
                        ? "ring-2 ring-offset-2"
                        : ""
                    }`}
                    style={{
                      borderColor: getCompanyColor(company),
                      ...(visibleCompanies.includes(company) && {
                        backgroundColor: getCompanyColor(company),
                        ringColor: getCompanyColor(company),
                      }),
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-full mr-3"
                      style={{
                        backgroundColor: visibleCompanies.includes(company)
                          ? "white"
                          : getCompanyColor(company),
                        border: `2px solid ${
                          visibleCompanies.includes(company)
                            ? "white"
                            : getCompanyColor(company)
                        }`,
                      }}
                    />
                    <span
                      className={
                        visibleCompanies.includes(company) ? "text-white" : ""
                      }
                    >
                      {company}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Theme and Data Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                <span className="font-medium">Dark Mode</span>
              </div>
              <Button
                onClick={generateRandomData}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                Generate New Data
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChartControls;
