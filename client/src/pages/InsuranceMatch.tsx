/**
 * 智能保险产品匹配页面
 * 功能：基于客户信息智能推荐合适的保险产品
 */
import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Progress,
  Tag,
  List,
  Badge,
  Space,
  Divider,
  Statistic,
  Alert,
  Rate,
  message
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  SafetyOutlined,
  TrophyOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

// 保险产品数据结构
interface InsuranceProduct {
  id: string;
  name: string;
  category: '人寿' | '医疗' | '意外' | '财产' | '车险' | '养老';
  description: string;
  coverage: string[];
  targetAge: [number, number];
  targetIncome: [number, number];
  targetOccupation: string[];
  targetFamily: string[];
  riskLevel: '低' | '中' | '高';
  premium: [number, number];
  features: string[];
  advantages: string[];
  matchScore?: number;
}

// 客户信息结构
interface CustomerInfo {
  name: string;
  age: number;
  gender: '男' | '女';
  income: number;
  occupation: string;
  familyStatus: string;
  healthStatus: string;
  riskPreference: '保守' | '中性' | '激进';
  budgetRange: [number, number];
  concerns: string[];
  specialNeeds: string;
}

const InsuranceMatch: React.FC = () => {
  const [form] = Form.useForm();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [matchedProducts, setMatchedProducts] = useState<InsuranceProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 保险产品知识库
  const insuranceDatabase: InsuranceProduct[] = [
    {
      id: '1',
      name: '安康终身重疾险',
      category: '医疗',
      description: '覆盖100种重大疾病，终身保障，确诊即赔',
      coverage: ['重大疾病', '轻症', '中症', '身故保障'],
      targetAge: [20, 55],
      targetIncome: [100000, 1000000],
      targetOccupation: ['白领', '教师', '医生', '工程师', '管理人员'],
      targetFamily: ['已婚', '有子女'],
      riskLevel: '中',
      premium: [5000, 20000],
      features: ['终身保障', '确诊即赔', '保费豁免'],
      advantages: ['覆盖疾病种类多', '赔付比例高', '可附加医疗险']
    },
    {
      id: '2',
      name: '守护者定期寿险',
      category: '人寿',
      description: '高额保障，保费低廉，适合家庭经济支柱',
      coverage: ['身故保障', '全残保障'],
      targetAge: [25, 50],
      targetIncome: [80000, 800000],
      targetOccupation: ['企业高管', '销售', '工程师', '创业者'],
      targetFamily: ['已婚', '有子女', '家庭支柱'],
      riskLevel: '低',
      premium: [1000, 8000],
      features: ['高额保障', '保费递减', '免体检额度高'],
      advantages: ['杠杆率高', '投保简单', '理赔快速']
    },
    {
      id: '3',
      name: '意外无忧综合险',
      category: '意外',
      description: '全方位意外保障，涵盖工作生活各种场景',
      coverage: ['意外身故', '意外伤残', '意外医疗', '交通意外'],
      targetAge: [18, 65],
      targetIncome: [30000, 500000],
      targetOccupation: ['所有职业'],
      targetFamily: ['所有家庭状态'],
      riskLevel: '低',
      premium: [200, 2000],
      features: ['24小时保障', '全球承保', '快速理赔'],
      advantages: ['保费便宜', '保障全面', '投保门槛低']
    },
    {
      id: '4',
      name: '金色年华养老金',
      category: '养老',
      description: '稳健增值，保证领取，安享晚年',
      coverage: ['养老金给付', '身故保障', '全残保障'],
      targetAge: [30, 50],
      targetIncome: [150000, 2000000],
      targetOccupation: ['稳定收入群体'],
      targetFamily: ['中产家庭', '双职工'],
      riskLevel: '低',
      premium: [10000, 100000],
      features: ['保证领取20年', '年金递增', '可附加万能账户'],
      advantages: ['收益稳定', '税收优惠', '传承功能']
    },
    {
      id: '5',
      name: '百万医疗保障',
      category: '医疗',
      description: '超高保额医疗险，不限社保用药',
      coverage: ['住院医疗', '特殊门诊', '门诊手术', '住院前后门急诊'],
      targetAge: [0, 65],
      targetIncome: [50000, 1000000],
      targetOccupation: ['中高收入群体'],
      targetFamily: ['所有家庭'],
      riskLevel: '中',
      premium: [300, 3000],
      features: ['百万保额', '0免赔', '不限社保'],
      advantages: ['保额高', '报销范围广', '增值服务多']
    },
    {
      id: '6',
      name: '车行无忧车险',
      category: '车险',
      description: '全面车辆保障，出行更安心',
      coverage: ['车损险', '第三者责任险', '座位险', '盗抢险'],
      targetAge: [20, 70],
      targetIncome: [60000, 1000000],
      targetOccupation: ['有车一族'],
      targetFamily: ['有车家庭'],
      riskLevel: '中',
      premium: [2000, 8000],
      features: ['全险保障', '24小时救援', '快速理赔'],
      advantages: ['服务网点多', '理赔效率高', '增值服务好']
    }
  ];

  // 智能匹配算法
  const matchInsuranceProducts = (customer: CustomerInfo): InsuranceProduct[] => {
    return insuranceDatabase.map(product => {
      let score = 0;
      
      // 年龄匹配 (20分)
      if (customer.age >= product.targetAge[0] && customer.age <= product.targetAge[1]) {
        score += 20;
      } else {
        const ageDiff = Math.min(
          Math.abs(customer.age - product.targetAge[0]),
          Math.abs(customer.age - product.targetAge[1])
        );
        score += Math.max(0, 20 - ageDiff * 2);
      }

      // 收入匹配 (20分)
      if (customer.income >= product.targetIncome[0] && customer.income <= product.targetIncome[1]) {
        score += 20;
      } else {
        const incomeRatio = customer.income / ((product.targetIncome[0] + product.targetIncome[1]) / 2);
        if (incomeRatio > 0.5 && incomeRatio < 2) {
          score += 15;
        } else if (incomeRatio > 0.3 && incomeRatio < 3) {
          score += 10;
        }
      }

      // 职业匹配 (15分)
      if (product.targetOccupation.includes('所有职业') || 
          product.targetOccupation.some(occ => customer.occupation.includes(occ))) {
        score += 15;
      }

      // 家庭状况匹配 (15分)
      if (product.targetFamily.includes('所有家庭状态') ||
          product.targetFamily.some(status => customer.familyStatus.includes(status))) {
        score += 15;
      }

      // 预算匹配 (15分)
      const avgPremium = (product.premium[0] + product.premium[1]) / 2;
      if (avgPremium >= customer.budgetRange[0] && avgPremium <= customer.budgetRange[1]) {
        score += 15;
      } else {
        const budgetRatio = avgPremium / ((customer.budgetRange[0] + customer.budgetRange[1]) / 2);
        if (budgetRatio > 0.5 && budgetRatio < 1.5) {
          score += 10;
        }
      }

      // 风险偏好匹配 (10分)
      const riskMap = { '保守': '低', '中性': '中', '激进': '高' };
      if (riskMap[customer.riskPreference] === product.riskLevel) {
        score += 10;
      }

      // 特殊需求匹配 (5分)
      if (customer.specialNeeds && 
          (product.description.includes(customer.specialNeeds) || 
           product.features.some(f => f.includes(customer.specialNeeds)))) {
        score += 5;
      }

      return {
        ...product,
        matchScore: Math.round(score)
      };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  };

  // 处理客户信息提交
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const customer: CustomerInfo = {
        ...values,
        concerns: values.concerns || [],
        budgetRange: [values.budgetMin || 1000, values.budgetMax || 50000]
      };
      
      setCustomerInfo(customer);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const matched = matchInsuranceProducts(customer);
      setMatchedProducts(matched);
      
      message.success(`成功匹配到 ${matched.length} 款保险产品`);
    } catch (error) {
      message.error('匹配失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取匹配度颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    if (score >= 40) return '#fa8c16';
    return '#f5222d';
  };

  // 获取风险等级颜色
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case '低': return 'green';
      case '中': return 'orange';
      case '高': return 'red';
      default: return 'default';
    }
  };

  // 筛选产品
  const filteredProducts = selectedCategory === 'all' 
    ? matchedProducts 
    : matchedProducts.filter(p => p.category === selectedCategory);

  return (
    <div>
      {/* 页面标题 */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <SafetyOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              智能保险产品匹配
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              输入客户信息，AI智能推荐最适合的保险产品
            </p>
          </Col>
          <Col>
            <Statistic
              title="产品库数量"
              value={insuranceDatabase.length}
              prefix={<TrophyOutlined />}
              suffix="款"
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        {/* 客户信息录入 */}
        <Col span={8}>
          <Card title="客户信息录入" extra={<UserOutlined />}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="name"
                label="客户姓名"
                rules={[{ required: true, message: '请输入客户姓名' }]}
              >
                <Input placeholder="请输入客户姓名" />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="age"
                    label="年龄"
                    rules={[{ required: true, message: '请输入年龄' }]}
                  >
                    <Input type="number" placeholder="年龄" suffix="岁" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="性别"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <Select placeholder="选择性别">
                      <Option value="男">男</Option>
                      <Option value="女">女</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="income"
                label="年收入"
                rules={[{ required: true, message: '请输入年收入' }]}
              >
                <Input type="number" placeholder="年收入" suffix="元" />
              </Form.Item>

              <Form.Item
                name="occupation"
                label="职业"
                rules={[{ required: true, message: '请输入职业' }]}
              >
                <Input placeholder="如：白领、医生、教师等" />
              </Form.Item>

              <Form.Item
                name="familyStatus"
                label="家庭状况"
                rules={[{ required: true, message: '请选择家庭状况' }]}
              >
                <Select placeholder="选择家庭状况">
                  <Option value="单身">单身</Option>
                  <Option value="已婚">已婚</Option>
                  <Option value="有子女">有子女</Option>
                  <Option value="家庭支柱">家庭支柱</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="healthStatus"
                label="健康状况"
                rules={[{ required: true, message: '请选择健康状况' }]}
              >
                <Select placeholder="选择健康状况">
                  <Option value="健康">健康</Option>
                  <Option value="亚健康">亚健康</Option>
                  <Option value="有慢性病">有慢性病</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="riskPreference"
                label="风险偏好"
                rules={[{ required: true, message: '请选择风险偏好' }]}
              >
                <Select placeholder="选择风险偏好">
                  <Option value="保守">保守型</Option>
                  <Option value="中性">中性型</Option>
                  <Option value="激进">激进型</Option>
                </Select>
              </Form.Item>

              <Divider>预算范围</Divider>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="budgetMin" label="最低预算">
                    <Input type="number" placeholder="最低" suffix="元" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="budgetMax" label="最高预算">
                    <Input type="number" placeholder="最高" suffix="元" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="concerns" label="关注点">
                <Select
                  mode="multiple"
                  placeholder="选择关注的保障内容"
                  options={[
                    { value: '重大疾病', label: '重大疾病' },
                    { value: '意外保障', label: '意外保障' },
                    { value: '养老规划', label: '养老规划' },
                    { value: '子女教育', label: '子女教育' },
                    { value: '财富传承', label: '财富传承' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="specialNeeds" label="特殊需求">
                <TextArea 
                  rows={3} 
                  placeholder="请描述特殊需求，如特定疾病保障、投资偏好等"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                  size="large"
                  icon={<SearchOutlined />}
                >
                  开始智能匹配
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 匹配结果 */}
        <Col span={16}>
          {matchedProducts.length > 0 ? (
            <Card
              title={
                <Space>
                  <span>匹配结果</span>
                  <Badge count={filteredProducts.length} showZero />
                </Space>
              }
              extra={
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  style={{ width: 120 }}
                >
                  <Option value="all">全部类型</Option>
                  <Option value="人寿">人寿保险</Option>
                  <Option value="医疗">医疗保险</Option>
                  <Option value="意外">意外保险</Option>
                  <Option value="财产">财产保险</Option>
                  <Option value="车险">车险</Option>
                  <Option value="养老">养老保险</Option>
                </Select>
              }
            >
              {customerInfo && (
                <Alert
                  message={`为客户"${customerInfo.name}"找到 ${filteredProducts.length} 款匹配产品`}
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <List
                dataSource={filteredProducts}
                renderItem={(product) => (
                  <List.Item style={{ padding: '16px 0' }}>
                    <Card 
                      style={{ width: '100%' }}
                      size="small"
                      title={
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Space>
                              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                {product.name}
                              </span>
                              <Tag color="blue">{product.category}</Tag>
                              <Tag color={getRiskColor(product.riskLevel)}>
                                {product.riskLevel}风险
                              </Tag>
                            </Space>
                          </Col>
                          <Col>
                            <Space>
                              <span style={{ fontSize: '12px', color: '#666' }}>匹配度</span>
                              <Progress
                                type="circle"
                                percent={product.matchScore}
                                width={40}
                                strokeColor={getScoreColor(product.matchScore || 0)}
                              />
                            </Space>
                          </Col>
                        </Row>
                      }
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <p style={{ color: '#666', marginBottom: 12 }}>
                            {product.description}
                          </p>
                          
                          <div style={{ marginBottom: 12 }}>
                            <strong>保障内容：</strong>
                            <div style={{ marginTop: 4 }}>
                              {product.coverage.map(item => (
                                <Tag key={item} color="green" style={{ marginBottom: 4 }}>
                                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                                  {item}
                                </Tag>
                              ))}
                            </div>
                          </div>

                          <div>
                            <strong>产品特色：</strong>
                            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                              {product.features.slice(0, 3).map((feature, index) => (
                                <li key={index} style={{ fontSize: '12px' }}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        </Col>

                        <Col span={12}>
                          <Row gutter={12}>
                            <Col span={12}>
                              <Statistic
                                title="适用年龄"
                                value={`${product.targetAge[0]}-${product.targetAge[1]}`}
                                suffix="岁"
                                valueStyle={{ fontSize: '14px' }}
                              />
                            </Col>
                            <Col span={12}>
                              <Statistic
                                title="保费范围"
                                value={`${product.premium[0]}-${product.premium[1]}`}
                                suffix="元"
                                valueStyle={{ fontSize: '14px' }}
                                prefix={<DollarOutlined />}
                              />
                            </Col>
                          </Row>

                          <Divider style={{ margin: '12px 0' }} />

                          <div style={{ marginBottom: 8 }}>
                            <strong style={{ fontSize: '12px' }}>产品优势：</strong>
                          </div>
                          {product.advantages.slice(0, 3).map((advantage, index) => (
                            <div key={index} style={{ fontSize: '12px', color: '#52c41a', marginBottom: 2 }}>
                              <StarOutlined style={{ marginRight: 4 }} />
                              {advantage}
                            </div>
                          ))}

                          <div style={{ marginTop: 12 }}>
                            <Rate 
                              disabled 
                              value={Math.floor((product.matchScore || 0) / 20)} 
                              style={{ fontSize: '14px' }}
                            />
                            <span style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
                              推荐指数
                            </span>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <SafetyOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                <h3 style={{ color: '#999', margin: '16px 0 8px' }}>
                  请先输入客户信息进行智能匹配
                </h3>
                <p style={{ color: '#ccc' }}>
                  我们的AI引擎将基于客户画像推荐最适合的保险产品
                </p>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default InsuranceMatch; 