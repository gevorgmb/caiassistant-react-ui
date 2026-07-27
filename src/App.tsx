import { AuthPanel } from "./components/AuthPanel";
import "./App.css";

function App() {
  return (
    <main className="app">
      <header className="app-header">
        <p className="brand">Clerk AI Assistant</p>
        <p className="subtitle">React + TypeScript gRPC-Web client</p>
      </header>
      <AuthPanel />
    </main>
  );
}

export default App;
