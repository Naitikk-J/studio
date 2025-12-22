"use client";

import { useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, push, get, set, serverTimestamp } from "firebase/database";
import type { DrawLine, RoomData } from "@/lib/types";
import { useToast } from "./use-toast";

type UseDrawProps = {
  roomCode: string;
  color: string;
  strokeWidth: number;
};

function drawLine(
  ctx: CanvasRenderingContext2D,
  line: Omit<DrawLine, "userId">
) {
  ctx.strokeStyle = line.color;
  ctx.lineWidth = line.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(line.points[0].x, line.points[0].y);
  for (let i = 1; i < line.points.length; i++) {
    ctx.lineTo(line.points[i].x, line.points[i].y);
  }
  ctx.stroke();
}

export function useDraw({ roomCode, color, strokeWidth }: UseDrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentLineRef = useRef<DrawLine | null>(null);
  const userIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Generate a unique user ID for this session
    if (!userIdRef.current) {
      userIdRef.current = Math.random().toString(36).substring(2, 9);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasSize = () => {
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        redrawAll();
    };

    // Firebase listener
    const dbRef = ref(db, `rooms/${roomCode}`);
    const redrawAll = () => {
        get(dbRef).then((snapshot) => {
            if (snapshot.exists()) {
                const data: RoomData = snapshot.val();
                const actions = data.actions ? Object.values(data.actions) : [];
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                actions.forEach((line) => drawLine(ctx, line));
            } else {
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
    };
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
        if (!snapshot.exists()) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        const data: RoomData = snapshot.val();
        const actions = data.actions ? Object.values(data.actions) : [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        actions.forEach((line) => drawLine(ctx, line));
    });

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);


    // Mouse/Touch event handlers
    const getPoint = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
        const rect = canvas.getBoundingClientRect();
        if (e instanceof MouseEvent) {
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
        const touch = e.touches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const onMouseDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      const point = getPoint(e);
      currentLineRef.current = {
        userId: userIdRef.current!,
        points: [point],
        color,
        strokeWidth,
      };
    };

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current || !currentLineRef.current) return;
      e.preventDefault();
      const point = getPoint(e);
      currentLineRef.current.points.push(point);
      drawLine(ctx, currentLineRef.current);
    };

    const onMouseUp = () => {
      if (!isDrawingRef.current || !currentLineRef.current) return;
      isDrawingRef.current = false;
      
      const actionsRef = ref(db, `rooms/${roomCode}/actions`);
      push(actionsRef, currentLineRef.current);
      currentLineRef.current = null;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onMouseDown, { passive: false });
    canvas.addEventListener("touchmove", onMouseMove, { passive: false });
    window.addEventListener("touchend", onMouseUp);

    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasSize);
      unsubscribe();
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onMouseDown);
      canvas.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [roomCode, color, strokeWidth]);

  const handleClear = () => {
    const roomRef = ref(db, `rooms/${roomCode}`);
    set(roomRef, null);
    toast({
        title: "Canvas Cleared!",
        description: "The canvas is fresh and ready for new ideas.",
    });
  };

  const handleUndo = async () => {
    const actionsRef = ref(db, `rooms/${roomCode}/actions`);
    const snapshot = await get(actionsRef);
    if (snapshot.exists()) {
      const actions: Record<string, DrawLine> = snapshot.val();
      const userActions = Object.entries(actions).filter(
        ([, action]) => action.userId === userIdRef.current
      );
      if (userActions.length > 0) {
        const lastActionKey = userActions[userActions.length - 1][0];
        const lastActionRef = ref(db, `rooms/${roomCode}/actions/${lastActionKey}`);
        set(lastActionRef, null);
      } else {
        toast({
            variant: "destructive",
            title: "Nothing to Undo",
            description: "You haven't drawn anything yet.",
        })
      }
    }
  };

  return { canvasRef, handleClear, handleUndo };
}
