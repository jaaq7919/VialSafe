'use server';

export type Accident = {
  location: string;
  date: Date;
  cause: string;
};

// This is a mock function for now.
export async function addAccident(accidentData: Accident) {
  console.log("Nuevo accidente registrado (simulación):", accidentData);
  // Simulate a successful API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, id: `mock_${new Date().getTime()}` };
}

// This is a mock function for now.
export async function getAccidentsCount() {
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 100));
    // Return a static number for the dashboard
    return 146;
}
