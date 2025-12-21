import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import CustomNode from './CustomNode';
import NodeCreator from './NodeCreator';
import NodeEditor from './NodeEditor';
import HelperLines from './HelperLines';
import { saveProject, loadProject, clearProject, saveTemplates, loadTemplates } from './dataService';
import './App.css';

const nodeTypes = {
  custom: CustomNode,
  input: CustomNode,
  output: CustomNode,
  default: CustomNode,
};

const edgeTypes = {
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const defaultEdgeOptions = {
  type: 'default',
  style: { stroke: '#000', strokeWidth: 10, opacity: 0.5 },
};

const App = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [customTemplates, setCustomTemplates] = useState(() => loadTemplates());
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [allNodesCollapsed, setAllNodesCollapsed] = useState(false);
  const [helperLineHorizontal, setHelperLineHorizontal] = useState(null);
  const [helperLineVertical, setHelperLineVertical] = useState(null);
  const [connectionLineColor, setConnectionLineColor] = useState('#787878');

  const onConnect = useCallback((params) => {
    const isFlowSource = params.sourceHandle?.includes('flow');

    // Find source node to get its color
    const sourceNode = nodes.find(n => n.id === params.source);
    const nodeColor = sourceNode?.data?.phaseColor || '#787878';

    // Use dynamic color only if outgoing from a flow handle
    const edgeColor = isFlowSource ? nodeColor : '#787878';

    const isFlow = isFlowSource || params.targetHandle?.includes('flow');

    const edgeParams = {
      ...params,
      type: 'default',
      animated: isFlow,
      style: {
        stroke: edgeColor,
        strokeWidth: 10,
        strokeDasharray: isFlow ? '15, 15' : 'none'
      },
      data: { isFlow }
    };
    setEdges((eds) => addEdge(edgeParams, eds));
  }, [setEdges, nodes]);

  const onConnectStart = useCallback((_, { nodeId, handleId }) => {
    const isFlowStart = handleId?.includes('flow');

    if (isFlowStart) {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setConnectionLineColor(node.data.phaseColor || '#787878');
        return;
      }
    }

    // Default neutral color for regular handles
    setConnectionLineColor('#787878');
  }, [nodes]);

  const onConnectEnd = useCallback(() => {
    setConnectionLineColor('#787878');
  }, []);

  const onSave = useCallback(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      saveProject(flow);
      alert('Project saved to LocalStorage!');
    }
  }, [reactFlowInstance]);

  const onExport = useCallback(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flow, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "flow-data.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  }, [reactFlowInstance]);

  const onLoad = useCallback(() => {
    const flow = loadProject();
    if (flow) {
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
    }
  }, [setNodes, setEdges]);

  const onClear = useCallback(() => {
    if (window.confirm('Do you really want to clear the entire canvas?')) {
      setNodes([]);
      setEdges([]);
      clearProject();
      setSelectedNodeId(null);
      setActiveTab('library');
    }
  }, [setNodes, setEdges]);

  const onAddTemplate = useCallback((template) => {
    const newTemplates = [...customTemplates, template];
    setCustomTemplates(newTemplates);
    saveTemplates(newTemplates);
    setActiveTab('library');
  }, [customTemplates]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    setActiveTab('edit');
  }, []);

  const onUpdateNode = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance) {
        console.error('React Flow instance not ready for drop');
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');
      const dataStr = event.dataTransfer.getData('application/reactflow-data');
      const elementsStr = event.dataTransfer.getData('application/reactflow-elements');

      console.log('Drop detected:', { type, label, hasData: !!dataStr, hasElements: !!elementsStr });

      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let data = { label };
      if (dataStr) {
        try {
          const parsedData = JSON.parse(dataStr);
          data = { ...data, ...parsedData };
        } catch (e) {
          console.error('Error parsing node data', e);
        }
      } else if (elementsStr) {
        try {
          data.elements = JSON.parse(elementsStr);
        } catch (e) {
          console.error('Error parsing elements data', e);
        }
      }

      const newNode = {
        id: getId(),
        type,
        position,
        data,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeDrag = useCallback(
    (event, node) => {
      const SNAP_THRESHOLD = 15;
      let horizontal = null;
      let vertical = null;

      // Extract current bounds (x, y are top-left)
      const nX = node.position.x;
      const nY = node.position.y;
      const nW = node.width || 0;
      const nH = node.height || 0;
      const nCX = nX + nW / 2;
      const nCY = nY + nH / 2;

      const others = nodes.filter((n) => n.id !== node.id);

      for (const target of others) {
        const tX = target.position.x;
        const tY = target.position.y;
        const tW = target.width || 0;
        const tH = target.height || 0;
        const tCX = tX + tW / 2;
        const tCY = tY + tH / 2;

        // X-Axis Snapping (Vertical Lines)
        // Left to Left
        if (Math.abs(nX - tX) < SNAP_THRESHOLD) { node.position.x = tX; vertical = tX; }
        // Right to Right
        else if (Math.abs((nX + nW) - (tX + tW)) < SNAP_THRESHOLD) { node.position.x = tX + tW - nW; vertical = tX + tW; }
        // Center to Center
        else if (Math.abs(nCX - tCX) < SNAP_THRESHOLD) { node.position.x = tCX - nW / 2; vertical = tCX; }

        // Y-Axis Snapping (Horizontal Lines)
        // Top to Top
        if (Math.abs(nY - tY) < SNAP_THRESHOLD) { node.position.y = tY; horizontal = tY; }
        // Bottom to Bottom
        else if (Math.abs((nY + nH) - (tY + tH)) < SNAP_THRESHOLD) { node.position.y = tY + tH - nH; horizontal = tY + tH; }
        // Center to Center
        else if (Math.abs(nCY - tCY) < SNAP_THRESHOLD) { node.position.y = tCY - nH / 2; horizontal = tCY; }
      }

      // DISTANCE SNAPPING (Equal spacing)
      // If we are moving Node C, find distance between A and B, then check if C's distance to B matches.
      if (others.length >= 2) {
        for (let i = 0; i < others.length; i++) {
          for (let j = 0; j < others.length; j++) {
            if (i === j) continue;
            const nodeA = others[i];
            const nodeB = others[j];

            // horizontal distance
            const distAB = nodeB.position.x - (nodeA.position.x + (nodeA.width || 0));
            if (distAB > 0) {
              const targetX = nodeB.position.x + (nodeB.width || 0) + distAB;
              if (Math.abs(node.position.x - targetX) < SNAP_THRESHOLD) {
                node.position.x = targetX;
                vertical = targetX;
              }
            }

            // vertical distance
            const distV_AB = nodeB.position.y - (nodeA.position.y + (nodeA.height || 0));
            if (distV_AB > 0) {
              const targetY = nodeB.position.y + (nodeB.height || 0) + distV_AB;
              if (Math.abs(node.position.y - targetY) < SNAP_THRESHOLD) {
                node.position.y = targetY;
                horizontal = targetY;
              }
            }
          }
        }
      }

      setHelperLineHorizontal(horizontal);
      setHelperLineVertical(vertical);
    },
    [nodes]
  );

  const onNodeDragStop = useCallback(() => {
    setHelperLineHorizontal(null);
    setHelperLineVertical(null);
  }, []);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const onNodeDoubleClick = useCallback((event, node) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return { ...n, data: { ...n.data, collapsed: !n.data.collapsed } };
        }
        return n;
      })
    );
  }, [setNodes]);

  const onEdgeDoubleClick = useCallback((event, edge) => {
    const newLabel = window.prompt('Enter condition/label for this edge:', edge.label || '');
    if (newLabel !== null) {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === edge.id) {
            return { ...e, label: newLabel, labelStyle: { fill: '#000', fontWeight: 700 } };
          }
          return e;
        })
      );
    }
  }, [setEdges]);

  const connectedHandleIds = useMemo(() => {
    const ids = new Set();
    edges.forEach((edge) => {
      if (edge.sourceHandle) ids.add(`${edge.source}-${edge.sourceHandle}`);
      if (edge.targetHandle) ids.add(`${edge.target}-${edge.targetHandle}`);
    });
    return Array.from(ids);
  }, [edges]);

  const displayNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        connectedHandleIds: connectedHandleIds.filter(id => id.startsWith(`${node.id}-`)).map(id => id.replace(`${node.id}-`, ''))
      }
    }));
  }, [nodes, allNodesCollapsed, connectedHandleIds]);

  const displayEdges = useMemo(() => {
    return edges.map((edge) => {
      const isFlow = edge.data?.isFlow || edge.sourceHandle?.includes('flow') || edge.targetHandle?.includes('flow');

      return {
        ...edge,
        type: 'default', // Force Bezier
        animated: isFlow,
        label: edge.label, // Preserve the actual label
        style: {
          ...edge.style,
          strokeDasharray: isFlow ? '15, 15' : 'none'
        }
      };
    });
  }, [edges]);

  // Sync all nodes when global toggle is clicked
  const toggleAllCollapse = useCallback(() => {
    // If any node is NOT collapsed, then the action should be "Collapse All" (true)
    // If everything is already collapsed, then "Expand All" (false)
    const anyExpanded = nodes.some(n => !n.data.collapsed);
    const nextValue = anyExpanded;

    setAllNodesCollapsed(nextValue);
    setNodes((nds) => nds.map((n) => ({
      ...n,
      data: { ...n.data, collapsed: nextValue }
    })));
  }, [nodes, setNodes]);

  // Tab key shortcut for global collapse toggle
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        event.preventDefault(); // Prevent focus cycling
        toggleAllCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAllCollapse]);

  // Live data structure for the Data tab
  const flowData = reactFlowInstance ? reactFlowInstance.toObject() : { nodes, edges };

  return (
    <div className="dndflow">
      <ReactFlowProvider>
        <div className="sidebar-container">
          <div className="toolbar">
            <button onClick={onSave} title="Save to LocalStorage">💾</button>
            <button onClick={onLoad} title="Load from LocalStorage">📂</button>
            <button onClick={onExport} title="Export as JSON file">📤</button>
            <button
              onClick={toggleAllCollapse}
              title={allNodesCollapsed ? "Expand all nodes" : "Collapse all nodes"}
              className={allNodesCollapsed ? "btn-active" : ""}
            >
              {allNodesCollapsed ? "↕️" : "↕️"}
            </button>
            <button onClick={onClear} title="Clear Canvas" className="btn-clear">🗑️</button>
          </div>

          <div className="sidebar-tabs">
            <button
              className={activeTab === 'library' ? 'active' : ''}
              onClick={() => setActiveTab('library')}
            >Library</button>
            <button
              className={activeTab === 'builder' ? 'active' : ''}
              onClick={() => setActiveTab('builder')}
            >Builder</button>
            <button
              className={activeTab === 'edit' ? 'active' : ''}
              onClick={() => setActiveTab('edit')}
            >Edit</button>
            <button
              className={activeTab === 'data' ? 'active' : ''}
              onClick={() => setActiveTab('data')}
            >Data</button>
          </div>

          <div className="tab-content">
            {activeTab === 'library' && <Sidebar customTemplates={customTemplates} />}
            {activeTab === 'builder' && <NodeCreator onAddTemplate={onAddTemplate} />}
            {activeTab === 'edit' && <NodeEditor selectedNode={selectedNode} onUpdateNode={onUpdateNode} />}
            {activeTab === 'data' && (
              <div className="data-preview">
                <pre>{JSON.stringify(flowData, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
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
            edgeTypes={edgeTypes}
            connectionLineType="smoothstep"
            connectionLineStyle={{
              stroke: connectionLineColor,
              strokeWidth: 10,
            }}
            fitView
            snapToGrid={true}
            snapGrid={[25, 25]}
            zoomOnDoubleClick={false}
          >
            {/* <Background variant="lines" color="#ddd" gap={25} /> */}
            <Controls />
            <HelperLines horizontal={helperLineHorizontal} vertical={helperLineVertical} />
          </ReactFlow>
        </div>
      </ReactFlowProvider >
    </div >
  );
};

export default App;
