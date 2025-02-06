import React, { useEffect, useRef, useState } from 'react';
import { CanvasState, Point, Shape } from '../types/canvas';

type CanvasProps = {
  state: CanvasState;
  onChange: (state: Partial<CanvasState>) => void;
};

export function Canvas({ state, onChange }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [lastMousePos, setLastMousePos] = useState<Point | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply viewport transform
    ctx.translate(-state.viewport.x * state.scale, -state.viewport.y * state.scale);
    ctx.scale(state.scale, state.scale);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw all shapes
    state.shapes.forEach((shape) => {
      drawShape(ctx, shape);
      if (shape.isSelected) {
        drawSelectionBox(ctx, shape);
      }
    });

    // Draw current shape if any
    if (state.currentShape) {
      drawShape(ctx, state.currentShape, true);
    }

    ctx.restore();
  }, [state]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 50;
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;

    const startX = Math.floor(state.viewport.x / gridSize) * gridSize;
    const startY = Math.floor(state.viewport.y / gridSize) * gridSize;
    const endX = startX + width / state.scale + gridSize;
    const endY = startY + height / state.scale + gridSize;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  const drawSelectionBox = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    const bounds = getShapeBounds(shape);
    
    // Draw selection rectangle
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      bounds.x - 5,
      bounds.y - 5,
      bounds.width + 10,
      bounds.height + 10
    );
    ctx.setLineDash([]);

    // Draw delete button
    if (!shape.isEditing) {
      ctx.fillStyle = '#ff4444';
      const deleteButtonSize = 20;
      const buttonX = bounds.x + bounds.width + 5;
      const buttonY = bounds.y - 5;
      
      // Delete button background
      ctx.beginPath();
      ctx.roundRect(buttonX, buttonY, deleteButtonSize, deleteButtonSize, 4);
      ctx.fill();
      
      // Delete X symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('×', buttonX + deleteButtonSize/2, buttonY + deleteButtonSize/2);
    }
  };

  const getShapeBounds = (shape: Shape) => {
    switch (shape.type) {
      case 'text':
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return { x: 0, y: 0, width: 0, height: 0 };
        ctx.font = '16px Arial';
        const metrics = ctx.measureText(shape.text || '');
        return {
          x: shape.startPoint.x,
          y: shape.startPoint.y,
          width: metrics.width,
          height: 20
        };
      default:
        const width = shape.endPoint.x - shape.startPoint.x;
        const height = shape.type === 'square' 
          ? Math.sign(width) * Math.abs(width)
          : shape.endPoint.y - shape.startPoint.y;
        return {
          x: Math.min(shape.startPoint.x, shape.endPoint.x),
          y: Math.min(shape.startPoint.y, shape.endPoint.y),
          width: Math.abs(width),
          height: Math.abs(height)
        };
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape, isDrawing = false) => {
    ctx.beginPath();
    ctx.strokeStyle = isDrawing ? '#0066ff' : '#000000';
    ctx.lineWidth = 2;

    switch (shape.type) {
      case 'rectangle':
      case 'square':
        const width = shape.endPoint.x - shape.startPoint.x;
        const height = shape.type === 'square' 
          ? Math.sign(width) * Math.abs(width)
          : shape.endPoint.y - shape.startPoint.y;
        ctx.rect(
          Math.min(shape.startPoint.x, shape.endPoint.x),
          Math.min(shape.startPoint.y, shape.endPoint.y),
          Math.abs(width),
          Math.abs(height)
        );
        break;
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(shape.endPoint.x - shape.startPoint.x, 2) +
          Math.pow(shape.endPoint.y - shape.startPoint.y, 2)
        );
        ctx.arc(
          shape.startPoint.x,
          shape.startPoint.y,
          radius,
          0,
          2 * Math.PI
        );
        break;
      case 'arrow':
        ctx.moveTo(shape.startPoint.x, shape.startPoint.y);
        ctx.lineTo(shape.endPoint.x, shape.endPoint.y);
        const angle = Math.atan2(
          shape.endPoint.y - shape.startPoint.y,
          shape.endPoint.x - shape.startPoint.x
        );
        const headLength = 20;
        ctx.lineTo(
          shape.endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
          shape.endPoint.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(shape.endPoint.x, shape.endPoint.y);
        ctx.lineTo(
          shape.endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
          shape.endPoint.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        break;
      case 'text':
        if (shape?.isEditing) return;
        if (shape?.text) {
          ctx.font = '16px Arial';
          ctx.fillStyle = isDrawing ? '#0066ff' : '#000000';
          ctx.textBaseline = 'top';
          ctx.fillText(shape.text, shape.startPoint.x, shape.startPoint.y);
          if (shape.isSelected && !shape.isEditing) {
            const metrics = ctx.measureText(shape.text);
            ctx.strokeStyle = '#0066ff';
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.moveTo(shape.startPoint.x, shape.startPoint.y + 18);
            ctx.lineTo(shape.startPoint.x + metrics.width, shape.startPoint.y + 18);
            ctx.stroke();
          }
        }
        break;
    }
    
    if (shape.type !== 'text') {
      ctx.stroke();
    }
  };

  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / state.scale + state.viewport.x,
      y: (e.clientY - rect.top) / state.scale + state.viewport.y
    };
  };

  const isPointInShape = (point: Point, shape: Shape): boolean => {
    const bounds = getShapeBounds(shape);
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  };

  const isPointInDeleteButton = (point: Point, shape: Shape): boolean => {
    const bounds = getShapeBounds(shape);
    const buttonX = bounds.x + bounds.width + 5;
    const buttonY = bounds.y - 5;
    const buttonSize = 20;
    
    return (
      point.x >= buttonX &&
      point.x <= buttonX + buttonSize &&
      point.y >= buttonY &&
      point.y <= buttonY + buttonSize
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    setLastMousePos(point);

    if (state.tool === 'text') {
      const newShape: Shape = {
        id: Date.now().toString(),
        type: 'text',
        startPoint: point,
        endPoint: point,
        isSelected: true,
        text: '',
        isEditing: true
      };

      onChange({
        shapes: [...state.shapes.map(s => ({ ...s, isSelected: false, isEditing: false })), newShape],
        selectedShape: newShape,
        tool: null
      });
      return;
    }

    if (!state.tool) {
      // Check if clicking on delete button of selected shape
      if (state.selectedShape && isPointInDeleteButton(point, state.selectedShape)) {
        onChange({
          shapes: state.shapes.filter(s => s.id !== state?.selectedShape?.id),
          selectedShape: null
        });
        return;
      }

      // Check if clicking on a shape
      const clickedShape = [...state.shapes].reverse().find(shape => 
        isPointInShape(point, shape)
      );

      if (clickedShape) {
        // Select shape
        onChange({
          selectedShape: clickedShape,
          shapes: state.shapes.map(s => ({
            ...s,
            isSelected: s.id === clickedShape.id
          }))
        });
        setIsDrawing(true);
        return;
      }

      // Deselect if clicking outside
      if (state.selectedShape) {
        onChange({
          selectedShape: null,
          shapes: state.shapes.map(s => ({ ...s, isSelected: false }))
        });
      }

      // Start panning
      onChange({ isDragging: true });
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);

    const newShape: Shape = {
      id: Date.now().toString(),
      type: state.tool,
      startPoint: point,
      endPoint: point,
      isSelected: false
    };

    onChange({ currentShape: newShape });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    if (state.isDragging && lastMousePos) {
      // Pan the canvas
      const dx = (point.x - lastMousePos.x);
      const dy = (point.y - lastMousePos.y);
      onChange({
        viewport: {
          x: state.viewport.x - dx,
          y: state.viewport.y - dy
        }
      });
      setLastMousePos(point);
      return;
    }

    if (!isDrawing) return;

    if (state.selectedShape && !state.currentShape) {
      // Move selected shape
      const dx = point.x - (lastMousePos?.x || point.x);
      const dy = point.y - (lastMousePos?.y || point.y);
      
      onChange({
        shapes: state.shapes.map(shape =>
          shape.id === state.selectedShape?.id
            ? {
                ...shape,
                startPoint: {
                  x: shape.startPoint.x + dx,
                  y: shape.startPoint.y + dy
                },
                endPoint: {
                  x: shape.endPoint.x + dx,
                  y: shape.endPoint.y + dy
                }
              }
            : shape
        )
      });
      setLastMousePos(point);
      return;
    }

    if (state.currentShape) {
      onChange({
        currentShape: {
          ...state.currentShape,
          endPoint: point
        }
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing && !state.isDragging) return;

    setIsDrawing(false);
    setStartPoint(null);
    setLastMousePos(null);

    if (state.currentShape) {
      onChange({
        shapes: [...state.shapes, state.currentShape],
        currentShape: null,
        tool: null
      });
    }

    onChange({ isDragging: false });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    const clickedShape = [...state.shapes].reverse().find(shape => 
      shape.type === 'text' && isPointInShape(point, shape)
    );

    if (clickedShape) {
      onChange({
        selectedShape: clickedShape,
        shapes: state.shapes.map(s => ({
          ...s,
          isSelected: s.id === clickedShape.id,
          isEditing: s.id === clickedShape.id
        }))
      });
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      {state.shapes.map(shape => 
        shape.isEditing && (
          <div
            key={shape.id}
            style={{
              position: 'absolute',
              left: `${(shape.startPoint.x - state.viewport.x) * state.scale}px`,
              top: `${(shape.startPoint.y - state.viewport.y) * state.scale}px`,
              transform: `scale(${state.scale})`
            }}
          >
            <input
              autoFocus
              type="text"
              value={shape.text || ''}
              onChange={(e) => {
                onChange({
                  shapes: state.shapes.map(s =>
                    s.id === shape.id
                      ? { ...s, text: e.target.value }
                      : s
                  )
                });
              }}
              onBlur={() => {
                onChange({
                  shapes: state.shapes.map(s =>
                    s.id === shape.id
                      ? { 
                          ...s, 
                          isEditing: false,
                          isSelected: false,
                          text: s.text?.trim() || '' 
                        }
                      : s
                  ).filter(s => s.type !== 'text' || s.text),
                  selectedShape: null
                });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="bg-white border border-blue-500 px-2 py-1 outline-none min-w-[100px]"
            />
          </div>
        )
      )}
    </>
  );
}