"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Share2 } from "lucide-react";
import { useDraw } from "@/hooks/useDraw";
import { Button } from "@/components/ui/button";
import { Toolbar } from "@/components/toolbar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

type DrawingRoomProps = {
  roomCode: string;
};

export default function DrawingRoom({ roomCode }: DrawingRoomProps) {
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const { canvasRef, handleClear, handleUndo, handleSync } = useDraw({
    roomCode,
    color,
    strokeWidth,
    isEraser,
  });
  const { toast } = useToast();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: `Room code ${roomCode} is ready to be shared.`,
    });
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full w-full overflow-hidden">
        <header className="flex items-center justify-between p-2 border-b bg-card z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/">
                    <Home className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Back to Home</p>
              </TooltipContent>
            </Tooltip>
            <h1 className="font-headline text-xl">
              Room: <span className="font-mono text-primary-foreground tracking-widest">{roomCode}</span>
            </h1>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy Invite Link</p>
            </TooltipContent>
          </Tooltip>
        </header>

        <main className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full bg-white touch-none"
          />
          <Toolbar
            color={color}
            setColor={setColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            onClear={handleClear}
            onUndo={handleUndo}
            onSync={handleSync}
            isEraser={isEraser}
            setIsEraser={setIsEraser}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}
