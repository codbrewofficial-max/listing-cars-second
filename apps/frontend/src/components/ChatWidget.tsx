import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useAppState } from '../context/AppContext';
import { useChatSocket } from '../lib/socket';
import { api } from '../lib/api';
import { Message, Conversation } from '../types';
import { MessageSquare, Send, X, Phone, User as UserIcon, Calendar, Check } from 'lucide-react';

export const ChatWidget: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { addLead } = useAppState();

  // State for WhatsApp Lead Capture Modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [waName, setWaName] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('Halo Admin, saya tertarik bertanya mengenai unit kendaraan second di platform Anda.');
  const [isSubmittingWa, setIsSubmittingWa] = useState(false);

  // State for System Chat Box
  const [showChatBox, setShowChatBox] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsgContent, setNewMsgContent] = useState('');
  const [isCreatingConv, setIsCreatingConv] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChatBox]);

  // Load chat conversation if exists when chat is opened
  useEffect(() => {
    if (showChatBox && isAuthenticated && user?.role === 'customer') {
      const initChat = async () => {
        setIsCreatingConv(true);
        try {
          const res = await api.chat.listConversations();
          if (res.success && res.data && res.data.length > 0) {
            setConversation(res.data[0]);
            const msgRes = await api.chat.listMessages(res.data[0].id);
            if (msgRes.success) setMessages(msgRes.data);
          } else {
            // Create first conversation
            const createRes = await api.chat.createConversation({
              initial_message: 'Halo, saya butuh informasi bantuan mengenai platform ini.'
            });
            if (createRes.success && createRes.data) {
              setConversation(createRes.data.conversation);
              const msgRes = await api.chat.listMessages(createRes.data.conversation.id);
              if (msgRes.success) setMessages(msgRes.data);
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsCreatingConv(false);
        }
      };
      initChat();
    }
  }, [showChatBox, isAuthenticated, user]);

  // WebSocket Live Chat Listener (specialized custom hook)
  const handleLiveMessage = (msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  useChatSocket(conversation?.id || '', handleLiveMessage);

  // Handle WhatsApp Lead Submission
  const handleWaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waName || !waPhone) return;

    setIsSubmittingWa(true);
    try {
      // Capture lead in database
      await addLead({
        source: 'whatsapp_modal',
        name: waName,
        phone: waPhone,
        message: waMessage
      });

      // Close modal
      setShowWaModal(false);

      // Reset
      setWaName('');
      setWaPhone('');

      // Redirect to WhatsApp with prefilled message
      const formattedPhone = waPhone.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(waMessage);
      // Use standard platform WhatsApp redirect number, e.g. 6281234567890
      window.open(`https://wa.me/6281234567890?text=${encodedMsg}`, '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingWa(false);
    }
  };

  // Handle Send Message in Chatbox
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgContent.trim() || !conversation) return;

    const content = newMsgContent;
    setNewMsgContent('');

    // Append temporarily
    const tempMsg: Message = {
      id: 'm_temp_' + Date.now(),
      conversation_id: conversation.id,
      sender_id: user?.id || 'guest',
      sender_name: user?.name || 'Customer',
      sender_role: 'customer',
      content,
      message_type: 'text',
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.chat.sendMessage(conversation.id, { content, message_type: 'text' });
      if (res.success && res.data) {
        // Replace temp message with actual
        setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? res.data : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* WhatsApp Floating Trigger */}
        <button
          onClick={() => setShowWaModal(true)}
          className="flex items-center justify-center w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:scale-105 transition-all duration-200"
          title="Hubungi Kami via WhatsApp"
        >
          <Phone className="w-6 h-6 animate-pulse" />
        </button>

        {/* Live Chat System Trigger */}
        {isAuthenticated && user?.role === 'customer' && (
          <button
            onClick={() => setShowChatBox(!showChatBox)}
            className={`flex items-center justify-center w-14 h-14 text-white rounded-full shadow-lg hover:scale-105 transition-all duration-200 ${
              showChatBox ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'
            }`}
            title="Sistem Chat Internal"
          >
            {showChatBox ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* WhatsApp Lead Capture Popup Modal */}
      {showWaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100">
            <div className="bg-green-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Hubungi Tim WhatsApp</h3>
                  <p className="text-xs text-green-100">Solusi Cepat Anti-Penipuan</p>
                </div>
              </div>
              <button
                onClick={() => setShowWaModal(false)}
                className="text-green-100 hover:text-white rounded-lg p-1 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWaSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed">
                Platform kami berkomitmen menjaga keamanan transaksi Anda. Sebelum mengalihkan ke WhatsApp, silakan isi data singkat berikut agar tim kami dapat mengidentifikasi keperluan Anda secara akurat.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={waName}
                    onChange={(e) => setWaName(e.target.value)}
                    placeholder="Masukkan nama Anda..."
                    className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-green-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nomor Telepon / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="Contoh: 081234567890..."
                    className="pl-10 w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-green-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pesan Anda
                </label>
                <textarea
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-green-500 bg-slate-50 focus:bg-white transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingWa}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-colors disabled:bg-slate-300"
              >
                {isSubmittingWa ? 'Menghubungkan...' : 'Lanjutkan ke WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Internal Chat Box Window */}
      {showChatBox && isAuthenticated && user?.role === 'customer' && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col z-50 overflow-hidden animate-fade-in h-[450px]">
          {/* Header */}
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-green-500 border border-slate-700">
                L
              </div>
              <div>
                <h4 className="font-display font-semibold text-sm">Chat Admin Sistem</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-[10px] text-slate-400">Siap Melayani</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowChatBox(false)}
              className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
            {isCreatingConv ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                Membuka ruang chat...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400 text-center px-4">
                Tidak ada pesan. Silakan kirim pesan untuk memulai konsultasi.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-green-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 rounded-bl-none shadow-xs border border-slate-100'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
            <input
              type="text"
              value={newMsgContent}
              onChange={(e) => setNewMsgContent(e.target.value)}
              placeholder="Tulis pesan Anda..."
              className="flex-1 px-3.5 py-1.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-green-600 text-sm bg-slate-50"
            />
            <button
              type="submit"
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
