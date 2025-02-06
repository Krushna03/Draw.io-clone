import React, { useState } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { CanvasState, Shape } from './types/canvas';

function App() {
  const [state, setState] = useState<CanvasState>({
    shapes: [],
    currentShape: null,
    selectedShape: null,
    scale: 1,
    tool: null,
    viewport: { x: 0, y: 0 },
    isDragging: false,
  });

  const handleCanvasChange = (newState: Partial<CanvasState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const handleToolSelect = (tool: Shape['type'] | null) => {
    setState((prev) => ({
      ...prev,
      tool,
      selectedShape: null,
      shapes: prev.shapes.map(s => ({ ...s, isSelected: false }))
    }));
  };

  const handleZoom = (scale: number) => {
    setState((prev) => ({ ...prev, scale: Math.max(0.1, Math.min(2, scale)) }));
  };

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden">
      <Toolbar
        selectedTool={state.tool}
        onSelectTool={handleToolSelect}
        scale={state.scale}
        onZoom={handleZoom}
      />
      <Canvas state={state} onChange={handleCanvasChange} />
    </div>
  );
}

export default App;