import { Square, Circle, Type, ArrowRight, MousePointer } from 'lucide-react';
import { Shape } from '../types/canvas';

type ToolbarProps = {
  selectedTool: Shape['type'] | null;
  onSelectTool: (tool: Shape['type'] | null) => void;
  scale: number;
  onZoom: (scale: number) => void;
};

export function Toolbar({ selectedTool, onSelectTool, scale, onZoom }: ToolbarProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
      <button
        onClick={() => onSelectTool(null)}
        className={`p-2 rounded ${selectedTool === null ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
      >
        <MousePointer className="w-5 h-5" />
      </button>
      <button
        onClick={() => onSelectTool('square')}
        className={`p-2 rounded ${selectedTool === 'square' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
      >
        <Square className="w-5 h-5" />
      </button>
      <button
        onClick={() => onSelectTool('circle')}
        className={`p-2 rounded ${selectedTool === 'circle' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
      >
        <Circle className="w-5 h-5" />
      </button>
      <button
        onClick={() => onSelectTool('text')}
        className={`p-2 rounded ${selectedTool === 'text' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
      >
        <Type className="w-5 h-5" />
      </button>
      <button
        onClick={() => onSelectTool('arrow')}
        className={`p-2 rounded ${selectedTool === 'arrow' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
      >
        <ArrowRight className="w-5 h-5" />
      </button>
      <div className="h-6 w-px bg-gray-300 mx-2" />
      <div className="flex items-center gap-2">
        <button
          onClick={() => onZoom(scale - 0.1)}
          className="p-2 rounded hover:bg-gray-100"
        >
          -
        </button>
        <span className="min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => onZoom(scale + 0.1)}
          className="p-2 rounded hover:bg-gray-100"
        >
          +
        </button>
      </div>
    </div>
  );
}