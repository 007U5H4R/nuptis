import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider, useApp } from './store';
import Shell from './components/Shell';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Onboarding from './screens/Onboarding';
import Weddings from './screens/Weddings';
import Procurement from './screens/Procurement';
import StageView from './screens/StageView';
import Contingency from './screens/Contingency';
import Payments from './screens/Payments';
import SettingsScreen from './screens/Settings';

function Guarded() {
  const { state } = useApp();
  if (!state.session) return <Navigate to="/login" replace />;
  return <Shell />;
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Guarded />}>
            <Route index element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/weddings" element={<Weddings />} />
            <Route path="/procurement" element={<Procurement />} />
            <Route path="/procurement/:woId" element={<StageView />} />
            <Route path="/contingency" element={<Contingency />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
