import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import { saveProject, loadProject, clearProject, saveTemplates, loadTemplates } from './dataService';
import './App.css';

const nodeTypes = {
  custom: CustomNode,
  input: CustomNode,
  output: CustomNode,
  default: CustomNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const defaultEdgeOptions = {
  type: 'step',
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

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, type: 'step', style: { stroke: '#000', strokeWidth: 10, opacity: 0.5 } }, eds)), []);

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

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');
      const elementsStr = event.dataTransfer.getData('application/reactflow-elements');
      const elements = elementsStr ? JSON.parse(elementsStr) : [];

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label, elements },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const displayEdges = useMemo(() => {
    if (!allNodesCollapsed) return edges;

    return edges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return edge;

      const sourceDescIndex = sourceNode.data.elements?.findIndex((el) => el.label === 'Description');
      const targetDescIndex = targetNode.data.elements?.findIndex((el) => el.label === 'Description');

      return {
        ...edge,
        sourceHandle: (sourceDescIndex !== undefined && sourceDescIndex !== -1) ? `source-${sourceDescIndex}` : edge.sourceHandle,
        targetHandle: (targetDescIndex !== undefined && targetDescIndex !== -1) ? `target-${targetDescIndex}` : edge.targetHandle,
        type: 'step',
        style: { stroke: '#000', strokeWidth: 10, opacity: 0.5 }
      };
    });
  }, [edges, nodes, allNodesCollapsed]);

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
              onClick={() => setAllNodesCollapsed(!allNodesCollapsed)}
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
            nodes={nodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType="step"
            connectionLineStyle={{ stroke: '#000', strokeWidth: 10, opacity: 0.5 }}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default App;
