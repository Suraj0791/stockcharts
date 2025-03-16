"use client"

import { useState, useEffect, useRef } from "react"
import * as d3 from "d3"
import { generateStockData } from "@/lib/data-generator"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ChevronDown, ChevronUp } from "lucide-react"

const StockChart = () => {
  // State for data and UI controls
  const [data, setData] = useState([])
  const [companies, setCompanies] = useState([])
  const [visibleCompanies, setVisibleCompanies] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [tooltipData, setTooltipData] = useState(null)
  const [dataPoints, setDataPoints] = useState(30)
  const [showControls, setShowControls] = useState(true)

  // Refs for D3 elements
  const svgRef = useRef(null)
  const tooltipRef = useRef(null)
  const chartRef = useRef(null)

  // Generate initial data
  useEffect(() => {
    const companyNames = ["Apple", "Google", "Amazon", "Microsoft", "Tesla"]
    setCompanies(companyNames)
    setVisibleCompanies(companyNames)
    updateData(dataPoints)
  }, [])

  // Update data with specified number of points
  const updateData = (points) => {
    const newData = generateStockData(points, companies)
    setData(newData)
  }

  // Handle data point slider change
  const handleDataPointsChange = (value) => {
    setDataPoints(value[0])
    updateData(value[0])
  }

  // Toggle company visibility
  const toggleCompany = (company) => {
    if (visibleCompanies.includes(company)) {
      setVisibleCompanies(visibleCompanies.filter((c) => c !== company))
    } else {
      setVisibleCompanies([...visibleCompanies, company])
    }
  }

  // Generate random data
  const generateRandomData = () => {
    updateData(dataPoints)
  }

  // D3 chart rendering
  useEffect(() => {
    if (!data.length || !svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Chart dimensions
    const margin = { top: 20, right: 80, bottom: 50, left: 70 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // X scale (time)
    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.date)))
      .range([0, width])

    // Y scale (price)
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => Math.min(...companies.map((company) => d[company]))) * 0.9,
        d3.max(data, (d) => Math.max(...companies.map((company) => d[company]))) * 1.1,
      ])
      .range([height, 0])

    // Line generator
    const line = d3
      .line()
      .x((d) => x(new Date(d.date)))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX)

    // Add X axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d")))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("fill", darkMode ? "#e5e7eb" : "#374151")

    // Add Y axis
    svg
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", darkMode ? "#e5e7eb" : "#374151")

    // Add Y axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", darkMode ? "#e5e7eb" : "#374151")
      .text("Stock Price ($)")

    // Add X axis label
    svg
      .append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .style("fill", darkMode ? "#e5e7eb" : "#374151")
      .text("Date")

    // Color scale
    const color = d3.scaleOrdinal().domain(companies).range(d3.schemeCategory10)

    // Add clip path for zoom
    svg.append("defs").append("clipPath").attr("id", "clip").append("rect").attr("width", width).attr("height", height)

    // Create chart group with clip path
    const chartGroup = svg.append("g").attr("clip-path", "url(#clip)")

    // Draw lines for each visible company
    visibleCompanies.forEach((company) => {
      const companyData = data.map((d) => ({
        date: d.date,
        value: d[company],
      }))

      // Add line
      chartGroup
        .append("path")
        .datum(companyData)
        .attr("class", `line-${company}`)
        .attr("fill", "none")
        .attr("stroke", color(company))
        .attr("stroke-width", 2)
        .attr("d", line)

      // Add data points
      chartGroup
        .selectAll(`.dot-${company}`)
        .data(companyData)
        .enter()
        .append("circle")
        .attr("class", `dot-${company}`)
        .attr("cx", (d) => x(new Date(d.date)))
        .attr("cy", (d) => y(d.value))
        .attr("r", 4)
        .attr("fill", color(company))
        .style("opacity", 0)
        .on("mouseover", function (event, d) {
          d3.select(this).style("opacity", 1)

          // Show tooltip
          setTooltipData({
            company,
            date: d.date,
            value: d.value,
            x: x(new Date(d.date)) + margin.left,
            y: y(d.value) + margin.top,
          })
        })
        .on("mouseout", function () {
          d3.select(this).style("opacity", 0)
          setTooltipData(null)
        })
    })

    // Add zoom functionality
    const zoom = d3
      .zoom()
      .scaleExtent([1, 5])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (event) => {
        // Update axes
        const newX = event.transform.rescaleX(x)
        svg.select(".x-axis").call(d3.axisBottom(newX).ticks(5).tickFormat(d3.timeFormat("%b %d")))

        // Update lines
        visibleCompanies.forEach((company) => {
          const companyData = data.map((d) => ({
            date: d.date,
            value: d[company],
          }))

          const newLine = d3
            .line()
            .x((d) => newX(new Date(d.date)))
            .y((d) => y(d.value))
            .curve(d3.curveMonotoneX)

          svg.select(`.line-${company}`).attr("d", newLine(companyData))

          // Update dots
          svg.selectAll(`.dot-${company}`).attr("cx", (d) => newX(new Date(d.date)))
        })
      })

    // Add zoom behavior to SVG
    svg.call(zoom)

    // Store chart reference
    chartRef.current = { svg, x, y, width, height, margin }
  }, [data, visibleCompanies, darkMode, companies])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (data.length) {
        updateData(dataPoints)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [data, dataPoints])

  return (
    <div className={`transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
      <Card className={`p-4 ${darkMode ? "bg-gray-800 border-gray-700" : ""}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Stock Price Trends</h2>
          <div className="flex items-center space-x-2">
            <Label htmlFor="dark-mode" className="cursor-pointer">
              Dark Mode
            </Label>
            <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-3/4">
            <div className="relative">
              <svg ref={svgRef} className="w-full" />

              {/* Tooltip */}
              {tooltipData && (
                <div
                  ref={tooltipRef}
                  className={`absolute pointer-events-none p-2 rounded shadow-lg ${darkMode ? "bg-gray-700" : "bg-white border"}`}
                  style={{
                    left: `${tooltipData.x}px`,
                    top: `${tooltipData.y - 70}px`,
                  }}
                >
                  <p className="font-bold">{tooltipData.company}</p>
                  <p>Date: {new Date(tooltipData.date).toLocaleDateString()}</p>
                  <p>Price: ${tooltipData.value.toFixed(2)}</p>
                </div>
              )}

              <div className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                Tip: Use mouse wheel to zoom, drag to pan
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Controls</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowControls(!showControls)}>
                {showControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </div>

            {showControls && (
              <>
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Companies</h4>
                  <div className="space-y-2">
                    {companies.map((company) => (
                      <div key={company} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`company-${company}`}
                          checked={visibleCompanies.includes(company)}
                          onChange={() => toggleCompany(company)}
                          className="mr-2"
                        />
                        <label htmlFor={`company-${company}`} className="flex items-center cursor-pointer">
                          <span
                            className="inline-block w-3 h-3 mr-2 rounded-full"
                            style={{ backgroundColor: d3.schemeCategory10[companies.indexOf(company)] }}
                          ></span>
                          {company}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Data Points: {dataPoints}</h4>
                  <Slider
                    defaultValue={[dataPoints]}
                    max={100}
                    min={10}
                    step={5}
                    onValueChange={handleDataPointsChange}
                  />
                </div>

                <Button onClick={generateRandomData} className="w-full">
                  Generate Random Data
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default StockChart

