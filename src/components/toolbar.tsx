"use client";

import { Palette, Undo2, Trash2 } from "lucide-react";
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
};

const colors = [
  "#000000", "#FFFFFF", "#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#5AC8FA", "#007AFF", "#5856D6",
  '#FFD1DC', '#F0E6EF', '#ADD8E6' 
];

export function Toolbar({
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  onUndo,
  onClear,
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
          <PopoverContent className="w-auto">
            <div className="grid grid-cols-4 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === c ? "border-primary ring-2 ring-ring" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full border-none appearance-none cursor-pointer bg-transparent"
                style={{'--color': color} as React.CSSProperties}
              />
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex items-center gap-2 w-32 px-2">
            <div className="w-5 h-5 rounded-full" style={{backgroundColor: color, transform: `scale(${strokeWidth/10})`}}/>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[strokeWidth]}
              onValueChange={(value) => setStrokeWidth(value[0])}
            />
        </div>

        <Separator orientation="vertical" className="h-8" />

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
      </CardContent>
    </Card>
  );
}
