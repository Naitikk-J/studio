export type Point = { x: number; y: number };

export type DrawLine = {
  userId: string;
  points: Point[];
  color: string;
  strokeWidth: number;
  isEraser?: boolean;
};

export type RoomData = {
  actions: Record<string, DrawLine>;
};
