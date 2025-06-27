import React, { useEffect, useRef, useState } from 'react';
import { Card, Select, Button, Tag, Tooltip } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

interface Node {
  id: string;
  name: string;
  type: 'customer' | 'resource' | 'contact';
  company?: string;
  value?: string;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

interface NetworkGraphProps {
  customerId: string;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ customerId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(1);

  // 模拟网络数据
  useEffect(() => {
    const mockNodes: Node[] = [
      // 中心客户
      { id: '1', name: '张总', type: 'customer', company: '华东贸易' },
      
      // 相关人员
      { id: '2', name: '李经理', type: 'contact', company: '华东贸易' },
      { id: '3', name: '王总', type: 'customer', company: '上海制造' },
      { id: '4', name: '陈总', type: 'customer', company: '广州贸易' },
      { id: '5', name: '刘总', type: 'customer', company: '深圳科技' },
      
      // 资源节点
      { id: 'r1', name: '资金资源', type: 'resource', value: '300万预算' },
      { id: 'r2', name: '渠道资源', type: 'resource', value: '华东经销网络' },
      { id: 'r3', name: '人脉资源', type: 'resource', value: '制造业协会' },
      { id: 'r4', name: '技术资源', type: 'resource', value: '工程团队' },
    ];

    const mockLinks: Link[] = [
      // 人员关系
      { source: '1', target: '2', relationship: '上下级', strength: 0.9 },
      { source: '1', target: '3', relationship: '合作伙伴', strength: 0.8 },
      { source: '1', target: '4', relationship: '推荐人', strength: 0.7 },
      { source: '3', target: '5', relationship: '同行', strength: 0.6 },
      
      // 资源关系
      { source: '1', target: 'r1', relationship: '拥有', strength: 0.9 },
      { source: '1', target: 'r2', relationship: '控制', strength: 0.8 },
      { source: '1', target: 'r3', relationship: '参与', strength: 0.7 },
      { source: '2', target: 'r4', relationship: '管理', strength: 0.6 },
      { source: '3', target: 'r1', relationship: '共享', strength: 0.5 },
    ];

    // 计算节点位置（简单的圆形布局）
    const centerX = 400;
    const centerY = 300;
    const radius = 150;

    const processedNodes = mockNodes.map((node, index) => {
      if (node.id === '1') {
        // 中心节点
        return { ...node, x: centerX, y: centerY };
      } else {
        // 周围节点
        const angle = (index * 2 * Math.PI) / (mockNodes.length - 1);
        const nodeRadius = node.type === 'resource' ? radius + 50 : radius;
        return {
          ...node,
          x: centerX + Math.cos(angle) * nodeRadius,
          y: centerY + Math.sin(angle) * nodeRadius,
        };
      }
    });

    setNodes(processedNodes);
    setLinks(mockLinks);
  }, [customerId]);

  // 绘制网络图
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = svgRef.current;
    const width = 800;
    const height = 600;

    // 清空SVG
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // 创建主容器
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `scale(${zoom})`);
    svg.appendChild(g);

    // 绘制连接线
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      
      if (sourceNode && targetNode) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourceNode.x!.toString());
        line.setAttribute('y1', sourceNode.y!.toString());
        line.setAttribute('x2', targetNode.x!.toString());
        line.setAttribute('y2', targetNode.y!.toString());
        line.setAttribute('stroke', '#d9d9d9');
        line.setAttribute('stroke-width', (link.strength * 3).toString());
        line.setAttribute('stroke-opacity', '0.6');
        g.appendChild(line);

        // 添加关系标签
        const midX = (sourceNode.x! + targetNode.x!) / 2;
        const midY = (sourceNode.y! + targetNode.y!) / 2;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', midX.toString());
        text.setAttribute('y', midY.toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', '#666');
        text.textContent = link.relationship;
        g.appendChild(text);
      }
    });

    // 绘制节点
    nodes.forEach(node => {
      // 节点圆圈
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x!.toString());
      circle.setAttribute('cy', node.y!.toString());
      circle.setAttribute('r', node.id === '1' ? '25' : '20');
      
      // 根据节点类型设置颜色
      let fillColor = '#1890ff';
      if (node.type === 'customer') fillColor = '#52c41a';
      if (node.type === 'resource') fillColor = '#fa8c16';
      if (node.id === '1') fillColor = '#f5222d'; // 中心节点特殊颜色
      
      circle.setAttribute('fill', fillColor);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      circle.style.cursor = 'pointer';
      g.appendChild(circle);

      // 节点文字
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x!.toString());
      text.setAttribute('y', (node.y! + 35).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', node.id === '1' ? 'bold' : 'normal');
      text.setAttribute('fill', '#333');
      text.textContent = node.name;
      g.appendChild(text);

      // 公司/描述信息
      if (node.company || node.value) {
        const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subText.setAttribute('x', node.x!.toString());
        subText.setAttribute('y', (node.y! + 50).toString());
        subText.setAttribute('text-anchor', 'middle');
        subText.setAttribute('font-size', '10');
        subText.setAttribute('fill', '#666');
        subText.textContent = node.company || node.value || '';
        g.appendChild(subText);
      }
    });

  }, [nodes, links, zoom]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  const getNodeTypeCount = (type: string) => {
    return nodes.filter(node => node.type === type).length;
  };

  return (
    <div>
      {/* 控制面板 */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Select
            value={selectedFilter}
            onChange={setSelectedFilter}
            style={{ width: 120, marginRight: '8px' }}
          >
            <Option value="all">全部关系</Option>
            <Option value="person">人员关系</Option>
            <Option value="resource">资源关系</Option>
          </Select>
          
          <div style={{ display: 'inline-block', marginLeft: '16px' }}>
            <Tag color="red">客户核心: 1</Tag>
            <Tag color="green">相关客户: {getNodeTypeCount('customer') - 1}</Tag>
            <Tag color="blue">联系人: {getNodeTypeCount('contact')}</Tag>
            <Tag color="orange">资源: {getNodeTypeCount('resource')}</Tag>
          </div>
        </div>
        
        <div>
          <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
          <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ margin: '0 8px' }} />
          <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
        </div>
      </div>

      {/* 网络图 */}
      <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          width="800"
          height="600"
          style={{ background: '#fafafa', display: 'block' }}
        />
      </div>

      {/* 图例说明 */}
      <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>图例说明：</h4>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f5222d', marginRight: '8px' }}></div>
            <span>核心客户</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#52c41a', marginRight: '8px' }}></div>
            <span>相关客户</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1890ff', marginRight: '8px' }}></div>
            <span>联系人</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fa8c16', marginRight: '8px' }}></div>
            <span>资源节点</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '24px', height: '2px', background: '#d9d9d9', marginRight: '8px' }}></div>
            <span>关系连接（线条粗细表示关系强度）</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph; 