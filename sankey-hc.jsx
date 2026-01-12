import React, { useState, useMemo } from 'react';

// H&C Color Palette
const HC_COLORS = {
  darkBlue: '#14324E',
  coralRed: '#E94D3A',
  white: '#FFFFFF',
  lightGray: '#F0F0F0',
  accent3: '#C2C2C2',
  accent4: '#A4A3A7',
  accent5: '#87878B',
  accent6: '#5B5D64',
  black: '#000000',
};

// Flow colors - using H&C palette with variations
const flowColors = [
  '#14324E', // Dark Blue
  '#E94D3A', // Coral Red
  '#5B5D64', // Accent 6
  '#87878B', // Accent 5
  '#A4A3A7', // Accent 4
  '#C2C2C2', // Accent 3
  '#1a4d73', // Lighter blue
  '#f07563', // Lighter coral
];

function computeSankey(nodes, links, width, height) {
  if (nodes.length === 0) return { nodes: [], links: [] };
  
  const nodeWidth = 18;
  const nodePadding = 28;
  
  const nodeMap = new Map();
  nodes.forEach((n, i) => {
    nodeMap.set(n.id, {
      ...n,
      index: i,
      sourceLinks: [],
      targetLinks: [],
      value: 0,
      depth: 0,
      y0: 0,
      y1: 0,
      x0: 0,
      x1: 0
    });
  });
  
  const sankeyLinks = [];
  links.forEach(l => {
    const source = nodeMap.get(l.source);
    const target = nodeMap.get(l.target);
    if (source && target && source !== target) {
      const link = {
        source,
        target,
        value: l.value,
        sy0: 0, sy1: 0,
        ty0: 0, ty1: 0
      };
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
      sankeyLinks.push(link);
    }
  });
  
  const nodeArray = Array.from(nodeMap.values());
  nodeArray.forEach(node => {
    const outSum = node.sourceLinks.reduce((s, l) => s + l.value, 0);
    const inSum = node.targetLinks.reduce((s, l) => s + l.value, 0);
    node.value = Math.max(outSum, inSum, 1);
  });
  
  const assigned = new Set();
  let currentDepth = 0;
  let currentNodes = nodeArray.filter(n => n.targetLinks.length === 0);
  
  if (currentNodes.length === 0) currentNodes = [nodeArray[0]];
  
  while (assigned.size < nodeArray.length) {
    currentNodes.forEach(n => {
      if (!assigned.has(n)) {
        n.depth = currentDepth;
        assigned.add(n);
      }
    });
    
    const nextNodes = [];
    currentNodes.forEach(n => {
      n.sourceLinks.forEach(l => {
        if (!assigned.has(l.target)) {
          nextNodes.push(l.target);
        }
      });
    });
    
    if (nextNodes.length === 0) {
      nodeArray.forEach(n => {
        if (!assigned.has(n)) {
          n.depth = currentDepth + 1;
          assigned.add(n);
        }
      });
      break;
    }
    
    currentNodes = nextNodes;
    currentDepth++;
  }
  
  const maxDepth = Math.max(...nodeArray.map(n => n.depth));
  
  const xScale = maxDepth > 0 ? (width - nodeWidth) / maxDepth : 0;
  nodeArray.forEach(n => {
    n.x0 = n.depth * xScale;
    n.x1 = n.x0 + nodeWidth;
  });
  
  const depthGroups = {};
  nodeArray.forEach(n => {
    if (!depthGroups[n.depth]) depthGroups[n.depth] = [];
    depthGroups[n.depth].push(n);
  });
  
  Object.values(depthGroups).forEach(group => {
    const totalValue = group.reduce((s, n) => s + n.value, 0);
    const totalPadding = (group.length - 1) * nodePadding;
    const availableHeight = height - totalPadding;
    const scale = availableHeight / totalValue;
    
    let y = 0;
    group.forEach(node => {
      node.y0 = y;
      node.y1 = y + node.value * scale;
      y = node.y1 + nodePadding;
    });
  });
  
  nodeArray.forEach(node => {
    node.sourceLinks.sort((a, b) => a.target.y0 - b.target.y0);
    node.targetLinks.sort((a, b) => a.source.y0 - b.source.y0);
  });
  
  nodeArray.forEach(node => {
    const nodeHeight = node.y1 - node.y0;
    
    if (node.sourceLinks.length > 0) {
      const totalOut = node.sourceLinks.reduce((s, l) => s + l.value, 0);
      let y = node.y0;
      node.sourceLinks.forEach(link => {
        link.sy0 = y;
        link.sy1 = y + (link.value / totalOut) * nodeHeight;
        y = link.sy1;
      });
    }
    
    if (node.targetLinks.length > 0) {
      const totalIn = node.targetLinks.reduce((s, l) => s + l.value, 0);
      let y = node.y0;
      node.targetLinks.forEach(link => {
        link.ty0 = y;
        link.ty1 = y + (link.value / totalIn) * nodeHeight;
        y = link.ty1;
      });
    }
  });
  
  return { nodes: nodeArray, links: sankeyLinks };
}

function generateLinkPath(link) {
  const x0 = link.source.x1;
  const x1 = link.target.x0;
  const midX = (x0 + x1) / 2;
  
  const sy0 = link.sy0;
  const sy1 = link.sy1;
  const ty0 = link.ty0;
  const ty1 = link.ty1;
  
  return `
    M ${x0} ${sy0}
    C ${midX} ${sy0}, ${midX} ${ty0}, ${x1} ${ty0}
    L ${x1} ${ty1}
    C ${midX} ${ty1}, ${midX} ${sy1}, ${x0} ${sy1}
    Z
  `;
}

export default function SankeyMaker() {
  const [nodes, setNodes] = useState([
    { id: 'Budget', label: 'Budget', color: flowColors[0] },
    { id: 'Marketing', label: 'Marketing', color: flowColors[1] },
    { id: 'Development', label: 'Development', color: flowColors[2] },
    { id: 'Operations', label: 'Operations', color: flowColors[3] },
    { id: 'Digital Ads', label: 'Digital Ads', color: flowColors[4] },
    { id: 'Content', label: 'Content', color: flowColors[5] },
    { id: 'Frontend', label: 'Frontend', color: flowColors[6] },
    { id: 'Backend', label: 'Backend', color: flowColors[7] },
  ]);
  
  const [links, setLinks] = useState([
    { source: 'Budget', target: 'Marketing', value: 40 },
    { source: 'Budget', target: 'Development', value: 35 },
    { source: 'Budget', target: 'Operations', value: 25 },
    { source: 'Marketing', target: 'Digital Ads', value: 25 },
    { source: 'Marketing', target: 'Content', value: 15 },
    { source: 'Development', target: 'Frontend', value: 20 },
    { source: 'Development', target: 'Backend', value: 15 },
  ]);
  
  const [newNode, setNewNode] = useState('');
  const [newLink, setNewLink] = useState({ source: '', target: '', value: 10 });
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeTab, setActiveTab] = useState('nodes');
  
  const width = 680;
  const height = 420;
  const margin = { top: 20, right: 110, bottom: 20, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const sankey = useMemo(
    () => computeSankey(nodes, links, innerWidth, innerHeight),
    [nodes, links, innerWidth, innerHeight]
  );
  
  const addNode = () => {
    const name = newNode.trim();
    if (name && !nodes.find(n => n.id === name)) {
      setNodes([...nodes, { id: name, label: name, color: flowColors[nodes.length % flowColors.length] }]);
      setNewNode('');
    }
  };
  
  const removeNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    setLinks(links.filter(l => l.source !== id && l.target !== id));
  };
  
  const addLink = () => {
    if (newLink.source && newLink.target && newLink.source !== newLink.target && newLink.value > 0) {
      if (!links.find(l => l.source === newLink.source && l.target === newLink.target)) {
        setLinks([...links, { ...newLink }]);
        setNewLink({ source: '', target: '', value: 10 });
      }
    }
  };
  
  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };
  
  const updateLinkValue = (index, value) => {
    const updated = [...links];
    updated[index].value = Math.max(1, parseInt(value) || 1);
    setLinks(updated);
  };

  // Styles using H&C design system
  const styles = {
    container: {
      minHeight: '100vh',
      background: HC_COLORS.lightGray,
      fontFamily: "'Calibri Light', 'Calibri', sans-serif",
      color: HC_COLORS.darkBlue,
      padding: '32px',
    },
    header: {
      maxWidth: '1100px',
      margin: '0 auto 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      fontSize: '18px',
      fontWeight: '400',
      letterSpacing: '0.5px',
    },
    title: {
      fontSize: '24px',
      fontWeight: '400',
      color: HC_COLORS.darkBlue,
      margin: 0,
    },
    mainContent: {
      maxWidth: '1100px',
      margin: '0 auto',
      display: 'flex',
      gap: '24px',
      flexWrap: 'wrap',
    },
    diagramPanel: {
      flex: '1 1 650px',
      background: HC_COLORS.white,
      borderRadius: '4px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(20, 50, 78, 0.1)',
    },
    controlPanel: {
      flex: '1 1 280px',
      background: HC_COLORS.white,
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(20, 50, 78, 0.1)',
      overflow: 'hidden',
    },
    tabContainer: {
      display: 'flex',
      borderBottom: `1px solid ${HC_COLORS.lightGray}`,
    },
    tab: (active) => ({
      flex: 1,
      padding: '14px 16px',
      background: active ? HC_COLORS.white : HC_COLORS.lightGray,
      border: 'none',
      borderBottom: active ? `3px solid ${HC_COLORS.coralRed}` : '3px solid transparent',
      color: active ? HC_COLORS.darkBlue : HC_COLORS.accent5,
      fontSize: '15px',
      fontFamily: "'Calibri Light', sans-serif",
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }),
    tabContent: {
      padding: '20px',
      maxHeight: '380px',
      overflowY: 'auto',
    },
    inputRow: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
    },
    input: {
      flex: 1,
      padding: '10px 12px',
      background: HC_COLORS.white,
      border: `1px solid ${HC_COLORS.accent3}`,
      borderRadius: '3px',
      color: HC_COLORS.darkBlue,
      fontSize: '15px',
      fontFamily: "'Calibri Light', sans-serif",
      outline: 'none',
    },
    select: {
      flex: 1,
      padding: '10px 12px',
      background: HC_COLORS.white,
      border: `1px solid ${HC_COLORS.accent3}`,
      borderRadius: '3px',
      color: HC_COLORS.darkBlue,
      fontSize: '15px',
      fontFamily: "'Calibri Light', sans-serif",
      cursor: 'pointer',
    },
    btnPrimary: {
      padding: '10px 18px',
      background: HC_COLORS.coralRed,
      border: 'none',
      borderRadius: '3px',
      color: HC_COLORS.white,
      fontSize: '15px',
      fontFamily: "'Calibri Light', sans-serif",
      fontWeight: '400',
      cursor: 'pointer',
      transition: 'background 0.15s ease',
    },
    btnDanger: {
      padding: '6px 10px',
      background: 'transparent',
      border: `1px solid ${HC_COLORS.coralRed}`,
      borderRadius: '3px',
      color: HC_COLORS.coralRed,
      fontSize: '13px',
      cursor: 'pointer',
    },
    nodeTag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: HC_COLORS.lightGray,
      borderRadius: '3px',
      fontSize: '14px',
      marginRight: '8px',
      marginBottom: '8px',
    },
    linkRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px',
      background: HC_COLORS.lightGray,
      borderRadius: '3px',
      marginBottom: '8px',
      fontSize: '14px',
    },
    tooltip: {
      marginTop: '16px',
      padding: '12px 16px',
      background: HC_COLORS.darkBlue,
      borderRadius: '3px',
      color: HC_COLORS.white,
      fontSize: '14px',
      display: 'inline-block',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={{ color: HC_COLORS.darkBlue }}>horn</span>
          <span style={{ color: HC_COLORS.coralRed }}>&</span>
          <span style={{ color: HC_COLORS.darkBlue }}>company</span>
        </div>
        <div style={{ width: '1px', height: '24px', background: HC_COLORS.accent3 }} />
        <h1 style={styles.title}>Sankey Diagram</h1>
      </div>
      
      <div style={styles.mainContent}>
        {/* Diagram */}
        <div style={styles.diagramPanel}>
          <svg width={width} height={height}>
            <defs>
              {sankey.links.map((link, i) => (
                <linearGradient
                  key={i}
                  id={`hc-grad-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={link.source.x1 + margin.left}
                  x2={link.target.x0 + margin.left}
                >
                  <stop offset="0%" stopColor={link.source.color} />
                  <stop offset="100%" stopColor={link.target.color} />
                </linearGradient>
              ))}
            </defs>
            
            <g transform={`translate(${margin.left},${margin.top})`}>
              {/* Links */}
              {sankey.links.map((link, i) => (
                <path
                  key={i}
                  d={generateLinkPath(link)}
                  fill={`url(#hc-grad-${i})`}
                  fillOpacity={
                    hoveredLink === i ? 0.9 :
                    hoveredNode ? (link.source.id === hoveredNode || link.target.id === hoveredNode ? 0.85 : 0.15) :
                    0.7
                  }
                  style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s' }}
                  onMouseEnter={() => setHoveredLink(i)}
                  onMouseLeave={() => setHoveredLink(null)}
                />
              ))}
              
              {/* Nodes */}
              {sankey.nodes.map((node, i) => (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={node.x0}
                    y={node.y0}
                    width={node.x1 - node.x0}
                    height={Math.max(node.y1 - node.y0, 2)}
                    fill={node.color}
                    rx={2}
                    style={{
                      filter: hoveredNode === node.id ? 'brightness(1.1)' : 'none',
                      transition: 'filter 0.15s',
                    }}
                  />
                  <text
                    x={node.x1 + 10}
                    y={(node.y0 + node.y1) / 2}
                    dy="0.35em"
                    fontSize="15"
                    fontFamily="'Calibri Light', sans-serif"
                    fill={HC_COLORS.darkBlue}
                    style={{ opacity: hoveredNode && hoveredNode !== node.id ? 0.4 : 1 }}
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x1 + 10}
                    y={(node.y0 + node.y1) / 2 + 16}
                    dy="0.35em"
                    fontSize="13"
                    fontFamily="'Calibri Light', sans-serif"
                    fill={HC_COLORS.accent5}
                    style={{ opacity: hoveredNode && hoveredNode !== node.id ? 0.4 : 1 }}
                  >
                    {node.value}
                  </text>
                </g>
              ))}
            </g>
          </svg>
          
          {hoveredLink !== null && sankey.links[hoveredLink] && (
            <div style={styles.tooltip}>
              <span>{sankey.links[hoveredLink].source.label}</span>
              <span style={{ margin: '0 8px', opacity: 0.6 }}>→</span>
              <span>{sankey.links[hoveredLink].target.label}</span>
              <span style={{ marginLeft: '12px', color: HC_COLORS.coralRed, fontWeight: '400' }}>
                {sankey.links[hoveredLink].value}
              </span>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div style={styles.controlPanel}>
          <div style={styles.tabContainer}>
            <button
              style={styles.tab(activeTab === 'nodes')}
              onClick={() => setActiveTab('nodes')}
            >
              Nodes ({nodes.length})
            </button>
            <button
              style={styles.tab(activeTab === 'links')}
              onClick={() => setActiveTab('links')}
            >
              Flows ({links.length})
            </button>
          </div>
          
          <div style={styles.tabContent}>
            {activeTab === 'nodes' && (
              <>
                <div style={styles.inputRow}>
                  <input
                    type="text"
                    placeholder="Node name..."
                    value={newNode}
                    onChange={e => setNewNode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNode()}
                    style={styles.input}
                  />
                  <button onClick={addNode} style={styles.btnPrimary}>Add</button>
                </div>
                
                <div>
                  {nodes.map(node => (
                    <div key={node.id} style={styles.nodeTag}>
                      <span style={{
                        width: 12,
                        height: 12,
                        borderRadius: '2px',
                        background: node.color,
                      }} />
                      <span>{node.label}</span>
                      <button
                        onClick={() => removeNode(node.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: HC_COLORS.accent5,
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: 0,
                          marginLeft: '4px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {activeTab === 'links' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ ...styles.inputRow, marginBottom: '8px' }}>
                    <select
                      value={newLink.source}
                      onChange={e => setNewLink({ ...newLink, source: e.target.value })}
                      style={styles.select}
                    >
                      <option value="">From...</option>
                      {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                    </select>
                    <select
                      value={newLink.target}
                      onChange={e => setNewLink({ ...newLink, target: e.target.value })}
                      style={styles.select}
                    >
                      <option value="">To...</option>
                      {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                    </select>
                  </div>
                  <div style={styles.inputRow}>
                    <input
                      type="number"
                      value={newLink.value}
                      onChange={e => setNewLink({ ...newLink, value: parseInt(e.target.value) || 0 })}
                      min="1"
                      style={styles.input}
                      placeholder="Value"
                    />
                    <button onClick={addLink} style={styles.btnPrimary}>Add Flow</button>
                  </div>
                </div>
                
                {links.map((link, i) => (
                  <div key={i} style={styles.linkRow}>
                    <span style={{
                      width: 10,
                      height: 10,
                      borderRadius: '2px',
                      background: nodes.find(n => n.id === link.source)?.color || HC_COLORS.accent5,
                    }} />
                    <span style={{ flex: 1 }}>{link.source} → {link.target}</span>
                    <input
                      type="number"
                      value={link.value}
                      onChange={e => updateLinkValue(i, e.target.value)}
                      min="1"
                      style={{ ...styles.input, width: '60px', flex: 'none' }}
                    />
                    <button onClick={() => removeLink(i)} style={styles.btnDanger}>×</button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
