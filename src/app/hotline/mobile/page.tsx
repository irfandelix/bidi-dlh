'use client';

import React, { useState, useEffect } from 'react';
import { PhoneCall, MessageSquare, ShieldCheck, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

type Staff = { id: number; name: string; phone_number: string; role: string; department: string };
type Chat = { phone_number: string; name: string; assigned_staff_id: number | null; last_message: string; last_message_time: string };
type Message = { id: string; wa_chat_id: string; sender_type: string; message: string; created_at: string };

export default function MobileHotline() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    fetchStaff();
    fetchChats();

    const chatSub = supabase.channel('mobile_wa_chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_chats' }, () => fetchChats())
      .subscribe();

    const msgSub = supabase.channel('mobile_wa_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_messages' }, (payload) => {
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

  const handleTransfer = async (staffId: number) => {
    if (!selectedChat) return;
    await supabase.from('wa_chats').update({ assigned_staff_id: staffId }).eq('phone_number', selectedChat.phone_number);
    setIsTransferring(false);
    fetchChats();
    setSelectedChat({ ...selectedChat, assigned_staff_id: staffId });
    alert('Obrolan berhasil dioper!');
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // View: Chat Detail
  if (selectedChat) {
      return (
          <div className="flex flex-col w-full h-[100dvh] bg-[#efeae2]">
              {/* Topbar */}
              <div className="flex items-center gap-3 p-4 bg-white border-b border-slate-200 shadow-sm z-10 sticky top-0">
                  <button onClick={() => setSelectedChat(null)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
                      <ArrowLeft size={20} className="text-slate-600" />
                  </button>
                  <div className="flex-1 overflow-hidden">
                      <h2 className="font-bold text-slate-800 text-sm truncate">{selectedChat.name || selectedChat.phone_number.split('@')[0]}</h2>
                      <p className="text-[10px] text-slate-500 truncate">+{selectedChat.phone_number.split('@')[0]}</p>
                  </div>
                  <button onClick={() => setIsTransferring(true)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform">
                      <ArrowRight size={14} /> Oper
                  </button>
              </div>

              {/* Transfer Modal */}
              {isTransferring && (
                  <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-0 sm:pb-4">
                      <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 animate-in slide-in-from-bottom-10">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-slate-800">Pilih Penerima (Transfer)</h3>
                              <button onClick={() => setIsTransferring(false)} className="text-slate-400 font-bold p-2 text-xl leading-none">&times;</button>
                          </div>
                          <div className="max-h-[60vh] overflow-y-auto space-y-2">
                              {staff.map(s => (
                                  <button key={s.id} onClick={() => handleTransfer(s.id)} className="w-full text-left p-3 border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 flex flex-col transition-colors">
                                      <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                          {s.name}
                                          <span className="text-[9px] uppercase bg-slate-200 px-1.5 py-0.5 rounded tracking-widest">{s.role}</span>
                                      </span>
                                      <span className="text-xs text-slate-500 mt-1">{s.department}</span>
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  <div className="text-center my-2">
                      <span className="bg-white/90 shadow-sm px-3 py-1.5 rounded-xl text-[10px] font-medium text-slate-500">
                          E2E Bot Proxy Aktif
                      </span>
                  </div>
                  
                  {messages.map(msg => {
                      const isPublic = msg.sender_type === 'public';
                      return (
                          <div key={msg.id} className={`flex flex-col ${isPublic ? 'items-start' : 'items-end'}`}>
                              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 shadow-sm relative ${isPublic ? 'bg-white text-slate-800 rounded-tl-sm' : 'bg-[#d9fdd3] text-slate-800 rounded-tr-sm'}`}>
                                  <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                  <div className="flex justify-end items-center mt-0.5">
                                      <span className="text-[9px] text-slate-400/80 font-medium">
                                          {formatTime(msg.created_at)}
                                      </span>
                                  </div>
                              </div>
                              {!isPublic && (
                                  <span className="text-[9px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                                      <ShieldCheck size={9} /> Dibalas Staff
                                  </span>
                              )}
                          </div>
                      )
                  })}
              </div>
          </div>
      );
  }

  // View: Chat List (Default)
  return (
    <div className="flex flex-col w-full h-[100dvh] bg-slate-50">
      {/* Topbar */}
      <div className="bg-emerald-600 text-white p-4 shadow-md z-10">
          <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
            <PhoneCall size={20} /> Hotline DLH
          </h1>
          <p className="text-[10px] text-emerald-100 mt-0.5 opacity-80">Dashboard Operator Mobile</p>
          
          <div className="relative mt-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <input type="text" placeholder="Cari pesan..." className="w-full bg-white text-slate-800 rounded-full pl-9 pr-4 py-2 text-xs focus:outline-none shadow-inner" />
          </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white">
          {chats.length === 0 ? (
             <div className="p-8 text-center text-slate-400 flex flex-col items-center mt-10">
                <MessageSquare size={40} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">Belum ada obrolan masuk</p>
             </div>
          ) : (
             chats.map(chat => {
                const assignee = staff.find(s => s.id === chat.assigned_staff_id);
                return (
                    <button key={chat.phone_number} onClick={() => handleSelectChat(chat)} className="w-full text-left p-4 border-b border-slate-100 active:bg-slate-100 flex gap-3 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-500 font-bold text-lg">
                            {(chat.name || 'W').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center mb-0.5">
                                <h3 className="font-bold text-slate-800 text-sm truncate pr-2">{chat.name || chat.phone_number.split('@')[0]}</h3>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatTime(chat.last_message_time)}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mb-1.5">{chat.last_message}</p>
                            {assignee ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold">
                                    <ShieldCheck size={9} /> {assignee.name}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold">
                                    Admin (Menunggu)
                                </span>
                            )}
                        </div>
                    </button>
                )
             })
          )}
      </div>
    </div>
  );
}
