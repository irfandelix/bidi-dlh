import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year required' }, { status: 400 });
    }

    const m = parseInt(month) + 1; // JS month is 0-indexed, PostgreSQL date uses 1-indexed
    const startDate = \\-\-01\;
    const lastDay = new Date(parseInt(year), m, 0).getDate();
    const endDate = \\-\-\\;

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('jadwal_mpp')
      .select('officer_id, tanggal')
      .gte('tanggal', startDate)
      .lte('tanggal', endDate);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching jadwal_mpp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    // body: { month: number, year: number, assignments: { officer_id, tanggal }[] }
    const { month, year, assignments } = body;
    
    if (month === undefined || year === undefined || !assignments) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const m = parseInt(month) + 1;
    const startDate = \\-\-01\;
    const lastDay = new Date(parseInt(year), m, 0).getDate();
    const endDate = \\-\-\\;

    // 1. Delete all existing schedule for this month
    const { error: delError } = await supabase
      .from('jadwal_mpp')
      .delete()
      .gte('tanggal', startDate)
      .lte('tanggal', endDate);
      
    if (delError) throw delError;

    // 2. Insert new schedule
    if (assignments.length > 0) {
      const { error: insError } = await supabase
        .from('jadwal_mpp')
        .insert(assignments);
        
      if (insError) throw insError;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving jadwal_mpp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
