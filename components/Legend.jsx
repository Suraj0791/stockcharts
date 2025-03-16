"use client"

import * as d3 from "d3"

/**
 * Legend component for chart
 * Displays colored boxes for each company with toggle functionality
 */
const Legend = ({ companies, visibleCompanies, toggleCompany, darkMode }) => {
  // Color scale
  const color = d3.scaleOrdinal().domain(companies).range(d3.schemeCategory10)

  return (
    <div className={`mt-4 flex flex-wrap gap-3 justify-center ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
      {companies.map((company) => (
        <div
          key={company}
          className={`flex items-center px-3 py-1 rounded-full cursor-pointer transition-all
                    ${visibleCompanies.includes(company) ? (darkMode ? "bg-gray-700" : "bg-gray-100") : "opacity-50"}`}
          onClick={() => toggleCompany(company)}
        >
          <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: color(company) }}></span>
          {company}
        </div>
      ))}
    </div>
  )
}

export default Legend

