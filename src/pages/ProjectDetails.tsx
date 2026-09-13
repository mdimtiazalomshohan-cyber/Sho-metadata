import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectImages, getProjectMetadata, saveMetadata, saveImage, getSettings, ImageRecord, ImageMetadata, getProjects } from '../lib/db';
import { analyzeImageAPI } from '../lib/api';
import { ArrowLeft, Sparkles, Download, CheckCircle2, AlertTriangle, FileImage, SlidersHorizontal, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const [projectName, setProjectName] = useState('');
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [metadata, setMetadata] = useState<Record<string, ImageMetadata>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0 });

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const projs = await getProjects();
    const proj = projs.find(p => p.id === id);
    if (proj) setProjectName(proj.name);

    const imgs = await getProjectImages(id);
    setImages(imgs);
    if (imgs.length > 0 && !selectedId) setSelectedId(imgs[0].id);

    const metas = await getProjectMetadata(id);
    const metaMap: Record<string, ImageMetadata> = {};
    metas.forEach(m => metaMap[m.id] = m);
    setMetadata(metaMap);
  };

  const handleGenerateSingle = async (imgId: string) => {
    await processQueue([imgId]);
  };

  const handleGenerateAll = async () => {
    const ungenerated = images.filter(img => !metadata[img.id] || img.status !== 'completed').map(i => i.id);
    if (ungenerated.length === 0) {
       alert("All images already have metadata. To regenerate, clear existing metadata first.");
       return;
    }
    await processQueue(ungenerated);
  };

  const processQueue = async (imageIds: string[]) => {
    setIsGenerating(true);
    setProgress({ total: imageIds.length, current: 0 });
    const settings = await getSettings();

    for (let i = 0; i < imageIds.length; i++) {
      const imgId = imageIds[i];
      const img = images.find(img => img.id === imgId);
      if (!img) continue;
      
      try {
        // Update status to processing
        await saveImage({ ...img, status: 'processing' });
        setImages(prev => prev.map(p => p.id === imgId ? { ...p, status: 'processing' } : p));

        const result = await analyzeImageAPI(img.dataUrl, img.format, settings.apiKey || '', settings.model);
        
        const newMeta: ImageMetadata = {
          id: img.id,
          projectId: img.projectId,
          title: result.title || '',
          description: result.description || '',
          keywords: result.keywords || [],
          category: result.category || 'Uncategorized',
          contentType: result.contentType || 'Photo',
          aiGenerated: result.aiGenerated ?? true,
          people: result.people || 'Uncertain',
          property: result.property || 'Uncertain',
          releaseStatus: result.releaseStatus || 'Review',
          filenameSuggestion: result.filenameSuggestion || img.filename,
          notes: result.warnings?.join(' | ') || '',
          updatedAt: Date.now(),
        };

        await saveMetadata(newMeta);
        await saveImage({ ...img, status: 'completed' });
        
        setMetadata(prev => ({ ...prev, [img.id]: newMeta }));
        setImages(prev => prev.map(p => p.id === imgId ? { ...p, status: 'completed' } : p));
      } catch (err: any) {
        console.error(err);
        await saveImage({ ...img, status: 'failed' });
        setImages(prev => prev.map(p => p.id === imgId ? { ...p, status: 'failed' } : p));
        // We could alert here, but for batch processing it's better to log and continue
        if (imageIds.length === 1) alert(`Error: ${err.message}`);
      }
      setProgress(prev => ({ ...prev, current: i + 1 }));
    }
    setIsGenerating(false);
  };

  const exportCSV = () => {
    const dataToExport = images.map(img => {
      const meta = metadata[img.id];
      if (!meta) return null;
      return {
        Filename: meta.filenameSuggestion || img.filename,
        Title: meta.title,
        Description: meta.description,
        Keywords: meta.keywords.join(', '),
        Category: meta.category,
        "AI Generated": meta.aiGenerated ? 'Yes' : 'No',
        "Release Status": meta.releaseStatus,
      };
    }).filter(Boolean);

    if (dataToExport.length === 0) {
      alert("No metadata to export yet.");
      return;
    }

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `sho-meta-${projectName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMetaChange = (id: string, field: keyof ImageMetadata, value: any) => {
    setMetadata(prev => {
       const existing = prev[id];
       if (!existing) return prev;
       const updated = { ...existing, [field]: value, updatedAt: Date.now() };
       // Save to DB asynchronously
       saveMetadata(updated);
       return { ...prev, [id]: updated };
    });
  };

  const selectedImage = images.find(i => i.id === selectedId);
  const selectedMeta = selectedId ? metadata[selectedId] : null;

  return (
    <div className="h-full flex flex-col -m-4 md:-m-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 md:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{projectName || 'Project Details'}</h1>
            <p className="text-xs text-slate-500">{images.length} Images</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download size={16} />
            Export CSV
          </button>
          <button 
            onClick={handleGenerateAll}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <Sparkles size={16} />
            {isGenerating ? `Processing (${progress.current}/${progress.total})` : 'Generate All Metadata'}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Image List */}
        <div className="w-64 md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto p-4 gap-3 shrink-0">
          {images.map(img => {
            const hasMeta = !!metadata[img.id];
            const isSelected = selectedId === img.id;
            return (
              <button
                key={img.id}
                onClick={() => setSelectedId(img.id)}
                className={`flex gap-3 p-2 rounded-xl text-left transition-all ${isSelected ? 'bg-white dark:bg-slate-800 shadow-sm border border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}
              >
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                  <img src={img.dataUrl} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <p className="text-sm font-medium truncate">{img.filename}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {img.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500" />}
                    {img.status === 'processing' && <span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                    {img.status === 'failed' && <AlertTriangle size={14} className="text-red-500" />}
                    {img.status === 'pending' && <FileImage size={14} className="text-slate-400" />}
                    <span className="text-xs text-slate-500 capitalize">{img.status}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Right Column: Editor */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 p-6 md:p-8">
          {selectedImage ? (
            <div className="max-w-4xl mx-auto flex flex-col xl:flex-row gap-8">
              
              {/* Preview */}
              <div className="xl:w-1/3 space-y-4">
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-square">
                  <img src={selectedImage.dataUrl} className="w-full h-full object-contain" alt="" />
                </div>
                {!selectedMeta && selectedImage.status !== 'processing' && (
                  <button 
                    onClick={() => handleGenerateSingle(selectedImage.id)}
                    className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    <Sparkles size={18} /> Generate Metadata
                  </button>
                )}
                {selectedImage.status === 'processing' && (
                  <div className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-medium flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> Analyzing Image...
                  </div>
                )}
              </div>

              {/* Editor Form */}
              <div className="xl:w-2/3 space-y-6">
                {selectedMeta ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5">SEO Title (Max 70 chars)</label>
                        <input 
                          type="text" 
                          value={selectedMeta.title}
                          onChange={(e) => handleMetaChange(selectedId!, 'title', e.target.value)}
                          className="w-full text-lg font-semibold bg-transparent border-b border-slate-200 dark:border-slate-800 pb-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5">Description</label>
                        <textarea 
                          rows={4}
                          value={selectedMeta.description}
                          onChange={(e) => handleMetaChange(selectedId!, 'description', e.target.value)}
                          className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                           <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Keywords ({selectedMeta.keywords.length})</label>
                        </div>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                          {selectedMeta.keywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1">
                              {kw}
                              <button 
                                onClick={() => {
                                  const newKws = [...selectedMeta.keywords];
                                  newKws.splice(i, 1);
                                  handleMetaChange(selectedId!, 'keywords', newKws);
                                }}
                                className="text-slate-400 hover:text-red-500 ml-1"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5">Category</label>
                        <input 
                          type="text" 
                          value={selectedMeta.category}
                          onChange={(e) => handleMetaChange(selectedId!, 'category', e.target.value)}
                          className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5">AI Generated?</label>
                        <select 
                          value={selectedMeta.aiGenerated ? 'Yes' : 'No'}
                          onChange={(e) => handleMetaChange(selectedId!, 'aiGenerated', e.target.value === 'Yes')}
                          className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 outline-none focus:border-indigo-500"
                        >
                          <option value="Yes">Yes (Disclose)</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5">Release Status</label>
                        <select 
                          value={selectedMeta.releaseStatus}
                          onChange={(e) => handleMetaChange(selectedId!, 'releaseStatus', e.target.value)}
                          className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 outline-none focus:border-indigo-500"
                        >
                          <option value="Not Required">Not Required</option>
                          <option value="Required">Required</option>
                          <option value="Review">Review Needed</option>
                        </select>
                      </div>
                       <div>
                        <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5">Suggested Filename</label>
                        <input 
                          type="text" 
                          value={selectedMeta.filenameSuggestion}
                          onChange={(e) => handleMetaChange(selectedId!, 'filenameSuggestion', e.target.value)}
                          className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <SlidersHorizontal size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                    <p>No metadata generated yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Select an image from the sidebar to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
