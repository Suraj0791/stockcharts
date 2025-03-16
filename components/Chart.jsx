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

      // Chart dimensions with better margins for axis visibility
      const margin = { top: 40, right: 40, bottom: 100, left: 100 }; // Increased margins for better axis visibility
      const width = svgRef.current.clientWidth - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom; // Fixed height for better consistency

      // Create SVG with proper dimensions and background
      const svg = d3
        .select(svgRef.current)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Add a background rectangle for better visibility
      svg
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", darkMode ? "#1a1e2b" : "#f8fafc")
        .attr("rx", 8); // Rounded corners

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

      // FIRST render the axes before any chart content for proper layering

      // Add X axis with clear styling
      const xAxis = svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`) // Position at bottom of chart
        .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat("%b %d")));

      // Style X axis
      xAxis
        .selectAll(".tick line")
        .attr("stroke", darkMode ? "#4b5563" : "#94a3b8")
        .attr("stroke-width", 1);
      xAxis
        .selectAll(".tick text")
        .attr("fill", darkMode ? "#e5e7eb" : "#1e293b")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .attr("dy", "1em");
      xAxis
        .select(".domain")
        .attr("stroke", darkMode ? "#4b5563" : "#64748b")
        .attr("stroke-width", 2);

      // Add Y axis with clear styling
      const yAxis = svg
        .append("g")
        .attr("class", "y-axis")
        .call(
          d3
            .axisLeft(y)
            .ticks(8)
            .tickFormat((d) => {
              if (filteredMetric === "price") return `$${d}`;
              if (filteredMetric === "volume") return d3.format(".2s")(d);
              return `${d}%`;
            })
        );

      // Style Y axis
      yAxis
        .selectAll(".tick line")
        .attr("stroke", darkMode ? "#4b5563" : "#94a3b8")
        .attr("stroke-width", 1);
      yAxis
        .selectAll(".tick text")
        .attr("fill", darkMode ? "#e5e7eb" : "#1e293b")
        .style("font-size", "12px")
        .style("font-weight", "500");
      yAxis
        .select(".domain")
        .attr("stroke", darkMode ? "#4b5563" : "#64748b")
        .attr("stroke-width", 2);

      // Add X axis label
      svg
        .append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height + 60) // Position below axis
        .attr("text-anchor", "middle")
        .style("fill", darkMode ? "#e5e7eb" : "#1e293b")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Date");

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
        .attr("y", -60) // Position to the left of axis
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("fill", darkMode ? "#e5e7eb" : "#1e293b")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(yLabel);

      // Grid lines - more subtle than axes
      svg
        .append("g")
        .attr("class", "grid x-grid")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(8).tickSize(-height).tickFormat(""))
        .call((g) =>
          g
            .selectAll(".tick line")
            .attr("stroke", darkMode ? "#374151" : "#e5e7eb")
            .attr("stroke-opacity", 0.5)
            .attr("stroke-dasharray", "3,3")
        )
        .call((g) => g.select(".domain").remove());

      svg
        .append("g")
        .attr("class", "grid y-grid")
        .call(d3.axisLeft(y).ticks(8).tickSize(-width).tickFormat(""))
        .call((g) =>
          g
            .selectAll(".tick line")
            .attr("stroke", darkMode ? "#374151" : "#e5e7eb")
            .attr("stroke-opacity", 0.5)
            .attr("stroke-dasharray", "3,3")
        )
        .call((g) => g.select(".domain").remove());

      // Create chart group with clip path for content
      const chartGroup = svg
        .append("g")
        .attr("class", "chart-content")
        .attr("clip-path", "url(#clip)");

      // Create dedicated clip path for chart content
      svg
        .append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

      // Function to update X axis with transition
      const updateXAxis = (duration = 750) => {
        xAxis
          .transition()
          .duration(duration)
          .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat("%b %d")))
          .call((g) => {
            g.selectAll(".tick line").attr(
              "stroke",
              darkMode ? "#4b5563" : "#94a3b8"
            );
            g.selectAll(".tick text")
              .attr("fill", darkMode ? "#e5e7eb" : "#1e293b")
              .style("font-size", "12px")
              .attr("dy", "1em");
          });
      };

      // Function to update Y axis with transition
      const updateYAxis = (duration = 750) => {
        yAxis
          .transition()
          .duration(duration)
          .call(
            d3
              .axisLeft(y)
              .ticks(8)
              .tickFormat((d) => {
                if (filteredMetric === "price") return `$${d}`;
                if (filteredMetric === "volume") return d3.format(".2s")(d);
                return `${d}%`;
              })
          )
          .call((g) => {
            g.selectAll(".tick line").attr(
              "stroke",
              darkMode ? "#4b5563" : "#94a3b8"
            );
            g.selectAll(".tick text")
              .attr("fill", darkMode ? "#e5e7eb" : "#1e293b")
              .style("font-size", "12px");
          });
      };

      // Calculate appropriate bar width (for bar charts)
      const barWidth = Math.max(
        5,
        (width / validData.length / visibleCompanies.length) * 0.8
      );

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

          // Add data labels with better clipping and spacing
          const labels = chartGroup
            .append("g")
            .attr("class", `labels-${company}`)
            .attr("clip-path", "url(#clip)"); // Ensure labels are clipped properly

          labels
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
            .attr("pointer-events", "none") // Prevent labels from interfering with mouse events
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
            .attr("r", 10)
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

          // Add bar labels inside the clip path for proper containment
          chartGroup
            .append("g")
            .attr("class", `bar-labels-${company}`)
            .attr("clip-path", "url(#clip)")
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
            .attr("pointer-events", "none") // Prevent labels from interfering with mouse events
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

      // Improved zoom functionality with strict boundary enforcement
      const zoom = d3
        .zoom()
        .scaleExtent([0.8, 4]) // More conservative zoom limits
        .translateExtent([
          [-50, -50], // Allow small overflow for better panning
          [width + 50, height + 50],
        ])
        .on("zoom", (event) => {
          // Apply transform to chart content
          chartGroup.attr("transform", event.transform);

          // Update axes with the transformed scales
          const newX = event.transform.rescaleX(x);
          const newY = event.transform.rescaleY(y);

          // Update X axis
          xAxis.call(
            d3.axisBottom(newX).ticks(8).tickFormat(d3.timeFormat("%b %d"))
          );

          // Update Y axis
          yAxis.call(
            d3
              .axisLeft(newY)
              .ticks(8)
              .tickFormat((d) => {
                if (filteredMetric === "price") return `$${d}`;
                if (filteredMetric === "volume") return d3.format(".2s")(d);
                return `${d}%`;
              })
          );

          // Update grid lines
          svg
            .select(".x-grid")
            .call(d3.axisBottom(newX).ticks(8).tickSize(-height).tickFormat(""))
            .call((g) => g.select(".domain").remove());

          svg
            .select(".y-grid")
            .call(d3.axisLeft(newY).ticks(8).tickSize(-width).tickFormat(""))
            .call((g) => g.select(".domain").remove());
        });

      // Enhanced reset zoom button with better visibility
      const resetZoomBtn = svg
        .append("g")
        .attr("class", "reset-zoom-btn")
        .attr("transform", `translate(${width - 40}, 30)`)
        .style("cursor", "pointer")
        .on("click", () => {
          svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
        });

      resetZoomBtn
        .append("rect")
        .attr("width", 32)
        .attr("height", 32)
        .attr("rx", 6)
        .attr("fill", darkMode ? "#4b5563" : "#e5e7eb")
        .attr("stroke", darkMode ? "#9ca3af" : "#6b7280")
        .attr("stroke-width", 2)
        .attr("fill-opacity", 0.95);

      resetZoomBtn
        .append("text")
        .attr("x", 16)
        .attr("y", 22)
        .attr("text-anchor", "middle")
        .attr("fill", darkMode ? "#f9fafb" : "#1f2937")
        .style("font-size", "17px")
        .style("font-weight", "bold")
        .text("⟲");

      // Initialize zoom with constrained behavior
      svg
        .call(zoom)
        .call(zoom.transform, d3.zoomIdentity)
        .on("dblclick.zoom", null)
        .style("touch-action", "none");

      // Add zoom instructions with better visibility
      svg
        .append("text")
        .attr("class", "zoom-instruction")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", darkMode ? "#9ca3af" : "#64748b")
        .text("Scroll to zoom, drag to pan");

      // Store chart reference
      chartRef.current = {
        svg,
        x,
        y,
        width,
        height,
        margin,
        xAxis,
        yAxis,
        updateXAxis,
        updateYAxis,
      };
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
