
require('dotenv').config({ path: '.env.local' });

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const { MongoClient } = require('mongodb');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '9002', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('✗ MONGODB_URI environment variable is not set');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
let db;
let drawingsCollection;
let roomsCollection;

async function connectToDb() {
  try {
    await client.connect();
    db = client.db('drawing_app'); // Use a specific database name
    drawingsCollection = db.collection('drawings');
    roomsCollection = db.collection('rooms');
    console.log('✓ Connected to MongoDB');
    // Create index for faster queries
    await drawingsCollection.createIndex({ roomCode: 1 });
    console.log('✓ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('⚠️ Database connection error:', error.message);
    return false;
  }
}

app.prepare().then(async () => {
  const dbConnected = await connectToDb();

  if (dbConnected) {
    console.log('✓ Database ready for drawing sync');
  } else {
    console.error('⚠️ Database not available. Please verify your MONGODB_URI.');
  }

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

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: dev ? ['http://localhost:3000', 'http://localhost:9002'] : process.env.NEXT_PUBLIC_API_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join-room', async (roomCode) => {
      socket.join(roomCode);
      console.log(`👤 User ${socket.id.substring(0, 5)}... joined room ${roomCode}`);

      if (!dbConnected) {
        socket.emit('error', 'Database not connected');
        return;
      }

      try {
        const drawings = await drawingsCollection.find({ roomCode }).sort({ createdAt: 1 }).toArray();
        const loadedDrawings = drawings.map(d => ({
            userId: d.userId,
            color: d.color,
            strokeWidth: d.strokeWidth,
            points: d.points,
        }));
        console.log(`📦 Sending ${loadedDrawings.length} drawings to ${socket.id.substring(0, 5)}...`);
        socket.emit('load-drawings', loadedDrawings);
      } catch (error) {
        console.error('Failed to load drawings:', error);
        socket.emit('error', 'Failed to load drawings');
      }
        socket.to(roomCode).emit('user-joined', { userId: socket.id });
    });

    socket.on('draw', async (data) => {
        const { roomCode, line } = data;
        if (!dbConnected) return;

        // Broadcast to other users
        socket.to(roomCode).emit('draw', { line, userId: socket.id });

        // Save to database
        try {
            await roomsCollection.updateOne({ code: roomCode }, { $setOnInsert: { code: roomCode, createdAt: new Date() } }, { upsert: true });

            const drawingDoc = {
                roomCode,
                userId: line.userId,
                color: line.color,
                strokeWidth: line.strokeWidth,
                points: line.points,
                createdAt: new Date(),
            };
            const result = await drawingsCollection.insertOne(drawingDoc);
            console.log(`💾 Successfully saved drawing ID ${result.insertedId} to database for room ${roomCode}`);

        } catch (error) {
            console.error('❌ Failed to save drawing:', error.message);
            socket.emit('error', `Database error: ${error.message}`);
        }
    });

    socket.on('undo', async (data) => {
        const { roomCode, userId } = data;
        if (!dbConnected) return;

        try {
            const lastDrawing = await drawingsCollection.findOneAndDelete(
                { roomCode, userId },
                { sort: { createdAt: -1 } }
            );

            if (lastDrawing.value) {
                io.to(roomCode).emit('undo', userId);
                console.log(`↪️ Undid last drawing for user ${userId} in room ${roomCode}`);
            }
        } catch (error) {
            console.error('Failed to undo:', error);
            socket.emit('error', 'Failed to undo');
        }
    });

    socket.on('clear', async (roomCode) => {
        if (!dbConnected) return;
        try {
            await drawingsCollection.deleteMany({ roomCode });
            io.to(roomCode).emit('clear');
            console.log(`🔥 Cleared canvas for room ${roomCode}`);
        } catch (error) {
            console.error('Failed to clear canvas:', error);
            socket.emit('error', 'Failed to clear canvas');
        }
    });

    socket.on('leave-room', (roomCode) => {
      socket.leave(roomCode);
      console.log(`User ${socket.id} left room ${roomCode}`);
      socket.to(roomCode).emit('user-left', { userId: socket.id });
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
