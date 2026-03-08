import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, loading, updateProfile, error: profileError } = useProfile();
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername(profile?.username || '');
      setBirthdate(profile?.birthdate || '');
      setStatusMessage(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const { success, error } = await updateProfile(username, birthdate);

    setIsSubmitting(false);

    if (success) {
      setStatusMessage({ type: 'success', text: 'Profiliniz başarıyla güncellendi!' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatusMessage({ type: 'error', text: error || 'Profil güncellenirken bir hata oluştu.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Profilim</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-slate-600 mb-6">
              Profil bilgilerinizi doldurarak topluluk promptlarına yorum yapabilirsiniz (18 yaş sınırı vardır).
            </p>

            {(statusMessage || profileError) && (
              <div className={`p-4 rounded-xl flex items-start gap-3 ${statusMessage?.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                {statusMessage?.type === 'success' ? (
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                )}
                <p className="text-sm">
                  {statusMessage?.text || profileError}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adınız..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                />
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Doğum Tarihi
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                />
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              disabled={loading || isSubmitting}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
