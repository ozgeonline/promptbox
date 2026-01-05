import React, { useState, useEffect } from 'react';
import { Prompt, Folder } from '../types';
import { X, Upload, Globe, Lock } from 'lucide-react';

interface PromptFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Omit<Prompt, 'id' | 'createdAt'> & { id?: string }) => void;
  folders: Folder[];
  initialData?: Prompt | null;
}

export const PromptForm: React.FC<PromptFormProps> = ({
  isOpen,
  onClose,
  onSave,
  folders,
  initialData
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setContent(initialData.content);
        setFolderId(initialData.folderId);
        setImage(initialData.image);
        setIsPublic(initialData.isPublic);
      } else {
        // Reset form for new entry
        setTitle('');
        setContent('');
        setFolderId(folders.length > 0 ? folders[0].id : '');
        setImage(undefined);
        setIsPublic(false);
      }
    }
  }, [isOpen, initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Görsel boyutu çok büyük! Lütfen 500KB'dan küçük bir görsel yükleyin.");
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || (!folderId && folders.length > 0)) return;

    onSave({
      id: initialData?.id,
      title,
      content,
      folderId,
      image,
      isPublic
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Promptu Düzenle' : 'Yeni Prompt Oluştur'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Title & Folder Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Başlık</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Pazarlama E-postası"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Klasör</label>
              {folders.length > 0 ? (
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                  required
                >
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 italic text-sm">
                  Genel (Otomatik Oluşturulacak)
                </div>
              )}
            </div>
          </div>

          {/* Prompt Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Prompt İçeriği</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Promptunuzu buraya yazın..."
              className="w-full h-40 px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none font-mono text-sm leading-relaxed placeholder:text-slate-400"
              required
            />
          </div>

          {/* Image & Visibility Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Örnek Görsel</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors bg-white">
                  <Upload className="w-4 h-4 text-slate-500 mr-2" />
                  <span className="text-sm text-slate-600">Görsel Seç</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>

                {image && (
                  <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden relative">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImage(undefined)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Görünürlük</label>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border transition-all ${isPublic
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
              >
                <div className="flex items-center gap-2">
                  {isPublic ? <Globe size={18} /> : <Lock size={18} />}
                  <span className="text-sm font-medium">
                    {isPublic ? 'Herkese Açık (Public)' : 'Sadece Bana Özel'}
                  </span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </div>


          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all transform active:scale-95"
            >
              {initialData ? 'Değişiklikleri Kaydet' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
