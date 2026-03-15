import { appRouter } from "@/routes/app-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouterProvider } from "react-router-dom";

function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={appRouter} />
    </TooltipProvider>
  );
}

export default App;
