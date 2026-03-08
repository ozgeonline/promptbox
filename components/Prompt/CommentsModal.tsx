import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Trash2, Calendar, User } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { useProfile } from '@/hooks/useProfile';
import { Prompt } from '@/types';
import { useAuthContext, useDataContext } from '@/context';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, prompt }) => {
  const { session } = useAuthContext();
  const { updateCommentCount } = useDataContext();
  const {
    profile,
    loading: profileLoading,
    isOldEnough
  } = useProfile();
  const {
    comments,
    loading: commentsLoading,
    addComment,
    deleteComment
  } = useComments(prompt?.id || null);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNewComment('');
    }
  }, [isOpen]);

  if (!isOpen || !prompt) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { success } = await addComment(newComment);
    if (success) {
      setNewComment('');
      if (prompt?.id) {
        updateCommentCount(prompt.id, 1);
      }
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const hasProfile = Boolean(profile?.username);
  const userIsOldEnough = isOldEnough();

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Yorumlar</h2>
              <p className="text-sm text-slate-500 line-clamp-1">{prompt.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {commentsLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <MessageSquare size={48} opacity={0.2} />
              <p>Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="group flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                  <User size={20} />
                </div>
                <div className="flex-1">
                  <div className="bg-slate-50 rounded-2xl rounded-tl-none p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 text-sm">
                        {comment.profiles?.username || 'Anonim Kullanıcı'}
                      </span>
                      {session?.user?.id === comment.user_id && (
                        <button
                          onClick={async () => {
                            const { success } = await deleteComment(comment.id);
                            if (success && prompt?.id) {
                              updateCommentCount(prompt.id, -1);
                            }
                          }}
                          className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Yorumu Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 ml-1 text-[11px] text-slate-400">
                    <Calendar size={12} />
                    {formatDate(comment.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-slate-100 bg-white">
          {!session ? (
            <div className="text-center p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
              Yorum yapabilmek için <span className="font-semibold">Giriş Yapmalısınız</span>.
            </div>
          ) : profileLoading ? (
            <div className="text-center p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
              Profil bilgileri yükleniyor...
            </div>
          ) : !hasProfile ? (
            <div className="text-center p-4 bg-yellow-50 rounded-xl text-sm text-yellow-800 border border-yellow-100">
              Yorum yapabilmek için profilinizden <strong>Kullanıcı Adı</strong> ve <strong>Doğum Tarihi</strong> belirlemelisiniz.
            </div>
          ) : !userIsOldEnough ? (
            <div className="text-center p-4 bg-red-50 rounded-xl text-sm text-red-800 border border-red-100">
              Yorum yapabilmek için <strong>18 yaşından büyük</strong> olmalısınız.
            </div>
          ) : (
            <form onSubmit={handleAddComment} className="flex gap-2 relative">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Yorumunuzu yazın..."
                className="flex-1 pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-700 text-sm"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
