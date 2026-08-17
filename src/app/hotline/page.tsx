'use client';

import React, { useState, useEffect } from 'react';
import { PhoneCall, MessageSquare, Settings2, ShieldCheck, Users, Search, Clock, Save, Trash2, Edit2, Plus, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

type Staff = { id: number; name: string; phone_number: string; role: string; department: string };
type Chat = { phone_number: string; name: string; assigned_staff_id: number | null; last_message: string; last_message_time: string; category?: string; ticket_id?: string };
type Message = { id: string; wa_chat_id: string; sender_type: string; message: string; created_at: string; status?: string };

export default function HotlineDashboard() {
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [chats, setChats] = useState<Chat[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ticketToClose, setTicketToClose] = useState<{phone: string, ticketId?: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Settings Form State
  const [isEditingStaff, setIsEditingStaff] = useState<Staff | null>(null);
  const [staffForm, setStaffForm] = useState({ name: '', phone_number: '', role: 'katim', department: '' });

  useEffect(() => {
    fetchStaff();
    fetchChats();

    // Realtime Subscriptions
    const chatSub = supabase.channel('wa_chats_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_chats' }, () => {
        fetchChats();
      }).subscribe();

    const msgSub = supabase.channel('wa_messages_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_messages' }, (payload) => {
        // Only refresh messages if it belongs to the currently opened chat
        if (selectedChat && payload.new && (payload.new as Message).wa_chat_id === selectedChat.phone_number) {
           fetchMessages(selectedChat.phone_number);
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(chatSub);
      supabase.removeChannel(msgSub);
    };
  }, [selectedChat]);

  const fetchStaff = async () => {
    const { data } = await supabase.from('wa_staff').select('*').order('id', { ascending: true });
    if (data) setStaff(data);
  };

  const fetchChats = async () => {
    const { data } = await supabase.from('wa_chats').select('*').order('last_message_time', { ascending: false });
    if (data) setChats(data);
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase.from('wa_messages').select('*').eq('wa_chat_id', chatId).neq('sender_type', 'system_transfer').order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.phone_number);
  };

  const handleCloseTicket = async (chatId: string, ticketId: string | undefined) => {
    // 1. Kirim pesan penutup
    const closingMessage = `Terima kasih, layanan untuk Tiket ${ticketId || ''} telah diselesaikan. Sesi obrolan ini ditutup.`;
    await supabase.from('wa_messages').insert([{
        wa_chat_id: chatId,
        sender_type: 'staff',
        message: closingMessage,
        status: 'pending' // Bot will send this
    }]);

    // 2. Reset category and ticket
    await supabase.from('wa_chats').update({ 
        category: 'Umum', 
        ticket_id: null, 
        assigned_staff_id: null 
    }).eq('phone_number', chatId);

    setSuccessMessage('Tiket berhasil ditutup!');
    setSelectedChat(null);
  };

  const handleTransfer = async (chatId: string, staffId: number) => {
    await supabase.from('wa_chats').update({ assigned_staff_id: staffId }).eq('phone_number', chatId);
    fetchChats();
    if (selectedChat?.phone_number === chatId) {
        setSelectedChat({ ...selectedChat, assigned_staff_id: staffId });
    }
    
    // Kirim pesan otomatis ke WA warga
    const staffMember = staff.find(s => s.id === staffId);
    if (staffMember) {
        let roleText = staffMember.role;
        if (staffMember.role.toLowerCase().includes('katim')) roleText = 'Ketua Tim';
        
        const transferMessage = `Sesi obrolan Anda telah dialihkan ke *${roleText} ${staffMember.department}*. Beliau akan segera merespons Anda.`;
        
        const selectedChatData = chats.find(c => c.phone_number === chatId);
        const lastMsg = selectedChatData ? selectedChatData.last_message : '';
        const citizenName = selectedChatData ? selectedChatData.name : 'Warga';
        const chatCategory = selectedChatData ? selectedChatData.category : 'Umum';
        const chatTicketId = selectedChatData?.ticket_id || `#ID-${Math.floor(1000 + Math.random() * 9000)}`;
        
        // Ambil riwayat percakapan 10 pesan terakhir
        const { data: historyData } = await supabase
            .from('wa_messages')
            .select('*')
            .eq('wa_chat_id', chatId)
            .neq('sender_type', 'system_transfer')
            .order('created_at', { ascending: true })
            .limit(10);
            
        let historyText = '';
        if (historyData && historyData.length > 0) {
            historyText = historyData.map((msg: any) => {
                const sender = msg.sender_type === 'public' ? 'Warga' : 'Admin';
                return `*${sender}*:\n${msg.message}`;
            }).join('\n\n');
        } else {
            historyText = `_Warga_:\n${lastMsg}`;
        }
        
        const katimNotification = `⚠️ *PELIMPAHAN TIKET BARU (${chatCategory.toUpperCase()})*\nPengirim: *${citizenName}*\nTiket: ${chatTicketId}\n\n*Riwayat Percakapan (10 terakhir):*\n\n${historyText}\n\n---\n_(Abaikan tulisan ini, cukup Swipe Kanan pesan ini untuk membalas)_`;
        
        // Dapatkan nomor Katim dari database
        const { data: staffData } = await supabase.from('wa_staff').select('name, phone_number').eq('id', staffId).single();
        let katimPhoneTarget = chatId; // Default fallback
        if (staffData && staffData.phone_number) {
            let phone = staffData.phone_number.split('@')[0].replace(/\D/g, '');
            if (phone.startsWith('0')) phone = '62' + phone.substring(1);
            katimPhoneTarget = phone + '@s.whatsapp.net';
            
            // Mencegah Error 409 (Foreign Key Conflict):
            // Pastikan Katim terdaftar di tabel wa_chats sebelum memasukkan pesan.
            await supabase.from('wa_chats').upsert({
                phone_number: katimPhoneTarget,
                name: staffData.name || 'Ketua Tim',
                last_message_time: new Date().toISOString(),
                category: 'Umum'
            }, { onConflict: 'phone_number' });
        }
        
        await supabase.from('wa_messages').insert([
            {
                wa_chat_id: chatId,
                sender_type: 'staff',
                message: transferMessage,
                status: 'pending'
            },
            {
                wa_chat_id: katimPhoneTarget,
                sender_type: 'staff',
                message: katimNotification,
                status: 'pending'
            }
        ]);
    }
    
    setSuccessMessage('Chat berhasil ditransfer!');
  };

  const handleSaveStaff = async () => {
    if (isEditingStaff) {
        await supabase.from('wa_staff').update(staffForm).eq('id', isEditingStaff.id);
    } else {
        await supabase.from('wa_staff').insert([staffForm]);
    }
    setIsEditingStaff(null);
    setStaffForm({ name: '', phone_number: '', role: 'katim', department: '' });
    fetchStaff();
  };

  const handleDeleteStaff = async (id: number) => {
    if (confirm('Yakin ingin menghapus staff ini?')) {
        await supabase.from('wa_staff').delete().eq('id', id);
        fetchStaff();
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <PhoneCall className="text-emerald-500" size={32} />
            Hotline BIDI DLH
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Pusat kendali proxy WhatsApp antara Masyarakat, Admin, dan Ketua Tim.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'chat' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
             <MessageSquare size={16} /> Live Chat
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
             <Settings2 size={16} /> Pengaturan
          </button>
        </div>
      </div>

      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
          {/* Left Column: Chat List */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm sticky top-0">
              <div className="relative mb-3">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input type="text" placeholder="Cari pesan atau nama..." className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
              </div>
              
              {/* Category Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                 {['Semua', 'Perizinan', 'Pengawasan', 'Pengaduan', 'Sampah', 'Bibit', 'Menunggu Pilihan'].map(cat => (
                    <button 
                       key={cat} 
                       onClick={() => setSelectedCategory(cat)}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                       {cat}
                    </button>
                 ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chats.filter(c => selectedCategory === 'Semua' || (c.category || 'Umum') === selectedCategory).length === 0 ? (
                 <div className="p-6 text-center text-slate-400 flex flex-col items-center mt-10">
                    <MessageSquare size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">Belum ada obrolan</p>
                 </div>
              ) : (
                 chats.filter(c => selectedCategory === 'Semua' || (c.category || 'Umum') === selectedCategory).map(chat => {
                    const assignee = staff.find(s => s.id === chat.assigned_staff_id);
                    const catColor = chat.category === 'Perizinan' ? 'bg-blue-100 text-blue-700' :
                                     chat.category === 'Pengawasan' ? 'bg-amber-100 text-amber-700' :
                                     chat.category === 'Pengaduan' ? 'bg-rose-100 text-rose-700' :
                                     chat.category === 'Sampah' ? 'bg-emerald-100 text-emerald-700' :
                                     'bg-slate-100 text-slate-600';
                    return (
                        <div key={chat.phone_number} onClick={() => handleSelectChat(chat)} className={`p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${selectedChat?.phone_number === chat.phone_number ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}>
                          <div className="flex justify-between items-start mb-1">
                             <h3 className="font-bold text-slate-800 text-sm truncate pr-2">{chat.name || chat.phone_number.split('@')[0]}</h3>
                             <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{formatTime(chat.last_message_time)}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mb-2">{chat.last_message}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                             {assignee ? (
                               <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100/50">
                                 <ShieldCheck size={10} /> {assignee.name}
                               </span>
                             ) : (
                               <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                                 Menunggu Admin
                               </span>
                             )}
                             <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${catColor}`}>
                               {chat.category || 'Umum'}
                             </span>
                             {chat.ticket_id && (
                               <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-bold">
                                 {chat.ticket_id}
                               </span>
                             )}
                          </div>
                        </div>
                    )
                 })
              )}
            </div>
          </div>

          {/* Right Column: Chat View */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="font-bold text-slate-800">{selectedChat.name || selectedChat.phone_number.split('@')[0]}</h2>
                            {selectedChat.ticket_id && (
                                <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    {selectedChat.ticket_id}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">+{selectedChat.phone_number.split('@')[0]}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Tutup Tiket Button */}
                        {selectedChat.category && selectedChat.category !== 'Umum' && (
                            <button 
                                onClick={() => setTicketToClose({ phone: selectedChat.phone_number, ticketId: selectedChat.ticket_id })}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 shadow-sm transition-all focus:ring-2 focus:ring-rose-500/20"
                            >
                                Tutup Tiket
                            </button>
                        )}
                        
                        {/* Transfer Dropdown */}
                        <div className="relative group">
                            <button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-2 transition-all focus:ring-2 focus:ring-blue-500/20">
                              <ArrowRight size={14} className="text-blue-500" />
                              Transfer Obrolan
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                               <div className="p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Penerima</div>
                               <div className="max-h-60 overflow-y-auto p-1">
                                   {staff.map(s => (
                                       <button key={s.id} onClick={() => handleTransfer(selectedChat.phone_number, s.id)} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex flex-col">
                                          <span>{s.name} <span className="text-[10px] text-slate-400 font-normal uppercase bg-slate-200 px-1.5 py-0.5 rounded ml-1">{s.role}</span></span>
                                          <span className="text-xs text-slate-400">{s.department}</span>
                                       </button>
                                   ))}
                               </div>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 bg-[#efeae2]">
                      <div className="flex flex-col gap-4">
                          <div className="text-center my-4">
                              <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-lg text-xs font-medium text-slate-500 shadow-sm">Percakapan diamankan dengan Enkripsi E2E Bot Proxy</span>
                          </div>
                          
                          {messages.map(msg => {
                              const isPublic = msg.sender_type === 'public';
                              return (
                                  <div key={msg.id} className={`flex flex-col ${isPublic ? 'items-start' : 'items-end'}`}>
                                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm relative ${isPublic ? 'bg-white text-slate-800 rounded-tl-sm' : 'bg-[#d9fdd3] text-slate-800 rounded-tr-sm'}`}>
                                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                          <div className="flex justify-end items-center gap-1 mt-1">
                                              <span className="text-[10px] text-slate-400/80 font-medium">
                                                  {formatTime(msg.created_at)}
                                              </span>
                                          </div>
                                      </div>
                                      {!isPublic && (
                                          <span className="text-[10px] text-slate-400 mt-1 font-medium px-1 flex items-center gap-1">
                                              <ShieldCheck size={10} /> Dibalas oleh Staff/Admin {msg.status === 'pending' ? '(Tertunda)' : ''}
                                          </span>
                                      )}
                                  </div>
                              )
                          })}
                      </div>
                  </div>

                  {/* Reply Input Area */}
                  <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0">
                      <form onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.target as HTMLFormElement;
                          const input = form.elements.namedItem('replyText') as HTMLInputElement;
                          const text = input.value.trim();
                          if (!text) return;
                          
                          // Set input to empty immediately for snappy feel
                          input.value = '';
                          
                          // Insert to Supabase with status 'pending'
                          const { error } = await supabase.from('wa_messages').insert([{
                              wa_chat_id: selectedChat.phone_number,
                              sender_type: 'staff',
                              message: text,
                              status: 'pending'
                          }]);
                          
                          if (error) {
                              console.error("Supabase Insert Error:", error);
                              alert("Gagal mengirim pesan: " + error.message);
                              input.value = text; // Kembalikan teks jika gagal
                              return;
                          }
                          
                          // Update chat last_message
                          await supabase.from('wa_chats').update({
                              last_message: text,
                              last_message_time: new Date().toISOString()
                          }).eq('phone_number', selectedChat.phone_number);
                          
                      }} className="flex gap-2 items-end">
                          <textarea 
                             name="replyText"
                             placeholder="Ketik balasan Anda di sini..." 
                             rows={1}
                             className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all max-h-32"
                             onKeyDown={(e) => {
                                 if (e.key === 'Enter' && !e.shiftKey) {
                                     e.preventDefault();
                                     e.currentTarget.form?.requestSubmit();
                                 }
                             }}
                          ></textarea>
                          <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl shadow-sm transition-all flex-shrink-0 focus:ring-2 focus:ring-emerald-500/20">
                              <ArrowRight size={20} />
                          </button>
                      </form>
                  </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-medium text-slate-500">Pilih obrolan di sebelah kiri untuk melihat detail.</p>
                </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
                <h2 className="font-bold text-slate-800 text-lg">Kelola Nomor Staff</h2>
                <p className="text-sm text-slate-500 mt-1">Daftar Admin dan Katim yang akan menerima pesan dari Bot.</p>
            </div>
            <button onClick={() => { setIsEditingStaff(null); setStaffForm({ name: '', phone_number: '', role: 'katim', department: '' }) }} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm">
                <Plus size={16} /> Tambah Staff
            </button>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* List of Staff */}
             <div className="lg:col-span-2 space-y-3">
                 {staff.map(s => (
                     <div key={s.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-all bg-white shadow-sm">
                         <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                 {s.name.charAt(0)}
                             </div>
                             <div>
                                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                     {s.name} 
                                     <span className={`text-[10px] uppercase px-2 py-0.5 rounded-md font-bold tracking-wider ${s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{s.role}</span>
                                 </h3>
                                 <p className="text-xs text-slate-500 mt-0.5">{s.department} • +{s.phone_number.split('@')[0]}</p>
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                             <button onClick={() => { setIsEditingStaff(s); setStaffForm({ name: s.name, phone_number: s.phone_number.split('@')[0], role: s.role, department: s.department }) }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                 <Edit2 size={16} />
                             </button>
                             <button onClick={() => handleDeleteStaff(s.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                 <Trash2 size={16} />
                             </button>
                         </div>
                     </div>
                 ))}
             </div>

             {/* Form Add/Edit */}
             <div className="lg:col-span-1">
                 <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                         {isEditingStaff ? <Edit2 size={16} className="text-blue-500"/> : <Plus size={16} className="text-emerald-500"/>}
                         {isEditingStaff ? 'Edit Staff' : 'Staff Baru'}
                     </h3>
                     <div className="space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                             <input value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} type="text" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500" placeholder="Contoh: Budi Katim" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role)</label>
                             <select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500">
                                 <option value="katim">Ketua Tim (Katim)</option>
                                 <option value="admin">Admin Gatekeeper</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WA Pribadi</label>
                             <div className="flex">
                                 <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-sm font-medium">+</span>
                                 <input value={staffForm.phone_number} onChange={e => setStaffForm({...staffForm, phone_number: e.target.value.replace(/\D/g, '')})} type="text" className="flex-1 bg-white border border-slate-300 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500" placeholder="628123456..." />
                             </div>
                             <p className="text-[10px] text-slate-500 mt-1">Harus diawali 62, tanpa spasi/strip.</p>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1">Divisi / Departemen</label>
                             <input value={staffForm.department} onChange={e => setStaffForm({...staffForm, department: e.target.value})} type="text" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500" placeholder="Contoh: Pengawasan Limbah" />
                         </div>
                         
                         <button onClick={() => {
                             if(!staffForm.name || !staffForm.phone_number) return alert('Nama dan Nomor wajib diisi');
                             // Format phone number to @s.whatsapp.net if not already
                             const formattedForm = {
                                 ...staffForm,
                                 phone_number: staffForm.phone_number.includes('@') ? staffForm.phone_number : `${staffForm.phone_number}@s.whatsapp.net`
                             };
                             setStaffForm(formattedForm);
                             setTimeout(handleSaveStaff, 100);
                         }} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-sm mt-2">
                             <Save size={16} /> Simpan Data
                         </button>
                         
                         {isEditingStaff && (
                             <button onClick={() => {setIsEditingStaff(null); setStaffForm({ name: '', phone_number: '', role: 'katim', department: '' })}} className="w-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 py-2.5 rounded-lg text-sm font-bold transition-all">
                                 Batal Edit
                             </button>
                         )}
                     </div>
                 </div>
             </div>
          </div>
        </div>
      )}

      {/* Ticket Close Confirmation Modal */}
      {ticketToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Tutup Tiket Obrolan?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Anda yakin ingin menutup tiket ini? Warga akan direset kembali ke status "Umum" dan tiket ini akan diselesaikan.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTicketToClose(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    handleCloseTicket(ticketToClose.phone, ticketToClose.ticketId);
                    setTicketToClose(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm transition-all"
                >
                  Ya, Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Notification Modal */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Berhasil!</h3>
              <p className="text-sm text-slate-500 mb-6">
                {successMessage}
              </p>
              <button 
                onClick={() => setSuccessMessage(null)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
