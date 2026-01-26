import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { useNodesState, useEdgesState, Controls, Background, useStore } from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import CustomNode from './CustomNode';
import ColorNode from './components/node/ColorNode';
import { loadTemplatesFromServer, loadProjectFromServer, saveProjectToServer } from './dataService';
import './App.css';

// Components
import PatternCreator from './components/PatternCreator';
import Navigation from './components/Navigation';
import ResizableAside from './components/ResizableAside';
import CanvasToolbar from './components/CanvasToolbar';
import MaterializeView from './components/MaterializeView';

// Assets
import ivcoLogo from './assets/IVCO_logo.png';

// Hooks
import useFlowConnections from './hooks/useFlowConnections';
import useEdgeSnapping from './hooks/useEdgeSnapping';
import FlowEdge from './components/edge/FlowEdge';

const nodeTypes = {
  custom: CustomNode,
  input: CustomNode,
  output: CustomNode,
  default: CustomNode,
  color: ColorNode,
};

const edgeTypes = {
  default: FlowEdge,
  custom: FlowEdge,
  step: FlowEdge,
};

const getId = () => `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const zoomSelector = (s) => s.transform[2];

const App = () => {
  const reactFlowWrapper = useRef(null);
  const zoom = useStore(zoomSelector);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  // globalCollapseMode: 'auto', 0, 1, 2
  const [globalCollapseMode, setGlobalCollapseMode] = useState('auto');
  const [currentView, setCurrentView] = useState('explore');
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [hasUnsavedPatternChanges, setHasUnsavedPatternChanges] = useState(false);
  const [patternSaveFunction, setPatternSaveFunction] = useState(null);

  if (hasUnsavedPatternChanges) {
    console.log('App: Rendering with hasUnsavedPatternChanges = true');
  }

  // --- Logic Extraction using Custom Hooks ---

  const {
    connectionLineColor,
    isFlowConnection,
    onConnect,
    onConnectStart,
    onConnectEnd
  } = useFlowConnections(nodes, setEdges);

  const { onNodeDrag } = useEdgeSnapping(nodes, setNodes);


  // --- Node Events ---
  const onNodeClick = useCallback((event, node) => setSelectedNodeId(node.id), []);

  const onNodeDoubleClick = useCallback((event, node) => {
    const isStandalone = node.data?.isStandaloneTitle || node.data?.isStandaloneText;
    if (isStandalone) {
      const currentLabel = node.data.label || '';
      const newText = window.prompt('Edit Content:', currentLabel);
      if (newText !== null && newText.trim() !== '') {
        setNodes((nds) => nds.map((n) => {
          if (n.id === node.id) {
            return {
              ...n,
              data: {
                ...n.data,
                label: newText,
                elements: (n.data.elements || []).map(el =>
                  el.type === 'title' ? { ...el, content: newText } : el
                )
              }
            };
          }
          return n;
        }));
      }
    }
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

  const onAddNode = useCallback(async (node) => {
    // If we are in 'define' view, clicking a node means we want to edit it
    if (currentView === 'define') {
      console.log('App: onAddNode called in define view. hasUnsavedPatternChanges:', hasUnsavedPatternChanges);

      // Check for unsaved changes before switching
      if (hasUnsavedPatternChanges) {
        const userChoice = window.confirm(
          'You have unsaved changes. Do you want to save them before switching patterns?\n\n' +
          'Click OK to save and continue, or Cancel to discard changes.'
        );

        if (userChoice && patternSaveFunction) {
          // User wants to save
          await patternSaveFunction();
        }
        // If user clicks Cancel, we proceed to switch without saving
      }

      setSelectedTemplate(node);
      return;
    }

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
  }, [reactFlowInstance, setNodes, currentView, hasUnsavedPatternChanges, patternSaveFunction]);

  const handleAddStandalone = useCallback((type) => {
    if (!reactFlowInstance || !reactFlowWrapper.current) return;

    const wrapperRect = reactFlowWrapper.current.getBoundingClientRect();
    const centerPosition = reactFlowInstance.screenToFlowPosition({
      x: wrapperRect.left + wrapperRect.width / 2,
      y: wrapperRect.top + wrapperRect.height / 2,
    });

    if (type === 'surface') {
      const newNode = {
        id: getId(),
        type: 'color',
        position: {
          x: Math.round(centerPosition.x / 100) * 100,
          y: Math.round(centerPosition.y / 100) * 100
        },
        data: { label: 'ADD TEXT', color: 'var(--bg2)' },
        style: { width: 400, height: 400 },
      };
      setNodes((nds) => nds.concat(newNode));
      return;
    }

    const newNode = {
      id: getId(),
      type: 'custom',
      position: centerPosition,
      data: {
        label: type === 'title' ? 'NEW TITLE' : 'NEW TEXT',
        isStandaloneTitle: type === 'title',
        isStandaloneText: type === 'text',
        elements: [{
          type: type,
          content: type === 'title' ? 'NEW TITLE' : 'NEW TEXT'
        }]
      }
    };
    setNodes((nds) => nds.concat(newNode));
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

  const refreshTemplates = useCallback(async () => {
    const templates = await loadTemplatesFromServer();
    console.log('App: Refreshing templates and syncing canvas nodes:', templates);
    setCustomTemplates(templates);

    // Sync existing nodes on the canvas with the updated template data
    setNodes((nds) => nds.map((node) => {
      // Find the template that matches this node's label
      const template = templates.find(t => t.label === (node.data?.label || node.label));

      if (template) {
        console.log(`App: Syncing node "${node.id}" (${node.data?.label}) with new template data`);
        // Return a new node object with updated data while preserving position and id
        return {
          ...node,
          data: {
            ...template.data,
            label: template.label // Ensure label stays consistent
          }
        };
      }
      return node;
    }));
  }, [setNodes]);

  const handleUnsavedChanges = useCallback((hasChanges, saveFunc) => {
    console.log('App: handleUnsavedChanges called. hasChanges:', hasChanges);
    setHasUnsavedPatternChanges(hasChanges);
    setPatternSaveFunction(() => saveFunc);
  }, []);

  // Initial Load from Server
  useEffect(() => {
    const initLoad = async () => {
      console.log('App: Start initial load from server...');

      // Load Project
      const flow = await loadProjectFromServer();
      console.log('App: Received flow from server:', flow);
      if (flow) {
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
      }

      // Load Templates
      await refreshTemplates();

      setIsInitialized(true);
    };
    initLoad();
  }, []); // Empty dependencies - only run on mount

  // Auto-Save to Server
  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => {
        console.log('Autosave: Saving to server...', { nodes: nodes.length, edges: edges.length });
        saveProjectToServer({ nodes, edges });
      }, 1000); // 1s Debounce
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, isInitialized]);

  const toggleSidebar = useCallback(() => setSidebarVisible((v) => !v), []);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Tab') { e.preventDefault(); toggleAllCollapse(); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAllCollapse]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedPatternChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedPatternChanges]);

  // Warn before switching views with unsaved changes
  const handleViewChange = useCallback(async (newView) => {
    console.log('App: handleViewChange called to:', newView, 'hasUnsavedPatternChanges:', hasUnsavedPatternChanges);
    if (currentView === 'define' && hasUnsavedPatternChanges) {
      console.log('App: Showing view change confirmation');
      const userChoice = window.confirm(
        'You have unsaved changes in the pattern editor. Do you want to save them before switching views?\n\n' +
        'Click OK to save and continue, or Cancel to discard changes.'
      );

      if (userChoice && patternSaveFunction) {
        console.log('App: User chose to save before view change');
        await patternSaveFunction();
      }
    }
    setCurrentView(newView);
  }, [currentView, hasUnsavedPatternChanges, patternSaveFunction]);

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
    return {
      ...node,
      data: {
        ...node.data,
        connectedHandleIds: connectedHandleIdsPerNode[node.id] || [],
        globalCollapseMode: globalCollapseMode
      }
    };
  }), [nodes, connectedHandleIdsPerNode, globalCollapseMode]);

  const displayEdges = useMemo(() => edges.map((edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    const isStandalone = sourceNode?.data?.isStandaloneTitle || sourceNode?.data?.isStandaloneText ||
      targetNode?.data?.isStandaloneTitle || targetNode?.data?.isStandaloneText;

    const checkIsTitleHandle = (node, handleId) => {
      if (!node || !handleId) return false;
      const match = handleId.match(/^(source|target)-(\d+)/);
      if (!match) return false;
      const elementIndex = parseInt(match[2]);
      return node.data?.elements?.[elementIndex]?.type === 'title';
    };

    const isFlow = (
      edge.data?.isFlow ||
      edge.sourceHandle?.includes('flow') ||
      edge.targetHandle?.includes('flow') ||
      checkIsTitleHandle(sourceNode, edge.sourceHandle) ||
      checkIsTitleHandle(targetNode, edge.targetHandle)
    );

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

    // Visible if element is a Title or if node is expanded/balanced
    const isHandleVisible = (nodeId, handleId, state) => {
      if (!handleId || state === 0) return true;
      if (handleId.includes('flow')) return true;

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return true;

      const match = handleId.match(/^(source|target)-(\d+)/);
      if (!match) return true;

      const elementIndex = parseInt(match[2]);
      const elements = node.data.elements || [];
      const element = elements[elementIndex];

      if (state === 2) {
        // Mode 2: Titles only. Only show handles on title elements.
        return element?.type === 'title';
      }

      // Mode 1: Balanced. Standard handles are shown if they are connected.
      // Since this is an existing edge, this handle is connected.
      return true;
    };

    const isEdgeVisible = (
      isHandleVisible(edge.source, edge.sourceHandle, sState) &&
      isHandleVisible(edge.target, edge.targetHandle, tState)
    );

    return {
      ...edge,
      type: 'custom',
      hidden: !isEdgeVisible,
      data: {
        ...edge.data,
        isFlow
      },
      animated: isFlow && isEdgeVisible
    };
  }), [edges, nodes, zoom, globalCollapseMode]);

  const allTags = useMemo(() => {
    const tags = new Set();
    customTemplates.forEach(template => {
      if (template.data?.tags) {
        template.data.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [customTemplates]);

  return (
    <div className="dndflow">
      <ResizableAside isCollapsed={!uiVisible || !sidebarVisible}>
        <Navigation activeView={currentView} onViewChange={handleViewChange} />

        <div className={`sidebar-container`}>
          <Sidebar
            templates={customTemplates}
            onAddNode={onAddNode}
            allTags={allTags}
          />
        </div>
      </ResizableAside>

      <main className="layout-main">
        {currentView === 'explore' && (
          <div className="whiteboard-view">
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
                onNodeDoubleClick={onNodeDoubleClick}
                onInit={setReactFlowInstance}
                onEdgeDoubleClick={onEdgeDoubleClick}
                onNodeDrag={onNodeDrag}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineStyle={{
                  stroke: connectionLineColor,
                  strokeWidth: 10,
                  strokeDasharray: isFlowConnection ? '15, 15' : 'none',
                }}
                connectionLineType="default"
                fitView
                elevateNodesOnSelect={true}
                minZoom={0.1}
                maxZoom={4}
                snapToGrid={true}
                snapGrid={[200, 200]}
                zoomOnDoubleClick={false}
              >
                <Controls />
                <Background variant="lines" gap={200} size={1} color="#b0bea9" style={{ opacity: 0.2 }} />
              </ReactFlow>
            </div>

            <div className="canvas-footer">
              <button
                className={`ui-toggle-btn ${!uiVisible ? 'ui-hidden' : ''}`}
                onClick={() => setUiVisible(!uiVisible)}
                title={uiVisible ? "Focus Mode (Hide UI)" : "Standard Mode (Show UI)"}
              >
                <div className="icon-square-outline"></div>
              </button>

              {uiVisible && (
                <CanvasToolbar
                  collapseMode={globalCollapseMode}
                  onCollapseModeChange={setGlobalCollapseState}
                  onAddStandalone={handleAddStandalone}
                />
              )}
            </div>
          </div>
        )}

        {currentView === 'define' && (
          <div className="view-container define-view">
            <PatternCreator
              initialPattern={selectedTemplate}
              onSaveSuccess={refreshTemplates}
              globalTags={allTags}
              onUnsavedChangesChange={handleUnsavedChanges}
            />
          </div>
        )}

        {currentView === 'materialize' && (
          <div className="view-container materialize-view">
            <MaterializeView />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
