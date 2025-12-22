require('dotenv').config({ path: '.env.local' });

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const { Pool } = require('pg');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '9002', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize database pool
console.log('Initializing database pool...');

// Parse connection string
let poolConfig = {
  ssl: {
    rejectUnauthorized: false,
  },
};

if (process.env.DATABASE_URL) {
  console.log('✓ DATABASE_URL is set');
  poolConfig.connectionString = process.env.DATABASE_URL;
} else {
  console.error('✗ DATABASE_URL environment variable is not set');
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});

const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Initialize database schema
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    try {
      // Create rooms table
      await client.query(`
        CREATE TABLE IF NOT EXISTS rooms (
          id SERIAL PRIMARY KEY,
          code VARCHAR(6) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create drawings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS drawings (
          id SERIAL PRIMARY KEY,
          room_code VARCHAR(6) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          color VARCHAR(7) NOT NULL,
          stroke_width INT NOT NULL,
          points JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_code) REFERENCES rooms(code) ON DELETE CASCADE
        )
      `);

      // Create index for faster queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_drawings_room_code ON drawings(room_code)
      `);

      console.log('✓ Database initialized successfully');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('⚠️  Database initialization error:', error.message);
    return false;
  }
};

app.prepare().then(async () => {
  // Initialize database (non-blocking)
  initializeDatabase().then((success) => {
    if (success) {
      console.log('✓ Database ready for drawing sync');
    } else {
      console.error('⚠️  Database not available. Please verify your DATABASE_URL.');
    }
  });

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.io
  const io = new SocketIOServer(httpServer, {
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
    socket.on('join-room', async (roomCode) => {
      socket.join(roomCode);
      console.log(`User ${socket.id} joined room ${roomCode}`);

      // Send all existing drawings to the client
      try {
        const result = await query(
          `SELECT user_id, color, stroke_width, points FROM drawings WHERE room_code = $1 ORDER BY created_at ASC`,
          [roomCode]
        );

        const drawings = result.rows.map((row) => ({
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
    socket.on('draw', async (data) => {
      const { roomCode, line } = data;

      // Broadcast to all users in the room
      io.to(roomCode).emit('draw', { line, userId: socket.id });

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
    socket.on('undo', async (data) => {
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
          io.to(roomCode).emit('undo', { userId, drawingId });
        }
      } catch (error) {
        console.error('Failed to undo:', error);
        socket.emit('error', 'Failed to undo');
      }
    });

    // Handle clear
    socket.on('clear', async (roomCode) => {
      try {
        await query(`DELETE FROM drawings WHERE room_code = $1`, [roomCode]);
        io.to(roomCode).emit('clear');
      } catch (error) {
        console.error('Failed to clear canvas:', error);
        socket.emit('error', 'Failed to clear canvas');
      }
    });

    // Leave room
    socket.on('leave-room', (roomCode) => {
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

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`✓ Ready on http://${hostname}:${port}`);
  });
});
