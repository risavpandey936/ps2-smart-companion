const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export async function generatePlan(task) {
  const response = await fetch(`${BASE_URL}/generate-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ tasks: task })
  })

  return response.json()
}
