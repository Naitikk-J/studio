"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { DrawLine } from "@/lib/types";
import { useToast } from "./use-toast";

type UseDrawSocketProps = {
  roomCode: string;
  color: string;
  strokeWidth: number;
};

function drawLine(
  ctx: CanvasRenderingContext2D,
  line: Omit<DrawLine, "userId">
) {
  if (!line.points || line.points.length === 0) return;
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

export function useDrawSocket({ roomCode, color, strokeWidth }: UseDrawSocketProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentLineRef = useRef<DrawLine | null>(null);
  const userIdRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();

  const colorRef = useRef(color);
  const strokeWidthRef = useRef(strokeWidth);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);

  useEffect(() => {
    if (!userIdRef.current) {
      userIdRef.current = Math.random().toString(36).substring(2, 9);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize Socket.io connection
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    const socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    const redrawAll = (actions: DrawLine[]) => {
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      actions.forEach((line) => {
        if (line) drawLine(context, line);
      });
    };

    const setCanvasSize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    setCanvasSize();

    // Socket event listeners
    socket.on("connect", () => {
      console.log("Connected to server, joining room:", roomCode);
      socket.emit("join-room", roomCode);
    });

    socket.on("load-drawings", (drawings: DrawLine[]) => {
      console.log("Loaded", drawings.length, "drawings");
      redrawAll(drawings);
    });

    socket.on("draw", (data: { line: DrawLine; userId: string }) => {
      const context = canvas.getContext("2d");
      if (context) {
        drawLine(context, data.line);
      }
    });

    socket.on("undo", (data: { userId: string; drawingId: number }) => {
      // Reload all drawings from server
      socket.emit("join-room", roomCode);
    });

    socket.on("clear", () => {
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    socket.on("user-joined", (data) => {
      console.log("User joined:", data.userId);
    });

    socket.on("user-left", (data) => {
      console.log("User left:", data.userId);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to sync drawing. Please check your connection.",
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    window.addEventListener("resize", setCanvasSize);

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
        color: colorRef.current,
        strokeWidth: strokeWidthRef.current,
      };
    };

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current || !currentLineRef.current) return;
      e.preventDefault();
      const point = getPoint(e);
      currentLineRef.current.points.push(point);

      const tempCtx = canvas.getContext("2d");
      if (tempCtx) {
        drawLine(tempCtx, currentLineRef.current);
      }
    };

    const onMouseUp = () => {
      if (!isDrawingRef.current || !currentLineRef.current) return;

      if (currentLineRef.current.points.length > 1 && socket) {
        socket.emit("draw", {
          roomCode,
          line: currentLineRef.current,
        });
      }
      isDrawingRef.current = false;
      currentLineRef.current = null;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onMouseDown, { passive: false });
    canvas.addEventListener("touchmove", onMouseMove, { passive: false });
    window.addEventListener("touchend", onMouseUp);

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onMouseDown);
      canvas.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("touchend", onMouseUp);

      if (socket) {
        socket.emit("leave-room", roomCode);
        socket.disconnect();
      }
    };
  }, [roomCode, toast]);

  const handleClear = () => {
    if (socketRef.current) {
      socketRef.current.emit("clear", roomCode);
    }
    toast({
      title: "Canvas Cleared!",
      description: "The canvas is fresh and ready for new ideas.",
    });
  };

  const handleUndo = () => {
    if (socketRef.current && userIdRef.current) {
      socketRef.current.emit("undo", {
        roomCode,
        userId: userIdRef.current,
      });
    }
  };

  return { canvasRef, handleClear, handleUndo };
}
