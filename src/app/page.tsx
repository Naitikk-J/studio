"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Paintbrush, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { generateRoomCode } from "@/lib/utils";

export default function Home() {
  console.log("Home component rendering");

  const router = useRouter();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = () => {
    console.log("Button clicked!");
    try {
      setIsCreating(true);
      const newRoomCode = generateRoomCode();
      console.log("Creating room with code:", newRoomCode);

      // Show toast first
      toast({
        title: "Room Created!",
        description: `Room code: ${newRoomCode}`,
      });

      // Then navigate
      setTimeout(() => {
        router.push(`/room/${newRoomCode}`);
      }, 100);
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create room. Please try again.",
      });
      setIsCreating(false);
    }
  };

  console.log("isCreating state:", isCreating);

  const handleJoinRoom = (e: FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length === 6) {
      router.push(`/room/${roomCode.trim()}`);
    }
  };

  return (
    <main className="flex min-h-full flex-col items-center justify-center p-4 bg-grid-pattern">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <div className="bg-primary/20 p-3 rounded-full">
              <Paintbrush className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="font-headline text-4xl">AJDraw</CardTitle>
          <CardDescription className="text-lg">
            Draw with anyone, anywhere.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <button
            onClick={(e) => {
              console.log("Click event fired", e);
              handleCreateRoom();
            }}
            onMouseDown={(e) => {
              console.log("Mouse down event fired", e);
            }}
            disabled={isCreating}
            type="button"
            style={{
              width: "100%",
              padding: "1.75rem 1rem",
              fontSize: "1.125rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              border: "none",
              borderRadius: "0.375rem",
              cursor: isCreating ? "not-allowed" : "pointer",
              opacity: isCreating ? 0.5 : 1,
              fontFamily: "inherit",
              fontSize: "1.125rem",
              fontWeight: "500",
            }}
          >
            <Paintbrush style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem" }} />
            {isCreating ? "Creating..." : "Create a New Room"}
          </button>
          
          <div className="flex items-center space-x-4">
            <Separator className="flex-1" />
            <span className="text-muted-foreground font-medium">OR</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-code" className="text-base">Join with a code</Label>
              <Input
                id="room-code"
                placeholder="Enter 6-digit code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg tracking-[0.3em] h-14"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full text-lg py-7"
              disabled={roomCode.trim().length !== 6}
            >
              <Users className="mr-2 h-5 w-5" /> Join Room
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            Create a room and share the code to start drawing together in real-time.
          </p>
        </CardFooter>
      </Card>
      <style jsx global>{`
        .bg-grid-pattern {
          background-color: hsl(var(--background));
          background-image:
            linear-gradient(hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to right, hsl(var(--border)) 1px, hsl(var(--background)) 1px);
          background-size: 2rem 2rem;
        }
      `}</style>
    </main>
  );
}
