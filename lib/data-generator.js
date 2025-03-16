export const generateStockData = (numPoints = 30, companies = []) => {
  const data = []
  const today = new Date()

  // Generate initial values for each company
  const initialValues = {}
  companies.forEach((company) => {
    // Random starting price between $100 and $500
    initialValues[company] = Math.random() * 400 + 100
  })

  // Generate data points
  for (let i = 0; i < numPoints; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - (numPoints - i - 1))

    const dataPoint = { date: date.toISOString() }

    // Update values for each company
    companies.forEach((company) => {
      // Previous value or initial value
      const prevValue = i === 0 ? initialValues[company] : data[i - 1][company]

      // Random change between -5% and +5%
      const change = prevValue * (Math.random() * 0.1 - 0.05)

      // New value
      dataPoint[company] = prevValue + change
    })

    data.push(dataPoint)
  }

  return data
}

