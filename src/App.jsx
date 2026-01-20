import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { useNodesState, useEdgesState, Controls, Background, useStore } from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import CustomNode from './CustomNode';
import { loadTemplates } from './dataService';
import './App.css';

// Hooks
import useFlowConnections from './hooks/useFlowConnections';
import useFileOperations from './hooks/useFileOperations';
import useEdgeSnapping from './hooks/useEdgeSnapping';

const nodeTypes = {
  custom: CustomNode,
  input: CustomNode,
  output: CustomNode,
  default: CustomNode,
};

const getId = () => `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const zoomSelector = (s) => s.transform[2];

const App = () => {
  const reactFlowWrapper = useRef(null);
  const zoom = useStore(zoomSelector);
  const [nodes, setNodes, onNodesChange] = useNodesState(() => {
    const saved = localStorage.getItem('react-flow-save-state');
    return saved ? JSON.parse(saved).nodes : [];
  });
  const [edges, setEdges, onEdgesChange] = useEdgesState(() => {
    const saved = localStorage.getItem('react-flow-save-state');
    return saved ? JSON.parse(saved).edges : [];
  });
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [customTemplates, setCustomTemplates] = useState(() => loadTemplates());
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  // globalCollapseMode: 'auto', 0, 1, 2
  const [globalCollapseMode, setGlobalCollapseMode] = useState('auto');

  // --- Logic Extraction using Custom Hooks ---

  const {
    connectionLineColor,
    isFlowConnection,
    onConnect,
    onConnectStart,
    onConnectEnd
  } = useFlowConnections(nodes, setEdges);

  const { onNodeDrag } = useEdgeSnapping(nodes, setNodes);

  const {
    onSave,
    onExport,
    onLoad,
    onClear,
    onAddTemplate
  } = useFileOperations(reactFlowInstance, setNodes, setEdges, setSelectedNodeId, customTemplates, setCustomTemplates);

  // --- Node Events ---
  const onNodeClick = useCallback((event, node) => setSelectedNodeId(node.id), []);


  const onEdgeDoubleClick = useCallback((event, edge) => {
    const newLabel = window.prompt('Enter condition/label for this edge:', edge.label || '');
    if (newLabel !== null) {
      setEdges((eds) =>
        eds.map((e) => e.id === edge.id ? { ...e, label: newLabel, labelStyle: { fill: '#000', fontWeight: 700 } } : e)
      );
    }
  }, [setEdges]);

  // --- Drag and Drop Logic ---
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    if (!reactFlowInstance) return;

    const type = event.dataTransfer.getData('application/reactflow');
    const label = event.dataTransfer.getData('application/reactflow-label');
    const dataStr = event.dataTransfer.getData('application/reactflow-data');
    const elementsStr = event.dataTransfer.getData('application/reactflow-elements');

    if (!type) return;

    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    let data = { label };

    try {
      if (dataStr) data = { ...data, ...JSON.parse(dataStr) };
      else if (elementsStr) data.elements = JSON.parse(elementsStr);
    } catch (e) {
      console.error('Error parsing drop data', e);
    }

    setNodes((nds) => nds.concat({ id: getId(), type, position, data }));
  }, [reactFlowInstance, setNodes]);

  const onAddNode = useCallback((node) => {
    if (!reactFlowInstance || !reactFlowWrapper.current) return;

    const wrapperRect = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.screenToFlowPosition({
      x: wrapperRect.left + wrapperRect.width / 2,
      y: wrapperRect.top + wrapperRect.height / 2,
    });

    setNodes((nds) => nds.concat({
      id: getId(),
      type: node.type,
      position,
      data: { ...node.data, label: node.label }
    }));
  }, [reactFlowInstance, setNodes]);

  // --- Global State & Shortcuts ---
  const setGlobalCollapseState = useCallback((state) => {
    setGlobalCollapseMode(state);
  }, []);


  const toggleAllCollapse = useCallback(() => {
    setGlobalCollapseMode((prev) => {
      if (prev === 'auto') return 0;
      return (prev + 1) % 3;
    });
  }, []);

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const state = { nodes, edges };
      localStorage.setItem('react-flow-save-state', JSON.stringify(state));
    }
  }, [nodes, edges]);

  const toggleSidebar = useCallback(() => setSidebarVisible((v) => !v), []);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Tab') { e.preventDefault(); toggleAllCollapse(); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAllCollapse]);

  // --- Data Preparation for Display ---
  const connectedHandleIdsPerNode = useMemo(() => {
    const map = {};
    edges.forEach((edge) => {
      if (edge.sourceHandle) {
        const key = `${edge.source}`;
        if (!map[key]) map[key] = [];
        map[key].push(edge.sourceHandle);
      }
      if (edge.targetHandle) {
        const key = `${edge.target}`;
        if (!map[key]) map[key] = [];
        map[key].push(edge.targetHandle);
      }
    });
    return map;
  }, [edges]);

  const displayNodes = useMemo(() => nodes.map((node) => {
    // Generate a stable random rotation between -0.7 and 0.7 based on node ID
    const seed = node.id.split('_').pop() || '0';
    const rotation = ((parseInt(seed) % 140) - 70) / 100;

    return {
      ...node,
      style: { ...node.style, rotate: `${rotation}deg` },
      data: {
        ...node.data,
        connectedHandleIds: connectedHandleIdsPerNode[node.id] || [],
        globalCollapseMode: globalCollapseMode
      }
    };
  }), [nodes, connectedHandleIdsPerNode, globalCollapseMode]);

  const displayEdges = useMemo(() => edges.map((edge) => {
    const isFlow = edge.data?.isFlow || edge.sourceHandle?.includes('flow') || edge.targetHandle?.includes('flow');

    // Determine effective collapse state for a node
    const getCollapseState = (nodeId) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return 0;

      const localOverride = node.data.collapseState;
      const mode = node.data.globalCollapseMode || globalCollapseMode;

      let zoomLOD = 0;
      if (zoom <= 0.5) zoomLOD = 2;
      else if (zoom <= 0.8) zoomLOD = 1;

      if (localOverride !== undefined) return localOverride;
      if (mode !== 'auto') return mode;
      return zoomLOD;
    };

    const sState = getCollapseState(edge.source);
    const tState = getCollapseState(edge.target);

    // Visible if element index 0 (Title) or if node is expanded/balanced
    const isHandleVisible = (handleId, state) => {
      if (!handleId || state === 0) return true;
      if (state === 2) return /^(source|target)-0(-|$)/.test(handleId);
      return true; // State 1: Connected elements are visible
    };

    const isEdgeVisible = isFlow || (isHandleVisible(edge.sourceHandle, sState) &&
      isHandleVisible(edge.targetHandle, tState));

    return {
      ...edge,
      type: 'step',
      animated: isFlow && isEdgeVisible,
      style: {
        ...edge.style,
        opacity: isEdgeVisible ? (edge.style?.opacity || 0.5) : 0,
        transition: 'opacity 0.1s ease'
      }
    };
  }), [edges, nodes, zoom, globalCollapseMode]);

  return (
    <div className="dndflow">
      <div className={`sidebar-container ${sidebarVisible ? '' : 'sidebar-hidden'}`}>
        <Sidebar
          customTemplates={customTemplates}
          onSave={onSave}
          onExport={onExport}
          onLoad={onLoad}
          onClear={onClear}
          onAddNode={onAddNode}
        />
      </div>

      <button
        className={`sidebar-toggle ${sidebarVisible ? 'sidebar-visible' : 'sidebar-collapsed'}`}
        onClick={toggleSidebar}
        title={sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
      >
        {sidebarVisible ? '‹' : '›'}
      </button>

      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        {nodes.length === 0 && (
          <div className="empty-state-message">
            Start your project by adding a pattern from the library!
          </div>
        )}
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onInit={setReactFlowInstance}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onNodeDrag={onNodeDrag}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          nodeTypes={nodeTypes}
          connectionLineStyle={{
            stroke: connectionLineColor,
            strokeWidth: 10,
            strokeDasharray: isFlowConnection ? '15, 15' : 'none',
          }}
          connectionLineType="step"
          fitView
          elevateNodesOnSelect={true}
          minZoom={0.1}
          maxZoom={4}
          snapToGrid={true}
          snapGrid={[100, 100]}
          zoomOnDoubleClick={false}
        >
          <Controls />
          <Background variant="dots" gap={100} size={3} color="#000" style={{ opacity: 0.4 }} />
        </ReactFlow>
      </div>

      {/* Global Floating Toolbar */}
      <div className="global-toolbar">
        <div className="toolbar-inner">
          <button
            className={`toolbar-btn ${globalCollapseMode === 0 ? 'active' : ''}`}
            onClick={() => setGlobalCollapseState(0)}
          >
            <span className="btn-icon">Full</span>
            <span className="btn-label">Expanded</span>
          </button>
          <button
            className={`toolbar-btn ${globalCollapseMode === 1 ? 'active' : ''}`}
            onClick={() => setGlobalCollapseState(1)}
          >
            <span className="btn-icon">Balanced</span>
            <span className="btn-label">Connected</span>
          </button>
          <button
            className={`toolbar-btn ${globalCollapseMode === 2 ? 'active' : ''}`}
            onClick={() => setGlobalCollapseState(2)}
          >
            <span className="btn-icon">Min</span>
            <span className="btn-label">Titles</span>
          </button>
          <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', margin: '4px 2px' }} />
          <button
            className={`toolbar-btn ${globalCollapseMode === 'auto' ? 'active' : ''}`}
            onClick={() => setGlobalCollapseState('auto')}
          >
            <span className="btn-icon">AI</span>
            <span className="btn-label">Auto Zoom</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
