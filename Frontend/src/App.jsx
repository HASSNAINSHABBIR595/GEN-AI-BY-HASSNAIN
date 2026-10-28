import { RouterProvider } from "react-router";
import router from "./app.routes.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { useButtonMotion } from "./animations/useButtonMotion.js";

const App = () => {
  useButtonMotion();

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};
export default App;
