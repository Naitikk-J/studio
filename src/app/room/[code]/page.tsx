import DrawingRoom from "@/components/drawing-room";

type RoomPageProps = {
  params: {
    code: string;
  };
};

export default function RoomPage({ params }: RoomPageProps) {
  return <DrawingRoom roomCode={params.code} />;
}
