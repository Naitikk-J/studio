# AJDraw - Real-Time Collaborative Canvas

A real-time collaborative drawing application where multiple users can draw together in the same room with persistent storage.

## Features

- 🎨 **Real-Time Synchronization**: Draw simultaneously with others using WebSocket
- 💾 **Persistent Storage**: All drawings are saved to PostgreSQL and restored on page refresh
- 🔗 **Room-Based Access**: Share a 6-digit code to invite others to draw
- 🎯 **Touch & Mouse Support**: Works on desktop and mobile devices
- 🚀 **Low-Latency Updates**: Sub-100ms synchronization between users
- 🎨 **Color & Brush Customization**: Adjust colors and stroke width

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your database connection in `.env.local`:
   ```bash
   DATABASE_URL=postgresql://user:password@host:5432/database
   NEXT_PUBLIC_API_URL=http://localhost:9002
   ```

4. Test the database connection:
   ```bash
   npm run test:db
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open `http://localhost:9002` in your browser

## How to Use

1. **Create a Room**: Click "Create a New Room" to generate a unique code
2. **Share the Code**: Send the 6-digit code to others
3. **Join a Room**: Enter the code and click "Join Room"
4. **Start Drawing**: Click and drag to draw on the canvas
5. **Customize**: Use the toolbar to change colors and brush size
6. **Collaborate**: Everyone in the room sees your drawings in real-time

## Architecture

### Tech Stack

- **Frontend**: React 19, Next.js 15, Tailwind CSS
- **Real-Time Communication**: Socket.io
- **Database**: PostgreSQL (Supabase)
- **Backend**: Node.js with custom server
- **UI Components**: Radix UI

### How It Works

1. Users connect via WebSocket (Socket.io)
2. Each drawing stroke is broadcasted to all users in the room
3. Strokes are persisted in PostgreSQL for durability
4. On page load, all existing drawings are restored from the database
5. Users can undo their own drawings or clear the entire canvas

## Project Structure

```
studio/
├── src/
│   ├── app/           # Next.js app directory
│   │   ├── page.tsx   # Home page (Create/Join room)
│   │   └── room/      # Room drawing page
│   ├── components/    # React components
│   │   ├── drawing-room.tsx    # Main drawing interface
│   │   └── toolbar.tsx         # Drawing controls
│   ├── hooks/         # Custom React hooks
│   │   └── useDrawSocket.ts    # Socket-based drawing logic
│   └── lib/           # Utilities and types
│       ├── db.ts      # Database utilities
│       └── types.ts   # TypeScript types
├── server.js          # Custom Node.js server with Socket.io
└── test-db-connection.js # Database connection test
```

## Development Commands

```bash
# Start development server
npm run dev

# Test database connection
npm run test:db

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type check
npm run typecheck
```

## Setup Guide

For detailed setup instructions, including database configuration and troubleshooting, see [SETUP_REALTIME_DRAWING.md](./SETUP_REALTIME_DRAWING.md).

## Database Schema

The application uses PostgreSQL with two main tables:

- **rooms**: Stores room information and metadata
- **drawings**: Stores individual drawing strokes with coordinates, colors, and widths

See [SETUP_REALTIME_DRAWING.md](./SETUP_REALTIME_DRAWING.md) for the complete schema.

## Performance

- Supports multiple concurrent users per room
- Real-time sync latency: <100ms typical
- Handles high-frequency drawing events efficiently
- Database queries optimized with indexes

## Troubleshooting

### Database Connection Issues

Run the connection test:
```bash
npm run test:db
```

### Drawings Not Syncing

1. Check that the server is running (`npm run dev`)
2. Verify `NEXT_PUBLIC_API_URL` matches your server address
3. Check browser console for Socket.io errors

See [SETUP_REALTIME_DRAWING.md](./SETUP_REALTIME_DRAWING.md) for more troubleshooting tips.

## Security

- Credentials are stored in `.env.local` (not committed)
- Database operations use parameterized queries to prevent SQL injection
- Connection pooling prevents resource exhaustion

## Contributing

Feel free to contribute improvements! Areas for enhancement:
- User authentication
- Drawing history/timeline
- Collaborative cursors
- Export functionality
- Drawing templates

## License

Created with [Builder.io](https://www.builder.io)
