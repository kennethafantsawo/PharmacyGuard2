import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
            🏥 Pharmacies de Garde
          </h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-center text-gray-600">
              Application fonctionnelle - Test de base
            </p>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;