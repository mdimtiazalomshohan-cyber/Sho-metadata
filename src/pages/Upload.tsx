import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateId, formatBytes } from '../lib/utils';
import { saveProject, saveImage, getProjects, Project } from '../lib/db';

export function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('new');
  const [newProjectName, setNewProjectName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    try {
      let projectId = selectedProjectId;
      
      if (projectId === 'new') {
        projectId = generateId();
        await saveProject({
          id: projectId,
          name: newProjectName || `Project ${new Date().toLocaleDateString()}`,
          description: 'Uploaded project',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      // Save all images
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = previews[i];
        
        await saveImage({
          id: generateId(),
          projectId,
          dataUrl,
          filename: file.name,
          width: 0, // Would need image onload to get real dimensions synchronously, keeping 0 for now
          height: 0,
          size: file.size,
          format: file.type,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      
      navigate(`/projects/${projectId}`);
    } catch (e) {
      console.error(e);
      alert('Failed to upload files.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Images</h1>
        <p className="text-slate-500 dark:text-slate-400">Add images to generate AI metadata.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) handleFiles(Array.from(e.target.files));
              }}
            />
            <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-4 rounded-full mb-4">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-bold mb-1">Drag & Drop Images</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">or click to browse files (JPG, PNG, WebP)</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">{files.length} Files Selected</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((src, i) => (
                  <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img src={src} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-white text-xs truncate">{files[i].name}</p>
                      <p className="text-white/70 text-[10px]">{formatBytes(files[i].size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
            <h3 className="font-bold text-lg">Project Details</h3>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Add to Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="new">+ Create New Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {selectedProjectId === 'new' && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold">New Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Summer Collection 2026"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? 'Saving...' : 'Start Processing'}
              {!isUploading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
