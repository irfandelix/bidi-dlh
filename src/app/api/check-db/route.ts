import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase: any = await createClient();
    
    // Check if dokumens has latitude
    const { data: checkData, error: checkError } = await supabase.from('dokumens').select('latitude').limit(1);
    
    if (checkError) {
       return NextResponse.json({ error: checkError.message });
    }
    
    return NextResponse.json({ message: 'Columns already exist' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
