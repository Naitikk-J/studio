import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { query } from './db';
import type { DrawLine } from './types';

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_API_URL
        : ['http://localhost:3000', 'http://localhost:9002'],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join room
    socket.on('join-room', async (roomCode: string) => {
      socket.join(roomCode);
      console.log(`User ${socket.id} joined room ${roomCode}`);

      // Send all existing drawings to the client
      try {
        const result = await query(
          `SELECT user_id, color, stroke_width, points FROM drawings WHERE room_code = $1 ORDER BY created_at ASC`,
          [roomCode]
        );

        const drawings = result.rows.map((row: any) => ({
          userId: row.user_id,
          color: row.color,
          strokeWidth: row.stroke_width,
          points: row.points,
        }));

        socket.emit('load-drawings', drawings);
      } catch (error) {
        console.error('Failed to load drawings:', error);
      }

      // Notify others in the room
      socket.to(roomCode).emit('user-joined', {
        userId: socket.id,
        timestamp: new Date(),
      });
    });

    // Handle drawing events
    socket.on('draw', async (data: { roomCode: string; line: DrawLine }) => {
      const { roomCode, line } = data;

      // Broadcast to all users in the room
      io?.to(roomCode).emit('draw', { line, userId: socket.id });

      // Save to database
      try {
        await query(
          `INSERT INTO drawings (room_code, user_id, color, stroke_width, points)
           VALUES ($1, $2, $3, $4, $5)`,
          [roomCode, line.userId, line.color, line.strokeWidth, JSON.stringify(line.points)]
        );
      } catch (error) {
        console.error('Failed to save drawing:', error);
        socket.emit('error', 'Failed to save drawing');
      }
    });

    // Handle undo
    socket.on('undo', async (data: { roomCode: string; userId: string }) => {
      const { roomCode, userId } = data;

      try {
        // Get the last drawing by this user in the room
        const result = await query(
          `SELECT id FROM drawings 
           WHERE room_code = $1 AND user_id = $2 
           ORDER BY created_at DESC 
           LIMIT 1`,
          [roomCode, userId]
        );

        if (result.rows.length > 0) {
          const drawingId = result.rows[0].id;
          await query(`DELETE FROM drawings WHERE id = $1`, [drawingId]);

          // Broadcast undo to all users in the room
          io?.to(roomCode).emit('undo', { userId, drawingId });
        }
      } catch (error) {
        console.error('Failed to undo:', error);
        socket.emit('error', 'Failed to undo');
      }
    });

    // Handle clear
    socket.on('clear', async (roomCode: string) => {
      try {
        await query(`DELETE FROM drawings WHERE room_code = $1`, [roomCode]);
        io?.to(roomCode).emit('clear');
      } catch (error) {
        console.error('Failed to clear canvas:', error);
        socket.emit('error', 'Failed to clear canvas');
      }
    });

    // Leave room
    socket.on('leave-room', (roomCode: string) => {
      socket.leave(roomCode);
      console.log(`User ${socket.id} left room ${roomCode}`);
      socket.to(roomCode).emit('user-left', {
        userId: socket.id,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  return io;
}
