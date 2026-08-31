import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear();

    const apis = [
      `https://api-hari-libur.vercel.app/api?year=${year}`,
      `https://tanggalmerah.upset.dev/api/holidays?year=${year}`,
      `https://dayoffapi.vercel.app/api?year=${year}`
    ];

    let holidays: string[] = [];

    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl, { 
          next: { revalidate: 86400 } // Cache for 24 hours
        });
        
        if (!response.ok) continue;

        const data = await response.json();
        
        if (apiUrl.includes('api-hari-libur')) {
          if (data && Array.isArray(data.data)) {
            holidays = data.data.map((d: any) => d.date);
            break;
          } else if (Array.isArray(data)) {
            holidays = data.map((d: any) => d.date);
            break;
          }
        } 
        else if (apiUrl.includes('tanggalmerah')) {
          if (Array.isArray(data)) {
            holidays = data.map((d: any) => d.holiday_date);
            break;
          }
        }
        else if (apiUrl.includes('dayoffapi')) {
          if (Array.isArray(data)) {
            holidays = data.filter((d: any) => d.is_national_holiday).map((d: any) => d.holiday_date);
            break;
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch from ${apiUrl}`);
      }
    }

    return NextResponse.json({ data: holidays }, { status: 200 });
  } catch (error: any) {
    console.error('API Hari Libur Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
