// Simulate Frontend Logic in Node.js
const selectedProyecto = 0 // "Sin Asignación"
const selectedDate = '2026-02-03'

// Original Condition (Simulated)
const oldDisabled = !selectedProyecto || !selectedDate
console.log('Old Condition (!selectedProyecto):', oldDisabled) // Expected: true (Disabled)

// New Condition (Simulated)
const newDisabled = selectedProyecto === null || !selectedDate
console.log('New Condition (selectedProyecto === null):', newDisabled) // Expected: false (Enabled)

if (newDisabled === false) {
  console.log('--- Verification Success: Button is ENABLED for ID 0 ---')
} else {
  console.log('--- Verification Failed: Button is DISABLED for ID 0 ---')
}
