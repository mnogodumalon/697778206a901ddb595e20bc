import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import GewohnheitenVerwaltungPage from '@/pages/GewohnheitenVerwaltungPage';
import TaeglicherCheckInPage from '@/pages/TaeglicherCheckInPage';
import TaeglicheEintraegePage from '@/pages/TaeglicheEintraegePage';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="gewohnheiten-verwaltung" element={<GewohnheitenVerwaltungPage />} />
          <Route path="taeglicher-check-in" element={<TaeglicherCheckInPage />} />
          <Route path="taegliche-eintraege" element={<TaeglicheEintraegePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}