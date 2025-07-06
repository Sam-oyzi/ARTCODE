import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Models API endpoint is working',
    note: 'Use /api/models/[fileId] for specific files'
  });
} 