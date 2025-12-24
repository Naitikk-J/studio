"use client";

import { Palette, Undo2, Trash2, Eraser, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type ToolbarProps = {
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onSync: () => void;
  onEraser: () => void;
};

const colors = [
  // Neutrals
  "#000000", "#FFFFFF", "#808080", "#C0C0C0", "#D3D3D3", "#A9A9A9",

  // Reds & Pinks
  "#FF3B30", "#FF6B6B", "#FF1744", "#FF69B4", "#FFB6C1", "#FFC0CB",

  // Oranges & Yellows
  "#FF9500", "#FFA500", "#FFD700", "#FFCC00", "#FFA52D", "#FFB347",

  // Greens
  "#4CD964", "#00C853", "#00E676", "#7FD956", "#90EE90", "#98FF98",

  // Blues
  "#5AC8FA", "#007AFF", "#0000FF", "#0099FF", "#00BFFF", "#87CEEB",

  // Purples & Magentas
  "#5856D6", "#9932CC", "#DDA0DD", "#FF00FF", "#EE82EE", "#DA70D6",

  // Pastels
  "#FFD1DC", "#F0E6EF", "#ADD8E6", "#E0BBFF", "#FFCCCB", "#FFE4B5",

  // Glitter & Sparkly Colors (Metallics)
  "#FFC700", "#E8E8E8", "#FAFAD2", "#F5DEB3", "#FFDAB9", "#FFE4C4",

  // Neon & Bright Colors
  "#FF006E", "#FB5607", "#FFBE0B", "#8338EC", "#3A86FF", "#06FFA5",

  // Bronze & Copper
  "#CD7F32", "#B87333", "#D4AF37", "#F0AD4E", "#E8943D",

  // Turquoise & Teal
  "#40E0D0", "#20B2AA", "#00CED1", "#AFEEEE", "#5FE3D0",

  // More Fun Colors
  "#FF0080", "#FF4500", "#FF8C00", "#ADFF2F", "#00FF00",
  "#00FFFF", "#1E90FF", "#FF1493", "#FFE4E1", "#FFFACD",

  // Extra Glitter & Light Colors
  "#F0E68C", "#EEE8AA", "#FFF8DC", "#FFFAF0", "#FFFFF0"
];

export function Toolbar({
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  onUndo,
  onClear,
  onSync,
  onEraser,
}: ToolbarProps) {
  return (
    <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg">
      <CardContent className="p-2 flex items-center gap-2">
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Palette />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Color</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-auto max-h-96 overflow-y-auto">
            <div className="space-y-3">
              <div className="grid grid-cols-6 gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c ? "border-primary ring-2 ring-ring" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-xs font-medium">Custom:</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2">
                <div
                  className="rounded-full transition-transform"
                  style={{
                    backgroundColor: color,
                    width: `${Math.min(strokeWidth * 2, 24)}px`,
                    height: `${Math.min(strokeWidth * 2, 24)}px`
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Brush size: {strokeWidth}px</TooltipContent>
          </Tooltip>
          <Slider
            min={1}
            max={50}
            step={1}
            value={[strokeWidth]}
            onValueChange={(value) => setStrokeWidth(value[0])}
            className="w-28"
          />
        </div>

        <Separator orientation="vertical" className="h-8" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onEraser}>
              <Eraser />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Eraser</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onUndo}>
              <Undo2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onClear}>
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear Canvas</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onSync}>
              <Download />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sync Canvas</TooltipContent>
        </Tooltip>

      </CardContent>
    </Card>
  );
}
