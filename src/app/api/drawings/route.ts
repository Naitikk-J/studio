import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Get all drawings for a room
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get('roomCode');

  if (!roomCode || roomCode.length !== 6) {
    return NextResponse.json(
      { error: 'Invalid room code' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `SELECT id, user_id, color, stroke_width, points, created_at 
       FROM drawings 
       WHERE room_code = $1 
       ORDER BY created_at ASC`,
      [roomCode]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch drawings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drawings' },
      { status: 500 }
    );
  }
}

// Save a drawing stroke
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, userId, color, strokeWidth, points } = body;

    if (!roomCode || roomCode.length !== 6 || !userId || !points) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure room exists
    await query(
      `INSERT INTO rooms (code) VALUES ($1) ON CONFLICT (code) DO NOTHING`,
      [roomCode]
    );

    // Save drawing
    const result = await query(
      `INSERT INTO drawings (room_code, user_id, color, stroke_width, points)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, color, stroke_width, points, created_at`,
      [roomCode, userId, color, strokeWidth, JSON.stringify(points)]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to save drawing:', error);
    return NextResponse.json(
      { error: 'Failed to save drawing' },
      { status: 500 }
    );
  }
}

// Clear all drawings in a room
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get('roomCode');

  if (!roomCode || roomCode.length !== 6) {
    return NextResponse.json(
      { error: 'Invalid room code' },
      { status: 400 }
    );
  }

  try {
    await query(
      `DELETE FROM drawings WHERE room_code = $1`,
      [roomCode]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear drawings:', error);
    return NextResponse.json(
      { error: 'Failed to clear drawings' },
      { status: 500 }
    );
  }
}
