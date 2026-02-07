import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import MasterUser from './pages/MasterUser';
import MasterSatgas from './pages/MasterSatgas';
import SetupAsset from './pages/SetupAsset';
import DataAset from './pages/DataAset';
import SatgasDetail from './pages/SatgasDetail';
import PengajuanPerbaikan from './pages/PengajuanPerbaikan';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholders for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-gray-500">This module is under development.</p>
  </div>
);

function App() {
  console.log('App rendered');
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/master-user" element={<MasterUser />} />
          <Route path="/master-satgas" element={<MasterSatgas />} />
          <Route path="/data-aset" element={<DataAset />} />
          <Route path="/setup-asset" element={<SetupAsset />} />
          <Route path="/satgas/type/:type" element={<SatgasDetail />} />
          <Route path="/pengajuan" element={<PengajuanPerbaikan />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Placeholder title="404 Not Found" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
