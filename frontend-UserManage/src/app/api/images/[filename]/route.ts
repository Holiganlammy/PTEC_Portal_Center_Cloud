// app/api/images/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const filePath = path.join('D:', 'files', 'smartBill', filename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase();

    const contentType = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    }[ext] || 'image/jpeg';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    return new NextResponse('Error reading file', { status: 500 });
  }
}