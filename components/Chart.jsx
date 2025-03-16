"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import ChartControls from "./ChartControls";
import Tooltip from "./Tooltip";
import Legend from "./Legend";
import { Card } from "@/components/ui/card";

/**
 * Main Chart component handling D3 integration with React
 * Supports different chart types, animations, and interactive features
 */
const Chart = ({
  darkMode,
  setDarkMode,
  chartType = "line",
  setChartType,
  timeRange = "month",
  setTimeRange,
  filteredMetric = "price",
  setFilteredMetric,
}) => {
  // State for managing chart data and UI
  const [data, setData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [visibleCompanies, setVisibleCompanies] = useState([]);
  const [tooltipData, setTooltipData] = useState(null);
  const [dataPoints, setDataPoints] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  // Refs for D3 elements
  const svgRef = useRef(null);
  const chartRef = useRef(null);

  // Generate initial data
  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      const companyNames = ["Apple", "Google", "Amazon", "Microsoft", "Tesla"];
      setCompanies(companyNames);
      setVisibleCompanies(companyNames);
      generateAndSetData(dataPoints, timeRange);
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

  const generateAndSetData = (points, range) => {
    const newData = generateStockData(points, companies, range);
    setData(newData);
  };

  /**
   * Handles changing the number of data points
   */
  const handleDataPointsChange = (value) => {
    setDataPoints(value[0]);
    generateAndSetData(value[0], timeRange);
  };

  /**
   * Toggles visibility of a company's data
   * @param {string} company - Company name to toggle
   */
  const toggleCompany = (company) => {
    setVisibleCompanies((prev) => {
      if (prev.includes(company)) {
        // Remove company - animate out
        if (chartRef.current) {
          animateLineOut(company);
        }
        return prev.filter((c) => c !== company);
      } else {
        // Add company - animate in
        if (chartRef.current && data.length) {
          setTimeout(() => animateLineIn(company), 50);
        }
        return [...prev, company];
      }
    });
  };

  /**
   * Animate a line out before removing
   * @param {string} company - Company to animate out
   */
  const animateLineOut = (company) => {
    const { svg } = chartRef.current;

    svg
      .select(`.line-${company}`)
      .transition()
      .duration(300)
      .style("opacity", 0);
  };

  /**
   * Animate a line in when adding
   * @param {string} company - Company to animate in
   */
  const animateLineIn = (company) => {
    const { svg } = chartRef.current;

    svg
      .select(`.line-${company}`)
      .style("opacity", 0)
      .transition()
      .duration(500)
      .style("opacity", 1);
  };

  /**
   * Generate new random data
   */
  const generateRandomData = () => {
    generateAndSetData(dataPoints, timeRange);
  };

  /**
   * Handle filter change for metrics
   * @param {string} metric - Metric to filter by
   */
  const handleFilterChange = (metric) => {
    if (setFilteredMetric) {
      setFilteredMetric(metric);
    }
  };

  // D3 chart rendering
  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    try {
      // Clear previous chart
      d3.select(svgRef.current).selectAll("*").remove();

      // Chart dimensions
      const margin = { top: 20, right: 80, bottom: 50, left: 70 };
      const width = svgRef.current.clientWidth - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      // Create SVG
      const svg = d3
        .select(svgRef.current)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Validate dates and values
      const validData = data.filter((d) => {
        const date = new Date(d.date);
        return date instanceof Date && !isNaN(date);
      });

      // X scale (time)
      const x = d3
        .scaleTime()
        .domain(d3.extent(validData, (d) => new Date(d.date)))
        .range([0, width]);

      // Determine y domain based on selected metric
      let yDomain;
      if (filteredMetric === "price") {
        const values = validData.flatMap((d) =>
          visibleCompanies.map((company) => d[company]).filter((v) => !isNaN(v))
        );
        yDomain = [Math.min(...values) * 0.9, Math.max(...values) * 1.1];
      } else if (filteredMetric === "volume") {
        const values = validData.flatMap((d) =>
          visibleCompanies
            .map((company) => d[`${company}_volume`])
            .filter((v) => !isNaN(v))
        );
        yDomain = [0, Math.max(...values) * 1.1];
      } else {
        const values = validData.flatMap((d) =>
          visibleCompanies
            .map((company) => d[`${company}_change`])
            .filter((v) => !isNaN(v))
        );
        const absMax = Math.max(
          Math.abs(Math.min(...values)),
          Math.abs(Math.max(...values))
        );
        yDomain = [-absMax, absMax];
      }

      // Y scale with validation
      const y = d3.scaleLinear().domain(yDomain).range([height, 0]);

      // Color scale
      const color = d3
        .scaleOrdinal()
        .domain(companies)
        .range(d3.schemeCategory10);

      // Add clip path for zoom
      svg
        .append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

      // Create chart group with clip path
      const chartGroup = svg.append("g").attr("clip-path", "url(#clip)");

      // Background for better visualization
      chartGroup
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", darkMode ? "#1f2937" : "#f9fafb")
        .attr("opacity", 0.5);

      // Add grid lines
      chartGroup
        .append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(-height).tickFormat(""))
        .style("stroke", darkMode ? "#374151" : "#e5e7eb")
        .style("stroke-opacity", 0.3);

      chartGroup
        .append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(""))
        .style("stroke", darkMode ? "#374151" : "#e5e7eb")
        .style("stroke-opacity", 0.3);

      // Add X axis with transition
      const xAxis = svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`);

      const updateXAxis = (duration = 750) => {
        xAxis
          .transition()
          .duration(duration)
          .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d")))
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-45)")
          .style("fill", darkMode ? "#e5e7eb" : "#374151");
      };

      updateXAxis(500);

      // Add Y axis with transition
      const yAxis = svg.append("g").attr("class", "y-axis");

      const updateYAxis = (duration = 750) => {
        yAxis
          .transition()
          .duration(duration)
          .call(d3.axisLeft(y).ticks(5))
          .selectAll("text")
          .style("fill", darkMode ? "#e5e7eb" : "#374151");
      };

      updateYAxis(500);

      // Add Y axis label
      const yLabel =
        filteredMetric === "price"
          ? "Stock Price ($)"
          : filteredMetric === "volume"
          ? "Trading Volume"
          : "Price Change (%)";

      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", darkMode ? "#e5e7eb" : "#374151")
        .text(yLabel);

      // Add X axis label
      svg
        .append("text")
        .attr(
          "transform",
          `translate(${width / 2}, ${height + margin.bottom - 10})`
        )
        .style("text-anchor", "middle")
        .style("fill", darkMode ? "#e5e7eb" : "#374151")
        .text("Date");

      // For bar chart, calculate bar width based on data points
      const barWidth =
        (width / data.length / (visibleCompanies.length + 1)) * 0.8;

      // Draw charts for each visible company
      visibleCompanies.forEach((company, companyIndex) => {
        // Get data for the current company and metric
        const metricKey =
          filteredMetric === "price"
            ? company
            : filteredMetric === "volume"
            ? `${company}_volume`
            : `${company}_change`;

        const companyData = validData
          .map((d) => ({
            date: new Date(d.date),
            value: d[metricKey],
          }))
          .filter((d) => !isNaN(d.value));

        if (chartType === "line") {
          // Line generator with defined check
          const line = d3
            .line()
            .x((d) => x(d.date))
            .y((d) => y(d.value))
            .defined((d) => !isNaN(d.value)) // Skip undefined or NaN values
            .curve(d3.curveMonotoneX);

          // Add line with animation
          const path = chartGroup
            .append("path")
            .datum(companyData)
            .attr("class", `line-${company}`)
            .attr("fill", "none")
            .attr("stroke", color(company))
            .attr("stroke-width", 2)
            .attr("d", line);

          // Add data labels
          chartGroup
            .selectAll(`.label-${company}`)
            .data(companyData)
            .enter()
            .append("text")
            .attr("class", `label-${company}`)
            .attr("x", (d) => x(new Date(d.date)))
            .attr("y", (d) => y(d.value) - 10) // Position above the point
            .attr("text-anchor", "middle")
            .attr("fill", color(company))
            .attr("font-size", "10px")
            .style("opacity", 0) // Start invisible
            .text((d) => {
              if (filteredMetric === "price") return `$${d.value.toFixed(2)}`;
              if (filteredMetric === "volume") return d3.format(".2s")(d.value);
              return `${d.value.toFixed(1)}%`;
            })
            .transition()
            .delay((d, i) => i * 100)
            .duration(500)
            .style("opacity", 1);

          // Animate path
          const pathLength = path.node().getTotalLength();
          path
            .attr("stroke-dasharray", pathLength)
            .attr("stroke-dashoffset", pathLength)
            .transition()
            .duration(1000)
            .attr("stroke-dashoffset", 0);

          // Add data points with improved visualization
          const dataPoints = chartGroup
            .selectAll(`.dot-${company}`)
            .data(companyData)
            .enter()
            .append("g")
            .attr("class", `dot-${company}`);

          // Add larger invisible circle for better hover area
          dataPoints
            .append("circle")
            .attr("cx", (d) => x(new Date(d.date)))
            .attr("cy", (d) => y(d.value))
            .attr("r", 12)
            .attr("fill", "transparent")
            .style("cursor", "pointer");

          // Add visible point with animation
          dataPoints
            .append("circle")
            .attr("cx", (d) => x(new Date(d.date)))
            .attr("cy", (d) => y(d.value))
            .attr("r", 0)
            .attr("fill", color(company))
            .attr("stroke", darkMode ? "#1f2937" : "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .transition()
            .delay((d, i) => i * 20)
            .duration(500)
            .attr("r", 4);

          // Add hover effects
          dataPoints
            .on("mouseover", function (event, d) {
              const point = d3.select(this);

              // Enlarge point
              point
                .select("circle:last-child")
                .transition()
                .duration(200)
                .attr("r", 6)
                .attr("stroke-width", 3);

              // Add pulse animation
              point
                .append("circle")
                .attr("cx", x(new Date(d.date)))
                .attr("cy", y(d.value))
                .attr("r", 4)
                .attr("fill", "none")
                .attr("stroke", color(company))
                .attr("stroke-width", 2)
                .attr("opacity", 1)
                .transition()
                .duration(1000)
                .attr("r", 15)
                .attr("opacity", 0)
                .remove();

              // Show tooltip
              setTooltipData({
                company,
                date: d.date,
                value: d.value,
                metric: filteredMetric,
                x: x(new Date(d.date)) + margin.left,
                y: y(d.value) + margin.top,
              });
            })
            .on("mouseout", function () {
              const point = d3.select(this);

              // Reset point size
              point
                .select("circle:last-child")
                .transition()
                .duration(200)
                .attr("r", 4)
                .attr("stroke-width", 2);

              setTooltipData(null);
            });
        } else {
          // Bar chart code with validation
          const bars = chartGroup
            .selectAll(`.bar-${company}`)
            .data(companyData)
            .join("rect")
            .attr("class", `bar-${company}`)
            .attr("x", (d) => {
              const xPos = x(d.date);
              return isNaN(xPos)
                ? 0
                : xPos -
                    barWidth * (visibleCompanies.length / 2) +
                    companyIndex * barWidth;
            })
            .attr("width", barWidth)
            .attr("y", (d) => {
              const value = d.value;
              if (isNaN(value)) return height;
              return filteredMetric === "change" && value < 0 ? y(0) : y(value);
            })
            .attr("height", (d) => {
              const value = d.value;
              if (isNaN(value)) return 0;
              if (filteredMetric === "change") {
                return Math.abs(y(0) - y(value));
              }
              return height - y(value);
            })
            .attr("fill", color(company))
            .attr("rx", 2);

          // Add bar labels
          chartGroup
            .selectAll(`.bar-label-${company}`)
            .data(companyData)
            .join("text")
            .attr("class", `bar-label-${company}`)
            .attr("x", (d) => {
              const xPos = x(d.date);
              return (
                xPos -
                barWidth * (visibleCompanies.length / 2) +
                companyIndex * barWidth +
                barWidth / 2
              );
            })
            .attr("y", (d) => {
              const value = d.value;
              if (isNaN(value)) return height;
              const yPos =
                filteredMetric === "change" && value < 0
                  ? y(0) + Math.abs(y(0) - y(value)) + 15
                  : y(value) - 5;
              return yPos;
            })
            .attr("text-anchor", "middle")
            .attr("fill", darkMode ? "#e5e7eb" : "#374151")
            .attr("font-size", "10px")
            .text((d) => {
              if (filteredMetric === "price") return `$${d.value.toFixed(2)}`;
              if (filteredMetric === "volume") return d3.format(".2s")(d.value);
              return `${d.value.toFixed(1)}%`;
            });
        }
      });

      // Add reference line at 0 for change metric
      if (filteredMetric === "change") {
        chartGroup
          .append("line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", y(0))
          .attr("y2", y(0))
          .attr("stroke", darkMode ? "#e5e7eb" : "#374151")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4,4");
      }

      // Enhanced zoom functionality
      const zoom = d3
        .zoom()
        .scaleExtent([0.5, 20]) // Allow more zoom range
        .translateExtent([
          [-width * 0.5, -height * 0.5],
          [width * 1.5, height * 1.5],
        ]) // Limit pan range
        .extent([
          [0, 0],
          [width, height],
        ])
        .on("zoom", (event) => {
          const transform = event.transform;
          const newX = transform.rescaleX(x);
          const newY = transform.rescaleY(y);

          // Update axes
          xAxis
            .call(
              d3.axisBottom(newX).ticks(5).tickFormat(d3.timeFormat("%b %d"))
            )
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)")
            .style("fill", darkMode ? "#e5e7eb" : "#374151");

          yAxis
            .call(d3.axisLeft(newY).ticks(5))
            .selectAll("text")
            .style("fill", darkMode ? "#e5e7eb" : "#374151");

          // Transform the chart group
          chartGroup.attr("transform", transform);

          // Update grid lines
          svg.selectAll(".grid").call((g) => {
            g.select(".x-grid").call(
              d3.axisBottom(newX).ticks(5).tickSize(-height).tickFormat("")
            );
            g.select(".y-grid").call(
              d3.axisLeft(newY).ticks(5).tickSize(-width).tickFormat("")
            );
          });
        });

      // Add zoom behavior with improved reset
      svg.call(zoom).on("dblclick.zoom", () => {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      });

      // Add zoom instructions
      svg
        .append("text")
        .attr("class", "zoom-instruction")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", darkMode ? "#6b7280" : "#9ca3af")
        .text("Double-click to reset zoom");

      // Store chart reference
      chartRef.current = { svg, x, y, width, height, margin };
    } catch (error) {
      console.error("Error rendering chart:", error);
      // Handle error gracefully - could show an error message to user
    }
  }, [data, visibleCompanies, darkMode, companies, chartType, filteredMetric]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (data.length) {
        // Redraw chart on resize
        generateAndSetData(dataPoints, timeRange);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data, dataPoints, timeRange]);

  // Effect to redraw chart when chart type changes
  useEffect(() => {
    if (data.length) {
      generateAndSetData(dataPoints, timeRange);
    }
  }, [chartType]);

  return (
    <Card className={`p-4 ${darkMode ? "bg-gray-800 border-gray-700" : ""}`}>
      <div className="relative min-h-[400px] md:min-h-[600px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <div className="relative">
                  <svg ref={svgRef} className="w-full h-[300px] md:h-[400px]" />

                  {/* Tooltip */}
                  {tooltipData && (
                    <Tooltip tooltipData={tooltipData} darkMode={darkMode} />
                  )}

                  <div className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Tip: Use mouse wheel to zoom, drag to pan
                  </div>
                </div>
              </div>

              <div className="w-full">
                <ChartControls
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  companies={companies}
                  visibleCompanies={visibleCompanies}
                  toggleCompany={toggleCompany}
                  dataPoints={dataPoints}
                  handleDataPointsChange={handleDataPointsChange}
                  generateRandomData={generateRandomData}
                  chartType={chartType}
                  setChartType={setChartType}
                  filteredMetric={filteredMetric}
                  handleFilterChange={handleFilterChange}
                  timeRange={timeRange}
                  setTimeRange={setTimeRange}
                />
              </div>
            </div>

            <Legend
              companies={companies}
              visibleCompanies={visibleCompanies}
              toggleCompany={toggleCompany}
              darkMode={darkMode}
            />
          </>
        )}
      </div>
    </Card>
  );
};

/**
 * Generates sample stock data for visualization
 * @param {number} numPoints - Number of data points to generate
 * @param {Array} companies - List of company names
 * @param {string} timeRange - Time range to generate data for
 * @returns {Array} Generated stock data
 */
function generateStockData(
  numPoints = 30,
  companies = [],
  timeRange = "month"
) {
  const data = [];
  const today = new Date();

  // Set time range multiplier for data variability
  const rangeMultiplier =
    timeRange === "day"
      ? 0.5
      : timeRange === "week"
      ? 1
      : timeRange === "month"
      ? 2
      : 3;

  // Time unit for x-axis
  const timeUnit = timeRange === "day" ? "hour" : "day";

  // Generate initial values for each company
  const initialValues = {};
  companies.forEach((company) => {
    // Random starting price between $100 and $500
    initialValues[company] = Math.random() * 400 + 100;
  });

  // Generate data points
  for (let i = 0; i < numPoints; i++) {
    const date = new Date(today);

    if (timeRange === "day") {
      // For day view, use hours
      date.setHours(today.getHours() - (numPoints - i - 1));
    } else {
      // For other views, use days
      date.setDate(today.getDate() - (numPoints - i - 1));
    }

    const dataPoint = { date: date.toISOString() };

    // Update values for each company
    companies.forEach((company) => {
      // Previous value or initial value
      const prevValue = i === 0 ? initialValues[company] : data[i - 1][company];

      // Random change between -5% and +5%, adjusted by the range multiplier
      const change = prevValue * (Math.random() * 0.1 - 0.05) * rangeMultiplier;
      const percentChange = (change / prevValue) * 100;

      // New value
      dataPoint[company] = prevValue + change;
      dataPoint[`${company}_change`] = percentChange;

      // Add volume data - random between 10k and 1M shares
      dataPoint[`${company}_volume`] = Math.floor(
        Math.random() * 990000 + 10000
      );
    });

    data.push(dataPoint);
  }

  return data;
}

export default Chart;
