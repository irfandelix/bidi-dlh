import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function isAuthorized(request: Request): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && process.env.MOBILE_API_KEY && apiKey === process.env.MOBILE_API_KEY) {
    return true;
  }
  const cookieStore = await cookies();
  return Boolean(cookieStore.get('bidi_session')?.value);
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const supabase: any = await createClient();

    if (type === 'staff') {
      const { data, error } = await supabase.from('wa_staff').select('*').order('id', { ascending: true });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: data || [] });
    }

    if (type === 'chats') {
      const { data, error } = await supabase.from('wa_chats').select('*').order('last_message_time', { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: data || [] });
    }

    if (type === 'messages') {
      const chatId = searchParams.get('chatId');
      if (!chatId) return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
      const includeTransfer = searchParams.get('includeTransfer') === '1';

      let query = supabase
        .from('wa_messages')
        .select('*')
        .eq('wa_chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!includeTransfer) {
        query = query.neq('sender_type', 'system_transfer');
      }

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: data || [] });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err: any) {
    console.error('Hotline GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const supabase: any = await createClient();

    if (action === 'send_message') {
      const { chatId, senderType = 'staff', message, updateLastMessage = true } = body;
      if (!chatId || !message) {
        return NextResponse.json({ error: 'Missing chatId or message' }, { status: 400 });
      }

      const { error } = await supabase.from('wa_messages').insert([
        { wa_chat_id: chatId, sender_type: senderType, message, status: 'pending' },
      ]);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      if (updateLastMessage) {
        await supabase
          .from('wa_chats')
          .update({ last_message: message, last_message_time: new Date().toISOString() })
          .eq('phone_number', chatId);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'close_ticket') {
      const { chatId, ticketId } = body;
      if (!chatId) return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });

      const closingMessage = `Terima kasih, layanan untuk Tiket ${ticketId || ''} telah diselesaikan. Sesi obrolan ini ditutup.`;
      const { error: msgErr } = await supabase.from('wa_messages').insert([
        { wa_chat_id: chatId, sender_type: 'staff', message: closingMessage, status: 'pending' },
      ]);
      if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 400 });

      const { error: chatErr } = await supabase
        .from('wa_chats')
        .update({ category: 'Umum', ticket_id: null, assigned_staff_id: null })
        .eq('phone_number', chatId);
      if (chatErr) return NextResponse.json({ error: chatErr.message }, { status: 400 });

      return NextResponse.json({ success: true });
    }

    if (action === 'transfer_chat') {
      const { chatId, staffId, sendNotification = false } = body;
      if (!chatId || !staffId) {
        return NextResponse.json({ error: 'Missing chatId or staffId' }, { status: 400 });
      }

      const { error: upErr } = await supabase
        .from('wa_chats')
        .update({ assigned_staff_id: staffId })
        .eq('phone_number', chatId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

      if (sendNotification) {
        const [{ data: staffData }, { data: chatData }, { data: historyData }] = await Promise.all([
          supabase.from('wa_staff').select('*').eq('id', staffId).single(),
          supabase.from('wa_chats').select('*').eq('phone_number', chatId).single(),
          supabase
            .from('wa_messages')
            .select('*')
            .eq('wa_chat_id', chatId)
            .neq('sender_type', 'system_transfer')
            .order('created_at', { ascending: true })
            .limit(10),
        ]);

        if (staffData) {
          const roleText = staffData.role?.toLowerCase().includes('katim') ? 'Ketua Tim' : staffData.role;
          const transferMessage = `Sesi obrolan Anda telah dialihkan ke *${roleText} ${staffData.department}*. Beliau akan segera merespons Anda.`;

          const lastMsg = chatData?.last_message || '';
          const citizenName = chatData?.name || 'Warga';
          const chatCategory = chatData?.category || 'Umum';
          const chatTicketId = chatData?.ticket_id || `#ID-${Math.floor(1000 + Math.random() * 9000)}`;

          const historyText =
            historyData && historyData.length > 0
              ? historyData
                  .map((msg: any) => `*${msg.sender_type === 'public' ? 'Warga' : 'Admin'}*:\n${msg.message}`)
                  .join('\n\n')
              : `_Warga_:\n${lastMsg}`;

          const katimNotification = `⚠️ *PELIMPAHAN TIKET BARU (${chatCategory.toUpperCase()})*\nPengirim: *${citizenName}*\nTiket: ${chatTicketId}\n\n*Riwayat Percakapan (10 terakhir):*\n\n${historyText}\n\n---\n_(Abaikan tulisan ini, cukup Swipe Kanan pesan ini untuk membalas)_`;

          let katimPhoneTarget = chatId;
          if (staffData.phone_number) {
            let phone = staffData.phone_number.split('@')[0].replace(/\D/g, '');
            if (phone.startsWith('0')) phone = '62' + phone.substring(1);
            katimPhoneTarget = phone + '@s.whatsapp.net';

            await supabase.from('wa_chats').upsert(
              {
                phone_number: katimPhoneTarget,
                name: staffData.name || 'Ketua Tim',
                last_message_time: new Date().toISOString(),
                category: 'Umum',
              },
              { onConflict: 'phone_number' }
            );
          }

          await supabase.from('wa_messages').insert([
            { wa_chat_id: chatId, sender_type: 'staff', message: transferMessage, status: 'pending' },
            { wa_chat_id: katimPhoneTarget, sender_type: 'staff', message: katimNotification, status: 'pending' },
          ]);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'save_staff') {
      const { id, staffForm } = body;
      if (!staffForm) return NextResponse.json({ error: 'Missing staffForm' }, { status: 400 });

      const { error } = id
        ? await supabase.from('wa_staff').update(staffForm).eq('id', id)
        : await supabase.from('wa_staff').insert([staffForm]);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_staff') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
      const { error } = await supabase.from('wa_staff').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Hotline POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
