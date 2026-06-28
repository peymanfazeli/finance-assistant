const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const data = [
  { Date: '2026-01-15', Title: 'Weekly groceries', Category: 'Food & Drinks', Type: 'expense', Amount: 85.5, Notes: 'Costco run' },
  { Date: '2026-01-20', Title: 'Electric bill', Category: 'Bills', Type: 'expense', Amount: 120.0, Notes: 'January bill' },
  { Date: '2026-02-01', Title: 'Salary January', Category: 'Income', Type: 'income', Amount: 5000.0, Notes: 'Monthly salary' },
  { Date: '2026-02-05', Title: 'Gas station', Category: 'Transportation', Type: 'expense', Amount: 45.0, Notes: 'Filled up tank' },
  { Date: '2026-02-10', Title: 'Internet subscription', Category: 'Internet', Type: 'expense', Amount: 60.0, Notes: 'Monthly plan' }
]

const ws = XLSX.utils.json_to_sheet(data)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
const outputPath = path.resolve(__dirname, '..', 'tests', 'fixtures', 'sample.xlsx')
XLSX.writeFile(wb, outputPath)
console.log('Generated:', outputPath)
