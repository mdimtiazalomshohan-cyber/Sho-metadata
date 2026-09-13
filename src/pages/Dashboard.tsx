import { useEffect, useState } from 'react';
import { getProjects, getProjectImages, getProjectMetadata } from '../lib/db';
import { Layers, Image as ImageIcon, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    images: 0,
    processed: 0,
    warnings: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const projects = await getProjects();
      let totalImages = 0;
      let totalProcessed = 0;
      let totalWarnings = 0;

      for (const p of projects) {
        const images = await getProjectImages(p.id);
        const metadata = await getProjectMetadata(p.id);
        
        totalImages += images.length;
        totalProcessed += images.filter(i => i.status === 'completed').length;
        
        metadata.forEach(m => {
          if (m.releaseStatus === 'Review' || m.people === 'Uncertain' || (m as any).warnings?.length > 0) {
            totalWarnings++;
          }
        });
      }

      setStats({
        projects: projects.length,
        images: totalImages,
        processed: totalProcessed,
        warnings: totalWarnings,
      });
    }
    loadStats();
  }, []);

  const statCards = [
    { label: 'Total Projects', value: stats.projects, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Images', value: stats.images, icon: ImageIcon, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Metadata Ready', value: stats.processed, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Warnings', value: stats.warnings, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of your AI metadata generation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
                <s.icon size={24} strokeWidth={2} />
              </div>
            </div>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
           <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
           <div className="grid grid-cols-2 gap-4">
              <Link to="/upload" className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-indigo-500 transition-colors group">
                 <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} />
                 </div>
                 <span className="font-medium text-sm">Upload Images</span>
              </Link>
              <Link to="/projects" className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-indigo-500 transition-colors group">
                 <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full group-hover:scale-110 transition-transform">
                    <Folder size={24} />
                 </div>
                 <span className="font-medium text-sm">View Projects</span>
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}

import { UploadCloud, Folder } from 'lucide-react';
