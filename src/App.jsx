import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { useNodesState, useEdgesState, Controls, Background, useStore } from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import CustomNode from './CustomNode';
import { loadTemplatesFromServer, loadProjectFromServer, saveProjectToServer } from './dataService';
import './App.css';

// Components
import PatternCreator from './components/PatternCreator';
import Navigation from './components/Navigation';
import ResizableAside from './components/ResizableAside';

// Hooks
import useFlowConnections from './hooks/useFlowConnections';
import useEdgeSnapping from './hooks/useEdgeSnapping';
import FlowEdge from './components/edge/FlowEdge';

const nodeTypes = {
  custom: CustomNode,
  input: CustomNode,
  output: CustomNode,
  default: CustomNode,
};

const edgeTypes = {
  default: FlowEdge,
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

  const handleAddStandalone = useCallback((variant) => {
    if (!reactFlowInstance || !reactFlowWrapper.current) return;

    const wrapperRect = reactFlowWrapper.current.getBoundingClientRect();
    const centerPosition = reactFlowInstance.screenToFlowPosition({
      x: wrapperRect.left + wrapperRect.width / 2,
      y: wrapperRect.top + wrapperRect.height / 2,
    });

    const defaultText = variant === 'title' ? 'New Title' : 'New Text';
    setNodes((nds) => nds.concat({
      id: getId(),
      type: 'custom',
      position: centerPosition,
      data: {
        label: defaultText,
        isStandaloneTitle: variant === 'title',
        isStandaloneText: variant === 'text',
        elements: [
          { type: 'title', content: defaultText }
        ]
      }
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
  }, [setNodes, setEdges, refreshTemplates]);

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

    const isFlow = !isStandalone && (edge.data?.isFlow || edge.sourceHandle?.includes('flow') || edge.targetHandle?.includes('flow'));

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
      type: 'default',
      data: {
        ...edge.data,
        isFlow
      },
      animated: isFlow && isEdgeVisible,
      style: {
        ...edge.style,
        opacity: isEdgeVisible ? (edge.style?.opacity || 0.5) : 0,
        transition: 'opacity 0.1s ease'
      }
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
      <ResizableAside>
        <Navigation activeView={currentView} onViewChange={handleViewChange} />

        <div className={`sidebar-container ${sidebarVisible ? '' : 'sidebar-hidden'}`}>
          <Sidebar
            templates={customTemplates}
            onAddNode={onAddNode}
            allTags={allTags}
          />
        </div>

        <button
          className={`sidebar-toggle ${sidebarVisible ? 'sidebar-visible' : 'sidebar-collapsed'}`}
          onClick={toggleSidebar}
          title={sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
        >
          {sidebarVisible ? '‹' : '›'}
        </button>
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
                <Background variant="dots" gap={200} size={3} color="#000" style={{ opacity: 0.4 }} />
              </ReactFlow>
            </div>

            {/* Global Floating Toolbar - Top Right (View Modes) */}
            <div className="global-toolbar toolbar-top-right">
              <div className="toolbar-inner">
                <button
                  className={`toolbar-btn ${globalCollapseMode === 0 ? 'active' : ''}`}
                  onClick={() => setGlobalCollapseState(0)}
                  title="Expanded View"
                >
                  <span className="btn-icon">Full</span>
                  <span className="btn-label">Expanded</span>
                </button>
                <button
                  className={`toolbar-btn ${globalCollapseMode === 1 ? 'active' : ''}`}
                  onClick={() => setGlobalCollapseState(1)}
                  title="Balanced View"
                >
                  <span className="btn-icon">Balanced</span>
                  <span className="btn-label">Connected</span>
                </button>
                <button
                  className={`toolbar-btn ${globalCollapseMode === 2 ? 'active' : ''}`}
                  onClick={() => setGlobalCollapseState(2)}
                  title="Compressed View"
                >
                  <span className="btn-icon">Min</span>
                  <span className="btn-label">Titles</span>
                </button>
                <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', margin: '4px 2px' }} />
                <button
                  className={`toolbar-btn ${globalCollapseMode === 'auto' ? 'active' : ''}`}
                  onClick={() => setGlobalCollapseState('auto')}
                  title="AI Auto-Zoom"
                >
                  <span className="btn-icon">AI</span>
                  <span className="btn-label">Auto Zoom</span>
                </button>
              </div>
            </div>

            {/* Global Floating Toolbar - Bottom Right (Creation Tools) */}
            <div className="global-toolbar toolbar-bottom-right">
              <div className="toolbar-inner">
                <button
                  className="toolbar-btn"
                  onClick={() => handleAddStandalone('title')}
                  title="Add a heading module"
                >
                  <span className="btn-icon">#</span>
                  <span className="btn-label">Title</span>
                </button>

                <button
                  className="toolbar-btn"
                  onClick={() => handleAddStandalone('text')}
                  title="Add a text module"
                >
                  <span className="btn-icon">Type</span>
                  <span className="btn-label">Text</span>
                </button>
              </div>
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
            <div className="empty-state-message" style={{ opacity: 0.5, position: 'static', transform: 'none', padding: '100px' }}>
              Materialize View<br />
              <span style={{ fontSize: '20px' }}>Evaluation tools coming soon...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
