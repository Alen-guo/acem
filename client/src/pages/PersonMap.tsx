/**
 * 人物关系图页面
 * 功能：绘制人物信息图谱，支持思维导图式展示和导出
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Input, 
  Select, 
  Modal, 
  Form, 
  Row, 
  Col, 
  Tag, 
  message,
  Dropdown,
  MenuProps
} from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  MoreOutlined,
  LinkOutlined,
  DisconnectOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface PersonNode {
  id: string;
  name: string;
  position: string;
  company: string;
  phone?: string;
  email?: string;
  tags: string[];
  notes?: string;
  x: number;
  y: number;
  type: 'center' | 'primary' | 'secondary';
  color: string;
}

interface Connection {
  id: string;
  source: string;
  target: string;
  relationship: string;
  strength: number;
  bidirectional: boolean;
}

const PersonMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<PersonNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ nodeId: string; offset: { x: number; y: number } } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNode, setEditingNode] = useState<PersonNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [form] = Form.useForm();
  
  // 连线相关状态
  const [connectMode, setConnectMode] = useState(false);
  const [connectStart, setConnectStart] = useState<string | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [connectionForm] = Form.useForm();

  // 颜色方案
  const colors = {
    center: '#ff4d4f',
    primary: '#1890ff',
    secondary: '#52c41a',
    connection: '#d9d9d9'
  };

  // 初始化示例数据
  useEffect(() => {
    const centerNode: PersonNode = {
      id: 'center',
      name: '张总',
      position: '总经理',
      company: '华东贸易有限公司',
      phone: '+86 138 0000 0000',
      email: 'zhang@company.com',
      tags: ['决策者', '重点客户'],
      notes: '务实稳重，决策谨慎',
      x: 400,
      y: 300,
      type: 'center',
      color: colors.center
    };

    const sampleNodes: PersonNode[] = [
      centerNode,
      {
        id: '1',
        name: '李经理',
        position: '采购经理',
        company: '华东贸易有限公司',
        tags: ['采购决策人'],
        x: 600,
        y: 200,
        type: 'primary',
        color: colors.primary
      },
      {
        id: '2',
        name: '王总',
        position: '董事长',
        company: '广州贸易公司',
        tags: ['推荐人', '高价值'],
        x: 200,
        y: 200,
        type: 'primary',
        color: colors.primary
      }
    ];

    const sampleConnections: Connection[] = [
      {
        id: 'c1',
        source: 'center',
        target: '1',
        relationship: '下级',
        strength: 4,
        bidirectional: false
      },
      {
        id: 'c2',
        source: 'center',
        target: '2',
        relationship: '合作伙伴',
        strength: 5,
        bidirectional: true
      }
    ];

    setNodes(sampleNodes);
    setConnections(sampleConnections);
  }, []);

  // 处理节点拖拽和连线
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    
    // 如果是连线模式
    if (connectMode) {
      if (!connectStart) {
        setConnectStart(nodeId);
        message.info('请点击第二个节点完成连线');
      } else if (connectStart !== nodeId) {
        // 创建连线
        const newConnection: Connection = {
          id: `conn_${Date.now()}`,
          source: connectStart,
          target: nodeId,
          relationship: '关联',
          strength: 2,
          bidirectional: false
        };
        setConnections(prev => [...prev, newConnection]);
        setConnectStart(null);
        setConnectMode(false);
        message.success('连线创建成功');
      } else {
        message.warning('不能连接到自己');
      }
      return;
    }

    // 正常拖拽模式
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDragging({
      nodeId,
      offset: {
        x: mouseX - node.x * zoom,
        y: mouseY - node.y * zoom
      }
    });
    setSelectedNode(nodeId);
  }, [nodes, zoom, connectMode, connectStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setNodes(prev => prev.map(node => 
      node.id === dragging.nodeId
        ? {
            ...node,
            x: (mouseX - dragging.offset.x) / zoom,
            y: (mouseY - dragging.offset.y) / zoom
          }
        : node
    ));
  }, [dragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // 添加新节点
  const handleAddNode = () => {
    setEditingNode(null);
    form.resetFields();
    setShowModal(true);
  };

  // 编辑节点
  const handleEditNode = (node: PersonNode) => {
    setEditingNode(node);
    form.setFieldsValue(node);
    setShowModal(true);
  };

  // 保存节点
  const handleSaveNode = async (values: any) => {
    const nodeData: PersonNode = {
      id: editingNode?.id || `node_${Date.now()}`,
      ...values,
      tags: values.tags || [],
      x: editingNode?.x || 400 + Math.random() * 200 - 100,
      y: editingNode?.y || 300 + Math.random() * 200 - 100,
      type: values.type || 'secondary',
      color: colors[values.type as keyof typeof colors] || colors.secondary
    };

    if (editingNode) {
      setNodes(prev => prev.map(node => 
        node.id === editingNode.id ? nodeData : node
      ));
    } else {
      setNodes(prev => [...prev, nodeData]);
    }

    setShowModal(false);
    message.success(editingNode ? '节点更新成功' : '节点添加成功');
  };

  // 删除节点
  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.source !== nodeId && conn.target !== nodeId
    ));
    message.success('节点删除成功');
  };

  // 连线管理功能
  const handleEditConnection = (connection: Connection) => {
    setEditingConnection(connection);
    connectionForm.setFieldsValue(connection);
    setShowConnectionModal(true);
  };

  const handleSaveConnection = async (values: any) => {
    if (!editingConnection) return;
    
    setConnections(prev => prev.map(conn => 
      conn.id === editingConnection.id 
        ? { ...conn, ...values }
        : conn
    ));
    
    setShowConnectionModal(false);
    message.success('连线更新成功');
  };

  const handleDeleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    message.success('连线删除成功');
  };

  // 开启/关闭连线模式
  const toggleConnectMode = () => {
    setConnectMode(!connectMode);
    setConnectStart(null);
    if (!connectMode) {
      message.info('连线模式已开启，请点击两个节点进行连线');
    }
  };

  // 导出功能
  const handleExport = (format: 'png' | 'svg' | 'json') => {
    if (format === 'json') {
      const data = { nodes, connections };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `person-map-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('JSON数据导出成功');
      return;
    }

    const svg = svgRef.current;
    if (!svg) return;

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `person-map-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('SVG图片导出成功');
    }
  };

  // 导出菜单
  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'svg',
      label: '导出为SVG图片',
      onClick: () => handleExport('svg')
    },
    {
      key: 'json',
      label: '导出为JSON数据',
      onClick: () => handleExport('json')
    }
  ];

  return (
    <div>
      {/* 工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1 style={{ margin: 0 }}>人物关系图</h1>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddNode}
              >
                添加人物
              </Button>
              <Button 
                type={connectMode ? "primary" : "default"}
                icon={<LinkOutlined />}
                onClick={toggleConnectMode}
                style={{ 
                  backgroundColor: connectMode ? '#52c41a' : undefined,
                  borderColor: connectMode ? '#52c41a' : undefined 
                }}
              >
                {connectMode ? '取消连线' : '连线模式'}
              </Button>
              <Button 
                icon={<ZoomOutOutlined />}
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              >
                缩小
              </Button>
              <Button 
                icon={<ZoomInOutlined />}
                onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
              >
                放大
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={() => setZoom(1)}
              >
                重置
              </Button>
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button icon={<DownloadOutlined />}>
                  导出 <MoreOutlined />
                </Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 关系图画布 */}
      <Card>
        <div style={{ width: '100%', height: '600px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 800 600"
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 背景网格 */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* 连接线 */}
            <g transform={`scale(${zoom})`}>
              {connections.map(conn => {
                const sourceNode = nodes.find(n => n.id === conn.source);
                const targetNode = nodes.find(n => n.id === conn.target);
                if (!sourceNode || !targetNode) return null;

                const midX = (sourceNode.x + targetNode.x) / 2;
                const midY = (sourceNode.y + targetNode.y) / 2;

                return (
                  <g key={conn.id}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={colors.connection}
                      strokeWidth={conn.strength}
                      strokeDasharray={conn.bidirectional ? "0" : "5,5"}
                    />
                    
                    {/* 可点击的连线文字背景 */}
                    <rect
                      x={midX - conn.relationship.length * 3}
                      y={midY - 12}
                      width={conn.relationship.length * 6}
                      height={16}
                      fill="white"
                      stroke="#d9d9d9"
                      strokeWidth="1"
                      rx="2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleEditConnection(conn)}
                    />
                    
                    {/* 连线文字 */}
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#666"
                      dy="3"
                      style={{ cursor: 'pointer', pointerEvents: 'none' }}
                    >
                      {conn.relationship}
                    </text>
                    
                    {/* 删除连线按钮 */}
                    <circle
                      cx={midX + conn.relationship.length * 3 + 8}
                      cy={midY - 8}
                      r="6"
                      fill="#ff4d4f"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleDeleteConnection(conn.id)}
                    />
                    <text
                      x={midX + conn.relationship.length * 3 + 8}
                      y={midY - 8}
                      textAnchor="middle"
                      fontSize="8"
                      fill="white"
                      dy="2"
                      style={{ pointerEvents: 'none' }}
                    >
                      ×
                    </text>
                  </g>
                );
              })}

              {/* 人物节点 */}
              {nodes.map(node => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.type === 'center' ? 30 : node.type === 'primary' ? 25 : 20}
                    fill={
                      connectMode && connectStart === node.id 
                        ? '#faad14' 
                        : connectMode && connectStart && connectStart !== node.id
                        ? '#87e8de'
                        : node.color
                    }
                    stroke={selectedNode === node.id ? '#000' : '#fff'}
                    strokeWidth={selectedNode === node.id ? 3 : 2}
                    style={{ 
                      cursor: connectMode ? 'crosshair' : 'move',
                      filter: connectMode ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, node.id)}
                    onDoubleClick={() => !connectMode && handleEditNode(node)}
                  />
                  
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fontSize="12"
                    fill="white"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.name}
                  </text>
                  
                  <text
                    x={node.x}
                    y={node.y + (node.type === 'center' ? 45 : node.type === 'primary' ? 40 : 35)}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#666"
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.position}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* 选中节点的详细信息 */}
        {selectedNode && (
          <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Space direction="vertical" size="small">
                      <div>
                        <strong>{node.name}</strong> - {node.position}
                      </div>
                      <div style={{ color: '#666' }}>{node.company}</div>
                      {node.tags.length > 0 && (
                        <div>
                          {node.tags.map(tag => (
                            <Tag key={tag} color="blue">{tag}</Tag>
                          ))}
                        </div>
                      )}
                      {node.notes && (
                        <div style={{ color: '#999', fontSize: '12px' }}>{node.notes}</div>
                      )}
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <Button 
                        size="small" 
                        icon={<EditOutlined />}
                        onClick={() => handleEditNode(node)}
                      >
                        编辑
                      </Button>
                      {node.id !== 'center' && (
                        <Button 
                          size="small" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteNode(node.id)}
                        >
                          删除
                        </Button>
                      )}
                    </Space>
                  </Col>
                </Row>
              );
            })()}
          </div>
        )}
      </Card>

      {/* 添加/编辑节点弹窗 */}
      <Modal
        title={editingNode ? '编辑人物信息' : '添加人物信息'}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveNode}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="position"
                label="职位"
                rules={[{ required: true, message: '请输入职位' }]}
              >
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="company"
            label="公司"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="请输入公司名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="电话">
                <Input placeholder="请输入电话号码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="节点类型">
                <Select placeholder="选择节点类型">
                  <Option value="center">中心人物</Option>
                  <Option value="primary">重要人物</Option>
                  <Option value="secondary">普通人物</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签">
                <Select
                  mode="tags"
                  placeholder="添加标签"
                  options={[
                    { value: '决策者', label: '决策者' },
                    { value: '重点客户', label: '重点客户' },
                    { value: '推荐人', label: '推荐人' },
                    { value: '信息源', label: '信息源' },
                    { value: '影响者', label: '影响者' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
                  </Form>
        </Modal>

        {/* 编辑连线弹窗 */}
        <Modal
          title="编辑连线关系"
          open={showConnectionModal}
          onOk={() => connectionForm.submit()}
          onCancel={() => setShowConnectionModal(false)}
          width={400}
        >
          <Form
            form={connectionForm}
            layout="vertical"
            onFinish={handleSaveConnection}
          >
            <Form.Item
              name="relationship"
              label="关系描述"
              rules={[{ required: true, message: '请输入关系描述' }]}
            >
              <Input placeholder="请输入关系描述，如：上级、下级、合作伙伴等" />
            </Form.Item>

            <Form.Item
              name="strength"
              label="关系强度"
              rules={[{ required: true, message: '请选择关系强度' }]}
            >
              <Select placeholder="选择关系强度">
                <Option value={1}>很弱</Option>
                <Option value={2}>较弱</Option>
                <Option value={3}>一般</Option>
                <Option value={4}>较强</Option>
                <Option value={5}>很强</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="bidirectional"
              label="关系类型"
              rules={[{ required: true, message: '请选择关系类型' }]}
            >
              <Select placeholder="选择关系类型">
                <Option value={false}>单向关系</Option>
                <Option value={true}>双向关系</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  };

  export default PersonMap; 