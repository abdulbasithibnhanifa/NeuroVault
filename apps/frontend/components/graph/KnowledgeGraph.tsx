import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { logger } from '@neurovault/shared/utils/logger';
import { stringToColor } from '@neurovault/shared/utils/colors';

// Dynamically import the forwardRef-capable wrapper
const ForceGraph2D = dynamic(() => import('./KnowledgeGraphStatic'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface Node {
  id: string;
  label: string;
  type: 'document' | 'tag';
  docType?: string;
  val: number;
  x?: number;
  y?: number;
}

interface Link {
  source: string | { id: string };
  target: string | { id: string };
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

/**
 * KnowledgeGraph - Premium interactive force-directed graph visualization.
 */
export default function KnowledgeGraph() {
  const { resolvedTheme } = useTheme();
  const [data, setData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoverNode, setHoverNode] = useState<Node | null>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const response = await fetch('/api/graph');
        if (!response.ok) throw new Error('Failed to fetch graph data');
        const resData = await response.json();
        setData(resData);
      } catch (err) {
        logger.error('Graph fetch error', { error: err });
      } finally {
        setIsLoading(false);
      }
    };
    fetchGraph();
  }, []);

  const isDarkMode = resolvedTheme === 'dark';

  // Get neighbors for highlighting - MEMOIZED
  const neighbors = useMemo(() => {
    if (!selectedNode || !data) return new Set();
    const neighborSet = new Set();
    data.links.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (sourceId === selectedNode.id) neighborSet.add(targetId);
      if (targetId === selectedNode.id) neighborSet.add(sourceId);
    });
    return neighborSet;
  }, [selectedNode, data]);

  // Optimization: Pre-calculate node colors and label properties to avoid per-frame calculations
  const processedData = useMemo(() => {
    if (!data) return null;
    
    // Create a temporary canvas for text measurements
    if (typeof document === 'undefined') return data;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return data;

    const nodes = data.nodes.map(node => {
      const color = node.type === 'document' 
        ? stringToColor(node.docType || 'pdf', isDarkMode) 
        : (isDarkMode ? '#475569' : '#94a3b8');
        
      ctx.font = `bold 12px Inter, system-ui, sans-serif`;
      const textWidth = ctx.measureText(node.label).width;
      
      return { 
        ...node, 
        __color: color,
        __labelWidth: textWidth,
        __labelHeight: 12
      };
    });

    return { ...data, nodes };
  }, [data, isDarkMode]);

  // Node drawing logic with custom styling - OPTIMIZED
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isFocused = selectedNode?.id === node.id || hoverNode?.id === node.id;
    const isNeighbor = neighbors.has(node.id);
    const shouldShowFull = isFocused || (selectedNode && isNeighbor);
    const isDimmed = selectedNode && !shouldShowFull;

    const baseColor = node.__color;
    const alpha = isDimmed ? 0.08 : 1.0;
    
    // Draw Glow/Outer Circle (Only for focused node to save power)
    if (isFocused) {
      const radius = (node.val / 2) + 6;
      const pulseSpeed = 2000;
      const time = Date.now();
      const pulseBase = Math.sin((time % pulseSpeed) / pulseSpeed * Math.PI * 2) * 0.5 + 0.5;
      const pulseRadius = radius + (pulseBase * 2);

      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI, false);
      ctx.fillStyle = isDarkMode ? `rgba(59, 130, 246, ${0.15 + pulseBase * 0.1})` : `rgba(37, 99, 235, ${0.1 + pulseBase * 0.05})`;
      ctx.fill();
    }

    // Main Node Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val / 2, 0, 2 * Math.PI, false);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = baseColor;
    ctx.fill();
    
    // Glass reflection (Skip if dimmed or small zoom to save performance)
    if (!isDimmed && globalScale > 1.5) {
        ctx.beginPath();
        ctx.arc(node.x - node.val/6, node.y - node.val/6, node.val / 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
    }

    ctx.globalAlpha = 1.0;

    // Show Label only if focused or connected to selected
    if (shouldShowFull || (!selectedNode && node.type === 'document' && globalScale > 1.2)) {
      const label = node.label;
      const fontSize = 11 / globalScale;
      // Use pre-cached width scaled to current font size
      const scaleFactor = fontSize / 12;
      const textWidth = node.__labelWidth * scaleFactor;
      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.5);

      ctx.font = `${isFocused ? 'bold' : '500'} ${fontSize}px Inter, system-ui, sans-serif`;

      // Label background (pill style)
      ctx.fillStyle = isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)';
      const labelY = node.y + (node.val / 2 + 5);
      
      const x = node.x - bckgDimensions[0] / 2;
      const y = labelY - bckgDimensions[1] / 2;
      const w = bckgDimensions[0];
      const h = bckgDimensions[1];
      const r = h/2;

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
      ctx.fill();

      // Label text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isDarkMode ? '#f8fafc' : '#0f172a';
      ctx.fillText(label, node.x, labelY);
    }
  }, [selectedNode, hoverNode, neighbors, isDarkMode]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node.id === selectedNode?.id ? null : node);
    if (graphRef.current) {
        graphRef.current.centerAt(node.x, node.y, 800);
        graphRef.current.zoom(3, 800);
    }
  }, [selectedNode]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 opacity-40">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-blue-600">Neural Network Syncing...</p>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4 opacity-40">
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <h3 className="text-xl font-bold">Neural Vault is Sleeping</h3>
        <p className="max-w-xs text-sm font-medium">Add documents to visualize your neural network.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[70vh] bg-white dark:bg-[#030712] rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden group">
      <div className="absolute top-8 left-8 z-10 space-y-1">
        <h4 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter">NeuroNet</h4>
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Semantic Live Visualization</p>
        </div>
      </div>

      {selectedNode && (
        <button 
            onClick={() => setSelectedNode(null)}
            className="absolute top-8 right-8 z-20 px-5 py-2.5 bg-gray-900 dark:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl hover:bg-gray-800 dark:hover:bg-blue-700 transition-all active:scale-95 border border-white/10"
        >
            Reset Focus
        </button>
      )}

      <ForceGraph2D
        forwardedRef={graphRef}
        graphData={processedData || { nodes: [], links: [] }}
        nodeRelSize={6}
        nodeVal="val"
        nodeCanvasObject={nodeCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeHover={(node: any) => setHoverNode(node as Node | null)}
        linkColor={(link: any) => {
            const sid = typeof link.source === 'object' ? link.source.id : link.source;
            const tid = typeof link.target === 'object' ? link.target.id : link.target;
            const isRelated = selectedNode && (sid === selectedNode.id || tid === selectedNode.id);
            
            if (selectedNode) {
                return isRelated 
                    ? (isDarkMode ? '#3b82f6' : '#2563eb') 
                    : (isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)');
            }
            
            return isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
        }}
        linkWidth={(link: any) => {
            const sid = typeof link.source === 'object' ? link.source.id : link.source;
            const tid = typeof link.target === 'object' ? link.target.id : link.target;
            const isRelated = selectedNode && (sid === selectedNode.id || tid === selectedNode.id);
            return isRelated ? 3 : 1.25;
        }}
        backgroundColor={isDarkMode ? '#030712' : '#ffffff'}
        cooldownTicks={80}
        d3AlphaDecay={0.045}
        d3VelocityDecay={0.4}
      />

      {/* Color Legend */}
      <div className="absolute bottom-8 right-8 z-10 p-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl space-y-3">
        <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Neural Spectrum</h5>
        <div className="space-y-2">
            {[
                { type: 'pdf', color: stringToColor('pdf', isDarkMode), label: 'Research PDF' },
                { type: 'youtube', color: stringToColor('youtube', isDarkMode), label: 'Video Insight' },
                { type: 'note', color: stringToColor('note', isDarkMode), label: 'Personal Note' },
                { type: 'tag', color: isDarkMode ? '#475569' : '#94a3b8', label: 'Topic Tag' }
            ].map((item) => (
                <div key={item.type} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
            ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 px-8 py-3 bg-gray-100/50 dark:bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/5 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
        Spin to Explore • Neural Logic Visualization
      </div>
    </div>
  );
}
