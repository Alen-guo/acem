import React, { useState } from 'react';
import { Card, Row, Col, Tabs, Tag, Button, List, Avatar, Progress, Divider, Statistic, Timeline, Badge } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, TeamOutlined, TrophyOutlined, DollarOutlined, CalendarOutlined, HeartOutlined } from '@ant-design/icons';
import NetworkGraph from '../components/NetworkGraph';
import ContactModal from '../components/ContactModal';
import ResourceModal from '../components/ResourceModal';

const { TabPane } = Tabs;

const CustomerDetail: React.FC = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);

  // 模拟客户数据
  const customerData = {
    id: '1',
    name: '张总',
    email: 'zhang@company.com',
    phone: '+86 138 0000 0000',
    company: '华东贸易有限公司',
    position: '总经理',
    
    // 客户特点和喜好
    personality: '务实稳重，决策谨慎',
    interests: ['高尔夫', '红酒', '投资理财'],
    communicationStyle: '喜欢面对面沟通，重视长期关系',
    industryPreference: '制造业',
    tags: ['重点客户', '决策者', '长期合作'],
    
    // 合作意向
    cooperationStatus: '意向客户',
    cooperationIntention: 8,
    expectedValue: 500000,
    cooperationNotes: '对我们的产品很感兴趣，正在内部评估中',
    
    // 统计数据
    contactCount: 15,
    lastContactDate: '2024-01-15',
    nextFollowUp: '2024-01-20'
  };

  // 客户关系网络数据
  const relationships = [
    { id: '2', name: '李经理', company: '华东贸易', relationship: '下属', description: '负责采购部门' },
    { id: '3', name: '王总', company: '上海制造', relationship: '合作伙伴', description: '长期业务合作' },
    { id: '4', name: '陈总', company: '广州贸易', relationship: '推荐人', description: '介绍认识' }
  ];

  // 客户资源数据
  const resources = [
    { type: '资金', description: '年预算300万', value: '高', availability: '可用' },
    { type: '渠道', description: '华东地区经销商网络', value: '中', availability: '可用' },
    { type: '人脉', description: '制造业协会副会长', value: '高', availability: '可用' },
    { type: '技术', description: '拥有专业工程团队', value: '中', availability: '部分可用' }
  ];

  // 联系记录数据
  const contactHistory = [
    {
      date: '2024-01-15',
      method: '面谈',
      subject: '产品演示',
      result: '非常好',
      duration: 120,
      content: '详细演示了产品功能，客户反馈积极，表示会考虑采购'
    },
    {
      date: '2024-01-10',
      method: '电话',
      subject: '价格商议',
      result: '好',
      duration: 30,
      content: '讨论了价格方案，客户希望能有更多优惠'
    },
    {
      date: '2024-01-05',
      method: '微信',
      subject: '新年问候',
      result: '好',
      duration: 5,
      content: '发送新年祝福，维护客户关系'
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 客户基本信息卡片 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={24}>
          <Col span={4}>
            <Avatar size={80} icon={<UserOutlined />} />
          </Col>
          <Col span={20}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ margin: 0, marginBottom: '8px' }}>
                {customerData.name}
                <Badge count={customerData.cooperationStatus} style={{ marginLeft: '16px' }} />
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                {customerData.company} • {customerData.position}
              </p>
            </div>
            
            <Row gutter={32}>
              <Col span={6}>
                <div style={{ marginBottom: '8px' }}>
                  <MailOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  {customerData.email}
                </div>
                <div>
                  <PhoneOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  {customerData.phone}
                </div>
              </Col>
              <Col span={6}>
                <Statistic
                  title="联系次数"
                  value={customerData.contactCount}
                  prefix={<CalendarOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="合作意向"
                  value={customerData.cooperationIntention}
                  suffix="/ 10"
                  prefix={<HeartOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="预期价值"
                  value={customerData.expectedValue}
                  prefix={<DollarOutlined />}
                  suffix="元"
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 详细信息标签页 */}
      <Tabs defaultActiveKey="1" size="large">
        {/* 客户特点标签页 */}
        <TabPane tab="客户特点" key="1">
          <Card>
            <Row gutter={24}>
              <Col span={12}>
                <h4>性格特点</h4>
                <p>{customerData.personality}</p>
                
                <h4 style={{ marginTop: '24px' }}>沟通风格</h4>
                <p>{customerData.communicationStyle}</p>
                
                <h4 style={{ marginTop: '24px' }}>行业偏好</h4>
                <p>{customerData.industryPreference}</p>
              </Col>
              <Col span={12}>
                <h4>兴趣爱好</h4>
                <div style={{ marginBottom: '24px' }}>
                  {customerData.interests.map(interest => (
                    <Tag key={interest} color="blue" style={{ marginBottom: '8px' }}>
                      {interest}
                    </Tag>
                  ))}
                </div>
                
                <h4>客户标签</h4>
                <div>
                  {customerData.tags.map(tag => (
                    <Tag key={tag} color="green" style={{ marginBottom: '8px' }}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </Col>
            </Row>
          </Card>
        </TabPane>

        {/* 关系网络标签页 */}
        <TabPane tab="关系网络" key="2">
          <Card>
            <List
              itemLayout="horizontal"
              dataSource={relationships}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div>
                        <strong>{item.name}</strong>
                        <Tag color="orange" style={{ marginLeft: '8px' }}>
                          {item.relationship}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <p>{item.company}</p>
                        <p style={{ color: '#666' }}>{item.description}</p>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        {/* 资源盘点标签页 */}
        <TabPane tab="资源盘点" key="3">
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Button type="primary" onClick={() => setShowResourceModal(true)}>
                添加资源
              </Button>
            </div>
            <List
              itemLayout="horizontal"
              dataSource={resources}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<TrophyOutlined />} style={{ backgroundColor: '#52c41a' }} />}
                    title={
                      <div>
                        <strong>{item.type}</strong>
                        <Tag color={item.value === '高' ? 'red' : 'blue'} style={{ marginLeft: '8px' }}>
                          价值: {item.value}
                        </Tag>
                        <Tag color={item.availability === '可用' ? 'green' : 'orange'} style={{ marginLeft: '8px' }}>
                          {item.availability}
                        </Tag>
                      </div>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        {/* 合作意向标签页 */}
        <TabPane tab="合作意向" key="4">
          <Card>
            <Row gutter={24}>
              <Col span={12}>
                <h4>合作状态</h4>
                <Badge count={customerData.cooperationStatus} style={{ marginBottom: '16px' }} />
                
                <h4>意向评分</h4>
                <Progress 
                  percent={customerData.cooperationIntention * 10} 
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                
                <h4 style={{ marginTop: '24px' }}>预期合作价值</h4>
                <Statistic
                  value={customerData.expectedValue}
                  prefix={<DollarOutlined />}
                  suffix="元"
                />
              </Col>
              <Col span={12}>
                <h4>合作备注</h4>
                <p>{customerData.cooperationNotes}</p>
                
                <h4 style={{ marginTop: '24px' }}>下次跟进</h4>
                <p>{customerData.nextFollowUp}</p>
              </Col>
            </Row>
          </Card>
        </TabPane>

        {/* 联系记录标签页 */}
        <TabPane tab="联系记录" key="5">
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Button type="primary" onClick={() => setShowContactModal(true)}>
                添加联系记录
              </Button>
            </div>
            <Timeline>
              {contactHistory.map((record, index) => (
                <Timeline.Item key={index}>
                  <Card size="small" style={{ marginBottom: '8px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>{record.subject}</strong>
                      <Tag color="blue" style={{ marginLeft: '8px' }}>{record.method}</Tag>
                      <Tag color={record.result === '非常好' ? 'green' : 'blue'} style={{ marginLeft: '8px' }}>
                        {record.result}
                      </Tag>
                      <span style={{ float: 'right', color: '#666' }}>
                        {record.date} • {record.duration}分钟
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#666' }}>{record.content}</p>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>

        {/* 关系网络图标签页 */}
        <TabPane tab="关系网络图" key="6">
          <Card>
            <NetworkGraph customerId={customerData.id} />
          </Card>
        </TabPane>
      </Tabs>

      {/* 联系记录弹窗 */}
      <ContactModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
        customerId={customerData.id}
        customerName={customerData.name}
      />

      {/* 资源管理弹窗 */}
      <ResourceModal
        visible={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        customerId={customerData.id}
        customerName={customerData.name}
      />
    </div>
  );
};

export default CustomerDetail; 