import { useEffect, useState } from 'react';
import { getProjects, getProjectImages, deleteProject, Project } from '../lib/db';
import { Folder, MoreVertical, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Projects() {
  const [projects, setProjects] = useState<(Project & { imageCount: number })[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const projs = await getProjects();
    const withCounts = await Promise.all(projs.map(async (p) => {
      const imgs = await getProjectImages(p.id);
      return { ...p, imageCount: imgs.length };
    }));
    setProjects(withCounts.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project? All images and metadata will be permanently lost.')) {
      await deleteProject(id);
      loadProjects();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your collections and exports.</p>
        </div>
        <Link to="/upload" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
          New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No projects found. Create one by uploading images.
          </div>
        ) : (
          projects.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Folder size={24} />
                </div>
                <button 
                  onClick={() => handleDelete(p.id)}
                  className="text-slate-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="text-lg font-bold truncate mb-1">{p.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{p.imageCount} images • Edited {new Date(p.updatedAt).toLocaleDateString()}</p>
              
              <Link to={`/projects/${p.id}`} className="flex items-center justify-between w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 transition-colors">
                Open Project
                <ArrowRight size={16} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
