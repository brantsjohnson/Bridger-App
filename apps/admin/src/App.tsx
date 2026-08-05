// ============================================
// WHAT THIS FILE DOES (plain English):
// Route map for the admin console. Public login; everything else sits behind
// RequireAuth and the left-nav AdminShell.
// ============================================
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminShell } from './components/AdminShell';
import { RequireAuth } from './components/RequireAuth';
import { CoopAnnouncements } from './pages/CoopAnnouncements';
import { CoopMembers } from './pages/CoopMembers';
import { CoopPortal } from './pages/CoopPortal';
import { Delights } from './pages/Delights';
import { HomeDefaultsPage } from './pages/HomeDefaults';
import { Login } from './pages/Login';
import { QuizEditor } from './pages/QuizEditor';
import { QuizLive } from './pages/QuizLive';
import { QuizRegistry } from './pages/QuizRegistry';
import { NotFoundHits } from './pages/NotFoundHits';
import { ThemedPrompts } from './pages/ThemedPrompts';
import { WeeklyActivity } from './pages/WeeklyActivity';
import { WeeklyRecap } from './pages/WeeklyRecap';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <RequireAuth>
              <AdminShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/quiz-live" replace />} />
          <Route path="/quiz-live" element={<QuizLive />} />
          <Route path="/quizzes" element={<QuizRegistry />} />
          <Route path="/quizzes/:slug" element={<QuizEditor />} />
          <Route path="/activity" element={<WeeklyActivity />} />
          <Route path="/recap" element={<WeeklyRecap />} />
          <Route path="/coop" element={<CoopAnnouncements />} />
          <Route path="/portal" element={<CoopPortal />} />
          <Route path="/members" element={<CoopMembers />} />
          <Route path="/home-defaults" element={<HomeDefaultsPage />} />
          <Route path="/prompts" element={<ThemedPrompts />} />
          <Route path="/delights" element={<Delights />} />
          <Route path="/broken-paths" element={<NotFoundHits />} />
        </Route>

        <Route path="*" element={<Navigate to="/quiz-live" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
