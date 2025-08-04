'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Cell {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
  inPath: boolean;
}

interface AnimatedMazeBackgroundProps {
  className?: string;
  cellSize?: number;
  animationSpeed?: number;
  opacity?: number;
  color?: string;
}

export const AnimatedMazeBackground: React.FC<AnimatedMazeBackgroundProps> = ({
  className = '',
  cellSize = 20,
  animationSpeed = 50,
  opacity = 0.1,
  color = '#000000'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>();
  const mazeRef = useRef<Cell[][]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const solverPositionRef = useRef({ x: 0, y: 0 });
  const phaseRef = useRef<'generating' | 'solving' | 'complete'>('generating');
  const timerRef = useRef<number>(0);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize maze
  const initializeMaze = (cols: number, rows: number): Cell[][] => {
    const maze: Cell[][] = [];
    for (let y = 0; y < rows; y++) {
      maze[y] = [];
      for (let x = 0; x < cols; x++) {
        maze[y][x] = {
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false,
          inPath: false
        };
      }
    }
    return maze;
  };

  // Get unvisited neighbors
  const getUnvisitedNeighbors = (cell: Cell, maze: Cell[][]): Cell[] => {
    const neighbors: Cell[] = [];
    const { x, y } = cell;
    const rows = maze.length;
    const cols = maze[0].length;

    if (y > 0 && !maze[y - 1][x].visited) neighbors.push(maze[y - 1][x]); // top
    if (x < cols - 1 && !maze[y][x + 1].visited) neighbors.push(maze[y][x + 1]); // right
    if (y < rows - 1 && !maze[y + 1][x].visited) neighbors.push(maze[y + 1][x]); // bottom
    if (x > 0 && !maze[y][x - 1].visited) neighbors.push(maze[y][x - 1]); // left

    return neighbors;
  };

  // Remove wall between two cells
  const removeWall = (current: Cell, neighbor: Cell) => {
    const dx = current.x - neighbor.x;
    const dy = current.y - neighbor.y;

    if (dx === 1) {
      current.walls.left = false;
      neighbor.walls.right = false;
    } else if (dx === -1) {
      current.walls.right = false;
      neighbor.walls.left = false;
    }

    if (dy === 1) {
      current.walls.top = false;
      neighbor.walls.bottom = false;
    } else if (dy === -1) {
      current.walls.bottom = false;
      neighbor.walls.top = false;
    }
  };

  // Generate maze using recursive backtracking
  const generateMaze = (maze: Cell[][], stack: Cell[] = []): boolean => {
    if (stack.length === 0) {
      maze[0][0].visited = true;
      stack.push(maze[0][0]);
      return false;
    }

    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, maze);

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      next.visited = true;
      removeWall(current, next);
      stack.push(next);
      return false;
    } else {
      stack.pop();
      return stack.length === 0;
    }
  };

  // Solve maze using A* algorithm (simplified)
  const solveMaze = (maze: Cell[][], current: { x: number; y: number }): boolean => {
    const rows = maze.length;
    const cols = maze[0].length;
    const { x, y } = current;

    if (x === cols - 1 && y === rows - 1) {
      maze[y][x].inPath = true;
      return true;
    }

    maze[y][x].inPath = true;

    // Try to move in each direction
    const directions = [
      { dx: 0, dy: -1, wall: 'top' as keyof Cell['walls'] },
      { dx: 1, dy: 0, wall: 'right' as keyof Cell['walls'] },
      { dx: 0, dy: 1, wall: 'bottom' as keyof Cell['walls'] },
      { dx: -1, dy: 0, wall: 'left' as keyof Cell['walls'] }
    ];

    for (const dir of directions) {
      const newX = x + dir.dx;
      const newY = y + dir.dy;

      if (
        newX >= 0 && newX < cols &&
        newY >= 0 && newY < rows &&
        !maze[y][x].walls[dir.wall] &&
        !maze[newY][newX].inPath
      ) {
        solverPositionRef.current = { x: newX, y: newY };
        return false;
      }
    }

    return false;
  };

  // Draw maze
  const drawMaze = (ctx: CanvasRenderingContext2D, maze: Cell[][], cols: number, rows: number) => {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1;

    const offsetX = (dimensions.width - cols * cellSize) / 2;
    const offsetY = (dimensions.height - rows * cellSize) / 2;

    // Draw walls
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = maze[y][x];
        const pixelX = offsetX + x * cellSize;
        const pixelY = offsetY + y * cellSize;

        ctx.beginPath();
        if (cell.walls.top) {
          ctx.moveTo(pixelX, pixelY);
          ctx.lineTo(pixelX + cellSize, pixelY);
        }
        if (cell.walls.right) {
          ctx.moveTo(pixelX + cellSize, pixelY);
          ctx.lineTo(pixelX + cellSize, pixelY + cellSize);
        }
        if (cell.walls.bottom) {
          ctx.moveTo(pixelX + cellSize, pixelY + cellSize);
          ctx.lineTo(pixelX, pixelY + cellSize);
        }
        if (cell.walls.left) {
          ctx.moveTo(pixelX, pixelY + cellSize);
          ctx.lineTo(pixelX, pixelY);
        }
        ctx.stroke();
      }
    }

    // Draw solution path
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity * 2;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (maze[y][x].inPath) {
          const pixelX = offsetX + x * cellSize + cellSize / 4;
          const pixelY = offsetY + y * cellSize + cellSize / 4;
          ctx.fillRect(pixelX, pixelY, cellSize / 2, cellSize / 2);
        }
      }
    }
  };

  // Animation loop
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = Math.floor(dimensions.width / cellSize);
    const rows = Math.floor(dimensions.height / cellSize);
    
    let maze = initializeMaze(cols, rows);
    let stack: Cell[] = [];
    let isGenerating = true;
    let isSolving = false;
    let isComplete = false;

    mazeRef.current = maze;
    phaseRef.current = 'generating';
    solverPositionRef.current = { x: 0, y: 0 };
    timerRef.current = 0;

    const animate = () => {
      timerRef.current += 16; // Assuming 60fps

      if (timerRef.current >= animationSpeed) {
        timerRef.current = 0;

        if (isGenerating) {
          const generationComplete = generateMaze(maze, stack);
          if (generationComplete) {
            isGenerating = false;
            isSolving = true;
            phaseRef.current = 'solving';
            solverPositionRef.current = { x: 0, y: 0 };
          }
        } else if (isSolving) {
          const solvingComplete = solveMaze(maze, solverPositionRef.current);
          if (solvingComplete) {
            isSolving = false;
            isComplete = true;
            phaseRef.current = 'complete';
            
            // Reset after a delay
            setTimeout(() => {
              maze = initializeMaze(cols, rows);
              stack = [];
              isGenerating = true;
              isComplete = false;
              phaseRef.current = 'generating';
              solverPositionRef.current = { x: 0, y: 0 };
            }, 2000);
          }
        }
      }

      drawMaze(ctx, maze, cols, rows);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, cellSize, animationSpeed, opacity, color]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  );
};

export default AnimatedMazeBackground;