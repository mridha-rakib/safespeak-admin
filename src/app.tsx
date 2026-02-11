import { appRouter } from "@/routes/app-router";
import { RouterProvider } from "react-router-dom";

function App() {
  return <RouterProvider router={appRouter} />;
}

export default App;
