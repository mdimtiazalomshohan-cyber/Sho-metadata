import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Projects } from './pages/Projects';
import { Settings } from './pages/Settings';
import { ApiManager } from './pages/ApiManager';
import { ProjectDetails } from './pages/ProjectDetails';
import { useEffect, useState } from 'react';
import { getSettings } from './lib/db';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    getSettings().then((s) => {
      if (s.theme === 'light') {
         document.documentElement.classList.remove('dark');
         setTheme('light');
      } else {
         document.documentElement.classList.add('dark');
         setTheme('dark');
      }
    });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="api-manager" element={<ApiManager />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
