export type Point = {
  x: number;
  y: number;
};

export type ViewPort = {
  x: number;
  y: number;
};

export type Shape = {
  id: string;
  type: 'rectangle' | 'square' | 'circle' | 'text' | 'arrow';
  startPoint: Point;
  endPoint: Point;
  text?: string;
  isSelected: boolean;
  isEditing?: boolean;
};

export type CanvasState = {
  shapes: Shape[];
  currentShape: Shape | null;
  selectedShape: Shape | null;
  scale: number;
  tool: Shape['type'] | null;
  viewport: ViewPort;
  isDragging: boolean;
};