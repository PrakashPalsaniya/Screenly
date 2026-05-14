import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App.jsx";
import store from "./redux/store.js";
import { LocationProvide } from "./context/LocationContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SeatContextProvider } from "./context/SeatContext.jsx";
import ErrorBoundary from "./components/shared/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <Router>
          <LocationProvide>
            <AuthProvider>
              <SeatContextProvider>
                <App />
              </SeatContextProvider>
            </AuthProvider>
          </LocationProvide>
        </Router>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
