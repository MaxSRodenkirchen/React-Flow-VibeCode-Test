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

let id = 0;
const getId = () => `dndnode_${id++}`;

const App = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [customTemplates, setCustomTemplates] = useState(() => loadTemplates());
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [allNodesCollapsed, setAllNodesCollapsed] = useState(false);

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
      nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } } : n)
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

  // --- Global State & Shortcuts ---
  const toggleAllCollapse = useCallback(() => {
    const anyExpanded = nodes.some(n => !n.data.collapsed);
    setAllNodesCollapsed(anyExpanded);
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, collapsed: anyExpanded } })));
  }, [nodes, setNodes]);

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
    data: { ...node.data, connectedHandleIds: connectedHandleIdsPerNode[node.id] || [] }
  })), [nodes, connectedHandleIdsPerNode]);

  const displayEdges = useMemo(() => edges.map((edge) => {
    const isFlow = edge.data?.isFlow || edge.sourceHandle?.includes('flow') || edge.targetHandle?.includes('flow');
    return { ...edge, type: 'default', animated: isFlow, style: { ...edge.style, strokeDasharray: isFlow ? '15, 15' : 'none' } };
  }), [edges]);

  return (
    <div className="dndflow">
      <ReactFlowProvider>
        <div className={`sidebar-container ${sidebarVisible ? '' : 'sidebar-hidden'}`}>
          <Sidebar customTemplates={customTemplates} onSave={onSave} onExport={onExport} onLoad={onLoad} onClear={onClear} />
        </div>

        <button
          className={`sidebar-toggle ${sidebarVisible ? 'sidebar-visible' : 'sidebar-collapsed'}`}
          onClick={toggleSidebar}
          title={sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
        >
          {sidebarVisible ? '‹' : '›'}
        </button>

        <div className={`reactflow-wrapper ${allNodesCollapsed ? 'nodes-collapsed' : ''}`} ref={reactFlowWrapper}>
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
            fitView
            snapToGrid={true}
            snapGrid={[25, 25]}
            zoomOnDoubleClick={false}
          >
            <Controls />
            <HelperLines horizontal={helperLineHorizontal} vertical={helperLineVertical} />
          </ReactFlow>
        </div>
      </ReactFlowProvider >
    </div >
  );
};

export default App;
