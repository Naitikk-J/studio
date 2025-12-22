# Real-Time Collaborative Drawing Setup

This guide explains how to set up and use the real-time collaborative canvas drawing feature powered by PostgreSQL and WebSocket.

## Architecture

The real-time drawing system consists of:

- **Frontend**: React components using Socket.io client for real-time updates
- **Backend**: Custom Node.js server with Socket.io for WebSocket communication
- **Database**: PostgreSQL (Supabase) for persistent storage of drawings

## Prerequisites

1. PostgreSQL database (Supabase recommended)
2. Node.js 18+ installed
3. npm or yarn package manager

## Setup Steps

### 1. Database Configuration

Add your PostgreSQL connection string to `.env.local`:

```bash
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/DATABASE
NEXT_PUBLIC_API_URL=http://localhost:9002
```

**Important**: URL-encode special characters in your password:
- `@` becomes `%40`
- `#` becomes `%23`
- `:` becomes `%3A`
- `/` becomes `%2F`

Example: If password is `Naitik@15`, it becomes `Naitik%4015`

### 2. Test Database Connection

Run the connection test to verify your setup:

```bash
npm run test:db
```

This will attempt to connect to your PostgreSQL database and create the required tables.

### 3. Start the Development Server

```bash
npm run dev
```

The server will:
1. Load environment variables from `.env.local`
2. Initialize database tables (if they don't exist)
3. Start listening on port 9002
4. Create a Socket.io server for real-time drawing sync

### 4. Using the App

- **Create a Room**: Click "Create a New Room" to generate a unique 6-digit room code
- **Share the Code**: Share the room code with others
- **Join a Room**: Enter a 6-digit code and click "Join Room"
- **Draw Together**: Once in the same room, you can all draw simultaneously
- **Persistence**: All drawings are saved to PostgreSQL and will be visible even after page refresh

## How It Works

### Client-Server Communication

1. User connects to the app
2. Frontend establishes Socket.io connection to Node.js server
3. User joins a room by emitting `join-room` event
4. Server loads all existing drawings from database and sends them to the client
5. As user draws, each stroke is:
   - Immediately rendered locally
   - Sent to all connected clients in the room via Socket.io
   - Saved to PostgreSQL for persistence

### Real-Time Updates

- **Drawing**: When a user draws a stroke, it's broadcasted to all users in the room via `draw` event
- **Undo**: Removes the last stroke from the user and updates all clients
- **Clear**: Clears all drawings in the room
- **Presence**: Server notifies when users join/leave

## Database Schema

### rooms table
```sql
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### drawings table
```sql
CREATE TABLE drawings (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(6) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  stroke_width INT NOT NULL,
  points JSONB NOT NULL,
  created_at TIMESTAMP,
  FOREIGN KEY (room_code) REFERENCES rooms(code)
);
```

## Troubleshooting

### Database Connection Fails

**Error**: `ECONNREFUSED` or connection timeout

**Solutions**:
1. Verify DATABASE_URL is correctly set in `.env.local`
2. Check credentials are correct (especially password special characters)
3. Ensure network connectivity to database host
4. Run `npm run test:db` to diagnose the issue

### Drawings Not Syncing

**Error**: Drawings appear locally but not on other clients

**Solutions**:
1. Check browser console for Socket.io errors
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Ensure the server is running (`npm run dev`)
4. Check network tab for WebSocket connection

### Tables Already Exist

The schema initialization uses `CREATE TABLE IF NOT EXISTS`, so it won't error if tables already exist.

## Development Commands

```bash
# Start development server with real-time sync
npm run dev

# Test database connection
npm run test:db

# Build for production
npm run build

# Start production server
npm start
```

## Security Considerations

- `.env.local` is in `.gitignore` and won't be committed
- Database credentials are only used server-side
- Never commit credentials to version control
- For production, use environment variables in your hosting platform

## Performance Tips

- Drawings are indexed by room_code for fast queries
- Connection pooling reduces database overhead
- Socket.io handles client disconnections gracefully
- Old rooms can be cleaned up by deleting from the database

## Future Enhancements

- User authentication and profiles
- Drawing history/timeline
- Collaborative cursors showing where others are drawing
- Export drawings to PNG/PDF
- Drawing templates and backgrounds
