"use client";

import { useState, useEffect } from "react";
import Chart from "./Chart";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart3 } from "lucide-react";

/**
 * Main dashboard component that contains multiple charts
 */
const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [chartType, setChartType] = useState("line");
  const [timeRange, setTimeRange] = useState("month");
  const [filteredMetric, setFilteredMetric] = useState("price");

  // Parse URL params for initial state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get("chartType");
    const rangeParam = params.get("timeRange");
    const metricParam = params.get("metric");

    if (typeParam && ["line", "bar"].includes(typeParam)) {
      setChartType(typeParam);
    }

    if (rangeParam && ["day", "week", "month"].includes(rangeParam)) {
      setTimeRange(rangeParam);
    }

    if (metricParam && ["price", "volume", "change"].includes(metricParam)) {
      setFilteredMetric(metricParam);
    }
  }, []);

  // Update body class for dark mode
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div
      className={`transition-colors duration-300 min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
      }`}
    >
      <div className="container mx-auto py-8 px-4">
        <Card
          className={`mb-8 overflow-hidden ${
            darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                {chartType === "line" ? (
                  <LineChart className="w-6 h-6 text-primary" />
                ) : (
                  <BarChart3 className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                  Stock Market Dashboard
                </CardTitle>
                <CardDescription
                  className={`mt-1 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Interactive financial data visualization with multiple chart
                  types
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p
              className={`text-lg leading-relaxed ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              This dashboard visualizes stock market data with interactive
              features. You can zoom, pan, toggle between different companies,
              and view the data as line or bar charts. Use the controls to
              customize the view and analyze different metrics.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="w-full">
            <h2
              className={`text-xl font-bold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Stock Price Trends
            </h2>
            <Chart
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              chartType={chartType}
              setChartType={setChartType}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              filteredMetric={filteredMetric}
              setFilteredMetric={setFilteredMetric}
            />
          </div>

          <div className="w-full">
            <h2
              className={`text-xl font-bold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Trading Volume Comparison
            </h2>
            <Chart
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              chartType={chartType}
              setChartType={setChartType}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              filteredMetric={filteredMetric}
              setFilteredMetric={setFilteredMetric}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
