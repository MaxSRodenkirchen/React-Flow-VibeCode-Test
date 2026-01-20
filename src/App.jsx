import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { ReactFlowProvider, useNodesState, useEdgesState, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import CustomNode from './CustomNode';
import HelperLines from './HelperLines';
import { loadTemplates } from './dataService';
import './App.css';

// Hooks
import useSnapping from './hooks/useSnapping';
import useFlowConnections from './hooks/useFlowConnections';
import useFileOperations from './hooks/useFileOperations';

const nodeTypes = {
  custom: CustomNode,
  input: CustomNode,
  output: CustomNode,
  default: CustomNode,
};

const getId = () => `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const App = () => {
  const reactFlowWrapper = useRef(null);
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
    helperLineHorizontal,
    helperLineVertical,
    onNodeDrag,
    onNodeDragStop
  } = useSnapping(nodes);

  const {
    connectionLineColor,
    isFlowConnection,
    onConnect,
    onConnectStart,
    onConnectEnd
  } = useFlowConnections(nodes, setEdges);

  const {
    onSave,
    onExport,
    onLoad,
    onClear,
    onAddTemplate
  } = useFileOperations(reactFlowInstance, setNodes, setEdges, setSelectedNodeId, customTemplates, setCustomTemplates);

  // --- Node Events ---
  const onNodeClick = useCallback((event, node) => setSelectedNodeId(node.id), []);

  const onNodeDoubleClick = useCallback((event, node) => {
    setNodes((nds) =>
      nds.map((n) => n.id === node.id ? {
        ...n,
        data: {
          ...n.data,
          collapseState: n.data.collapseState === 2 ? 0 : (n.data.collapseState || 0) + 1
        }
      } : n)
    );
  }, [setNodes]);

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

  const displayNodes = useMemo(() => nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      connectedHandleIds: connectedHandleIdsPerNode[node.id] || [],
      globalCollapseMode: globalCollapseMode
    }
  })), [nodes, connectedHandleIdsPerNode, globalCollapseMode]);

  const displayEdges = useMemo(() => edges.map((edge) => {
    const isFlow = edge.data?.isFlow || edge.sourceHandle?.includes('flow') || edge.targetHandle?.includes('flow');
    return { ...edge, type: 'step', animated: isFlow, style: { ...edge.style } };
  }), [edges]);

  return (
    <div className="dndflow">
      <ReactFlowProvider>
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
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
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
            <HelperLines horizontal={helperLineHorizontal} vertical={helperLineVertical} />
          </ReactFlow>
        </div>

        {/* Global Floating Toolbar */}
        <div className="global-toolbar">
          <div className="toolbar-inner">
            <button
              className={`toolbar-btn ${globalCollapseMode === 'auto' ? 'active' : ''}`}
              onClick={() => setGlobalCollapseState('auto')}
              title="Automatic Zoom-LOD"
            >
              <span className="btn-icon">gl</span>
              <span className="btn-label">Auto</span>
            </button>
            <button
              className={`toolbar-btn ${globalCollapseMode === 0 ? 'active' : ''}`}
              onClick={() => setGlobalCollapseState(0)}
              title="Force Full View"
            >
              <span className="btn-icon">▣</span>
              <span className="btn-label">Full</span>
            </button>
            <button
              className={`toolbar-btn ${globalCollapseMode === 1 ? 'active' : ''}`}
              onClick={() => setGlobalCollapseState(1)}
              title="Force Connected View"
            >
              <span className="btn-icon">▤</span>
              <span className="btn-label">Conn.</span>
            </button>
            <button
              className={`toolbar-btn ${globalCollapseMode === 2 ? 'active' : ''}`}
              onClick={() => setGlobalCollapseState(2)}
              title="Force Titles View"
            >
              <span className="btn-icon">▬</span>
              <span className="btn-label">Titles</span>
            </button>
          </div>
        </div>
      </ReactFlowProvider >
    </div >
  );
};

export default App;
