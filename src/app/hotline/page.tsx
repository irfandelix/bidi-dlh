'use client';

import React, { useState, useEffect } from 'react';
import { PhoneCall, MessageSquare, Settings2, ShieldCheck, Users, Search, Clock, Save, Trash2, Edit2, Plus, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

type Staff = { id: number; name: string; phone_number: string; role: string; department: string };
type Chat = { phone_number: string; name: string; assigned_staff_id: number | null; last_message: string; last_message_time: string };
type Message = { id: string; wa_chat_id: string; sender_type: string; message: string; created_at: string };

export default function HotlineDashboard() {
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [chats, setChats] = useState<Chat[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
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
    const { data } = await supabase.from('wa_messages').select('*').eq('wa_chat_id', chatId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.phone_number);
  };

  const handleTransfer = async (chatId: string, staffId: number) => {
    await supabase.from('wa_chats').update({ assigned_staff_id: staffId }).eq('phone_number', chatId);
    fetchChats();
    if (selectedChat?.phone_number === chatId) {
        setSelectedChat({ ...selectedChat, assigned_staff_id: staffId });
    }
    alert('Chat berhasil ditransfer!');
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
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input type="text" placeholder="Cari pesan atau nama..." className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                 <div className="p-6 text-center text-slate-400 flex flex-col items-center mt-10">
                    <MessageSquare size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">Belum ada obrolan</p>
                 </div>
              ) : (
                 chats.map(chat => {
                    const assignee = staff.find(s => s.id === chat.assigned_staff_id);
                    return (
                        <div key={chat.phone_number} onClick={() => handleSelectChat(chat)} className={`p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${selectedChat?.phone_number === chat.phone_number ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}>
                          <div className="flex justify-between items-start mb-1">
                             <h3 className="font-bold text-slate-800 text-sm truncate pr-2">{chat.name || chat.phone_number.split('@')[0]}</h3>
                             <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{formatTime(chat.last_message_time)}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mb-2">{chat.last_message}</p>
                          <div className="flex items-center gap-1.5">
                             {assignee ? (
                               <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100/50">
                                 <ShieldCheck size={10} /> {assignee.name}
                               </span>
                             ) : (
                               <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                                 Menunggu Admin
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
                        <h2 className="font-bold text-slate-800">{selectedChat.name || selectedChat.phone_number.split('@')[0]}</h2>
                        <p className="text-xs text-slate-500">+{selectedChat.phone_number.split('@')[0]}</p>
                    </div>
                    
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
                                              <ShieldCheck size={10} /> Dibalas oleh Staff/Admin
                                          </span>
                                      )}
                                  </div>
                              )
                          })}
                      </div>
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

    </div>
  );
}
