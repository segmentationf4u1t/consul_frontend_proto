'use client';

import { useState } from 'react';
import { AnimatedMazeBackground } from '@/components/ui/animated-maze-background';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function MazePage() {
  const [cellSize, setCellSize] = useState([20]);
  const [animationSpeed, setAnimationSpeed] = useState([50]);
  const [opacity, setOpacity] = useState([0.15]);
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="relative min-h-screen">
      {/* Animated Maze Background */}
      {isVisible && (
        <AnimatedMazeBackground
          cellSize={cellSize[0]}
          animationSpeed={animationSpeed[0]}
          opacity={opacity[0]}
          color="#6366f1"
        />
      )}
      
      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Animated Maze Background
            </h1>
            <p className="text-lg text-muted-foreground">
              A minimal and elegant maze generation and solving animation
            </p>
          </div>

          {/* Controls */}
          <Card className="p-6 space-y-6 bg-background/80 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-semibold">Controls</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cellSize">Cell Size: {cellSize[0]}px</Label>
                <Slider
                  id="cellSize"
                  min={10}
                  max={40}
                  step={2}
                  value={cellSize}
                  onValueChange={setCellSize}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="animationSpeed">Animation Speed: {animationSpeed[0]}ms</Label>
                <Slider
                  id="animationSpeed"
                  min={10}
                  max={200}
                  step={10}
                  value={animationSpeed}
                  onValueChange={setAnimationSpeed}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opacity">Opacity: {Math.round(opacity[0] * 100)}%</Label>
                <Slider
                  id="opacity"
                  min={0.05}
                  max={0.5}
                  step={0.05}
                  value={opacity}
                  onValueChange={setOpacity}
                  className="w-full"
                />
              </div>

              <Button
                onClick={() => setIsVisible(!isVisible)}
                variant={isVisible ? "destructive" : "default"}
                className="w-full"
              >
                {isVisible ? "Hide Animation" : "Show Animation"}
              </Button>
            </div>
          </Card>

          {/* Information */}
          <Card className="p-6 space-y-4 bg-background/80 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-semibold">How it works</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Generation:</strong> Uses recursive backtracking algorithm to create a perfect maze
              </p>
              <p>
                <strong>Solving:</strong> Employs a pathfinding algorithm to find the route from top-left to bottom-right
              </p>
              <p>
                <strong>Animation:</strong> Continuously cycles through generation → solving → reset
              </p>
              <p>
                <strong>Performance:</strong> Optimized with Canvas API and requestAnimationFrame for smooth 60fps animation
              </p>
            </div>
          </Card>

          {/* Usage Example */}
          <Card className="p-6 space-y-4 bg-background/80 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-semibold">Usage</h2>
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
{`import { AnimatedMazeBackground } from '@/components/ui/animated-maze-background';

// Basic usage
<AnimatedMazeBackground />

// With custom props
<AnimatedMazeBackground
  cellSize={20}
  animationSpeed={50}
  opacity={0.1}
  color="#6366f1"
  className="custom-class"
/>`}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}