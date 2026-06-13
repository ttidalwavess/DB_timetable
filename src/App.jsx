import { BrowserRouter, Routes, Route } from "react-router-dom";
import Topbar        from "./components/layout/Topbar";
import SchedulePage  from "./pages/SchedulePage";
import ChessPage     from "./pages/ChessPage";
import SessionPage   from "./pages/SessionPage";
import RoomsPage     from "./pages/RoomsPage";
import TeachersPage  from "./pages/TeachersPage";
import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <Topbar />
      <Routes>
        <Route path="/"           element={<SchedulePage />} />
        <Route path="/chess"      element={<ChessPage />} />
        <Route path="/session"    element={<SessionPage />} />
        <Route path="/rooms"      element={<RoomsPage />} />
        <Route path="/teachers"   element={<TeachersPage />} />
      </Routes>
    </BrowserRouter>
  );
}
