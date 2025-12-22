"use client";

import DrawingRoom from "@/components/drawing-room";
import { use } from "react";

type RoomPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default function RoomPage({ params }: RoomPageProps) {
  const { code } = use(params);
  return <DrawingRoom roomCode={code} />;
}
