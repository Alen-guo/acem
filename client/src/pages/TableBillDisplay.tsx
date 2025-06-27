/**
 * 月份表格展示页面
 * 功能：按照Excel原始结构展示导入的表格数据，支持按月份查询和按工作表分组展示
 */
import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
  DatePicker,
  message,
  Empty,
  Alert,
  Radio,
  Tabs,
  Badge,
  Tooltip,
} from 'antd';
import {
  TableOutlined,
  DownloadOutlined,
  PlusOutlined,
  FileExcelOutlined,
  FolderOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import * as XLSX from 'xlsx';

import { tableDataAPI } from '../services/api';

const { Title, Text } = Typography;
const { MonthPicker, RangePicker } = DatePicker;
const { TabPane } = Tabs;

// 工作表数据接口
interface ExcelSheetData {
  name: string;
  data: any[];
  columns: any[];
  structure: any;
  totalIncome: number;
  totalExpense: number;
  count: number;
}

// API响应数据接口
interface MonthlySheetResponse {
  sheets: ExcelSheetData[];
  totalSheets: number;
  totalRecords: number;
  summary: {
    totalIncome: number;
    totalExpense: number;
    totalCount: number;
  };
}

const TableBillDisplay: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 状态管理
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const monthParam = searchParams.get('month');
    return monthParam || dayjs().format('YYYY-MM');
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [activeSheetTab, setActiveSheetTab] = useState<string>('all');

  // 获取月份表格数据
  const { data: monthlyData, isLoading } = useQuery(
    ['monthlyTableData', dateMode, selectedMonth, dateRange?.map(d => d.format('YYYY-MM')).join('-')],
    async () => {
      if (dateMode === 'single') {
        const [year, month] = selectedMonth.split('-');
        return tableDataAPI.getMonthlyTableData({
          month: month,
          year: parseInt(year),
        });
      } else if (dateMode === 'range' && dateRange) {
        return tableDataAPI.getMonthlyTableData({
          startDate: dateRange[0].startOf('month').toISOString(),
          endDate: dateRange[1].endOf('month').toISOString(),
        });
      }
      return {
        status: 'success' as const,
        message: '无查询参数',
        data: { 
          sheets: [] as ExcelSheetData[], 
          totalSheets: 0, 
          totalRecords: 0, 
          summary: { totalIncome: 0, totalExpense: 0, totalCount: 0 }
        }
      };
    },
    {
      enabled: (dateMode === 'single' && !!selectedMonth) || (dateMode === 'range' && !!dateRange),
    }
  );

  const sheetsData: MonthlySheetResponse = monthlyData?.data || { 
    sheets: [], 
    totalSheets: 0, 
    totalRecords: 0, 
    summary: { totalIncome: 0, totalExpense: 0, totalCount: 0 }
  };

  // 获取当前显示的工作表数据
  const currentSheet = useMemo(() => {
    if (activeSheetTab === 'all') {
      return null; // 全部数据Tab显示所有工作表汇总
    }
    return sheetsData.sheets.find(sheet => sheet.name === activeSheetTab) || null;
  }, [activeSheetTab, sheetsData.sheets]);

  // 处理月份选择
  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const monthStr = date.format('YYYY-MM');
      setSelectedMonth(monthStr);
      setSearchParams({ month: monthStr });
    }
  };

  // 处理日期范围选择
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2 && dates[0] && dates[1]) {
      const rangeDates: [dayjs.Dayjs, dayjs.Dayjs] = [dates[0], dates[1]];
      setDateRange(rangeDates);
      const startMonth = dates[0].format('YYYY-MM');
      const endMonth = dates[1].format('YYYY-MM');
      setSearchParams({ 
        startMonth: startMonth, 
        endMonth: endMonth 
      });
    } else {
      setDateRange(null);
      setSearchParams({});
    }
  };

  // 处理日期模式切换
  const handleDateModeChange = (mode: 'single' | 'range') => {
    setDateMode(mode);
    setSearchParams({});
  };

  // 导出当前工作表数据
  const exportCurrentSheetData = () => {
    if (!currentSheet || currentSheet.data.length === 0) {
      message.warning('当前工作表没有数据可导出');
      return;
    }

    const exportData = currentSheet.data.map(row => {
      const exportRow: any = {};
      // 导出原始Excel列数据，排除内部字段
      Object.keys(row).forEach(key => {
        if (!key.startsWith('_')) {
          exportRow[key] = row[key];
        }
      });
      return exportRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, currentSheet.name);
    
    const fileName = dateMode === 'single' 
      ? `${selectedMonth}_${currentSheet.name}_表格数据.xlsx`
      : `${dateRange?.[0].format('YYYY-MM')}_至_${dateRange?.[1].format('YYYY-MM')}_${currentSheet.name}_表格数据.xlsx`;
    XLSX.writeFile(workbook, fileName);
    message.success('数据已导出');
  };

  // 导出全部数据
  const exportAllSheetsData = () => {
    if (sheetsData.sheets.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    const workbook = XLSX.utils.book_new();
    
    sheetsData.sheets.forEach(sheet => {
      const exportData = sheet.data.map(row => {
        const exportRow: any = {};
        Object.keys(row).forEach(key => {
          if (!key.startsWith('_')) {
            exportRow[key] = row[key];
          }
        });
        return exportRow;
      });
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });
    
    const fileName = dateMode === 'single' 
      ? `${selectedMonth}_全部表格数据.xlsx`
      : `${dateRange?.[0].format('YYYY-MM')}_至_${dateRange?.[1].format('YYYY-MM')}_全部表格数据.xlsx`;
    XLSX.writeFile(workbook, fileName);
    message.success('全部数据已导出');
  };

  // 智能截断文本，超过指定长度显示省略号
  const truncateText = (text: any, maxLength: number = 20) => {
    if (text === null || text === undefined) return '';
    const str = String(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };

  // 渲染带省略和Tooltip的文本
  const renderEllipsisText = (text: any, maxLength: number = 20) => {
    if (text === null || text === undefined) return '';
    const str = String(text);
    
    if (str.length <= maxLength) {
      return str;
    }

    return (
      <Tooltip title={str} placement="topLeft">
        <span style={{ cursor: 'pointer' }}>
          {truncateText(text, maxLength)}
        </span>
      </Tooltip>
    );
  };

  // 智能计算列宽度（收窄版本）
  const getColumnWidth = (title: string, dataIndex: string) => {
    const titleLower = (title || '').toLowerCase();
    const dataIndexLower = (dataIndex || '').toLowerCase();
    
    // 序号列（更窄）
    if (titleLower.includes('序号') || titleLower.includes('编号') || dataIndexLower.includes('index')) {
      return 60;
    }
    
    // 日期相关列（紧凑）
    if (titleLower.includes('日期') || titleLower.includes('时间') || dataIndexLower.includes('date') || dataIndexLower.includes('time')) {
      return 100;
    }
    
    // 金额相关列（紧凑）
    if (titleLower.includes('金额') || titleLower.includes('价格') || titleLower.includes('费用') || 
        dataIndexLower.includes('amount') || dataIndexLower.includes('price') || dataIndexLower.includes('money')) {
      return 100;
    }
    
    // 名称相关列（稍微收窄）
    if (titleLower.includes('名称') || titleLower.includes('姓名') || dataIndexLower.includes('name')) {
      return 120;
    }
    
    // 描述相关列（收窄但保持可读性）
    if (titleLower.includes('描述') || titleLower.includes('备注') || titleLower.includes('说明') || 
        dataIndexLower.includes('desc') || dataIndexLower.includes('remark') || dataIndexLower.includes('comment')) {
      return 150;
    }
    
    // 其他列默认宽度（收窄）
    return 120;
  };

  // 构建表格列（添加操作列）
  const buildTableColumns = (originalColumns: any[]): ColumnsType<any> => {
    // 处理原始列，添加省略和Tooltip功能
    const columns: ColumnsType<any> = originalColumns.map((col, index) => {
      const title = col.title || col.dataIndex || `列${index + 1}`;
      const dataIndex = col.dataIndex || col.key || `col_${index}`;
      
      return {
        title: title,
        dataIndex: dataIndex,
        key: col.key || dataIndex,
        width: col.width || getColumnWidth(title, dataIndex), // 智能计算宽度
        ellipsis: {
          showTitle: false, // 禁用默认的title，使用自定义Tooltip
        },
        render: (text: any) => renderEllipsisText(text, 15), // 超过15个字符省略，配合更窄列宽
      };
    });
    
    // 添加账单信息列
    columns.push({
      title: '账单信息',
      key: 'billInfo',
      width: 100, // 收窄账单信息列
      fixed: 'right', // 固定在右侧
      render: (_: any, record: any) => (
        <Space direction="vertical" size={2}>
          <Text style={{ color: record._billType === '收入' ? '#52c41a' : '#ff4d4f', fontSize: '12px' }}>
            {record._billType === '收入' ? '+' : '-'}¥{record._billAmount?.toLocaleString()}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {dayjs(record._billDate).format('MM-DD')}
          </Text>
        </Space>
      ),
    });

    return columns;
  };

  // 获取显示标题
  const getDisplayTitle = () => {
    if (dateMode === 'single') {
      return selectedMonth;
    } else if (dateMode === 'range' && dateRange) {
      return `${dateRange[0].format('YYYY-MM')} 至 ${dateRange[1].format('YYYY-MM')}`;
    }
    return '未选择日期';
  };

  return (
    <div>
      <Title level={2}>
        <TableOutlined /> 月份表格展示
      </Title>

      <Alert
        message="Excel原始结构展示"
        description="这里按照Excel原始表格结构展示导入的数据，每个Tab对应一个工作表，保持原有的表头和数据格式。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 日期选择和统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>日期选择模式</Text>
              <Radio.Group 
                value={dateMode} 
                onChange={(e) => handleDateModeChange(e.target.value)}
                style={{ width: '100%' }}
              >
                <Radio.Button value="single" style={{ width: '50%', textAlign: 'center' }}>
                  单月份
                </Radio.Button>
                <Radio.Button value="range" style={{ width: '50%', textAlign: 'center' }}>
                  日期范围
                </Radio.Button>
              </Radio.Group>
              
              {dateMode === 'single' ? (
                <MonthPicker
                  value={dayjs(selectedMonth)}
                  onChange={handleMonthChange}
                  format="YYYY-MM"
                  style={{ width: '100%' }}
                  placeholder="选择月份"
                />
              ) : (
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  picker="month"
                  format="YYYY-MM"
                  style={{ width: '100%' }}
                  placeholder={['开始月份', '结束月份']}
                />
              )}
            </Space>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="工作表数"
              value={sheetsData.totalSheets}
              suffix="个"
              prefix={<FolderOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="收入"
              value={sheetsData.summary.totalIncome}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="支出"
              value={sheetsData.summary.totalExpense}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="结余"
              value={sheetsData.summary.totalIncome - sheetsData.summary.totalExpense}
              precision={2}
              prefix="¥"
              valueStyle={{ 
                color: (sheetsData.summary.totalIncome - sheetsData.summary.totalExpense) >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Excel工作表展示 */}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            {`${getDisplayTitle()} 表格数据`}
            <Tag color="blue">{sheetsData.totalRecords} 条记录</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={currentSheet ? exportCurrentSheetData : exportAllSheetsData}
              disabled={sheetsData.totalRecords === 0}
            >
              导出{currentSheet ? '当前工作表' : '全部数据'}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/bills')}
            >
              账单管理
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => navigate('/excel-analysis')}
            >
              Excel分析
            </Button>
          </Space>
        }
      >
        {sheetsData.sheets.length > 0 ? (
          <Tabs
            activeKey={activeSheetTab}
            onChange={setActiveSheetTab}
            type="card"
            style={{ marginTop: 16 }}
          >
            {/* 全部数据汇总Tab */}
            <TabPane
              tab={
                <span>
                  <FolderOutlined />
                  全部数据
                  <Badge 
                    count={sheetsData.summary.totalCount} 
                    style={{ marginLeft: 8 }} 
                    showZero
                  />
                </span>
              }
              key="all"
            >
              <div style={{ marginBottom: 16 }}>
                <Alert
                  message="数据汇总"
                  description={`共有 ${sheetsData.totalSheets} 个工作表，总计 ${sheetsData.summary.totalCount} 条记录。点击下方的工作表Tab查看具体数据。`}
                  type="info"
                  showIcon
                />
              </div>
              
              <Row gutter={16}>
                {sheetsData.sheets.map((sheet, index) => (
                  <Col span={8} key={sheet.name} style={{ marginBottom: 16 }}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <FileExcelOutlined />
                          <Text strong>{sheet.name}</Text>
                        </Space>
                      }
                      extra={
                        <Tooltip title="点击查看详细数据">
                          <Button 
                            type="link" 
                            size="small"
                            onClick={() => setActiveSheetTab(sheet.name)}
                          >
                            查看详情
                          </Button>
                        </Tooltip>
                      }
                    >
                      <Row gutter={8}>
                        <Col span={12}>
                          <Statistic
                            title="记录数"
                            value={sheet.count}
                            suffix="条"
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="结余"
                            value={sheet.totalIncome - sheet.totalExpense}
                            prefix="¥"
                            precision={0}
                            valueStyle={{ 
                              fontSize: 14,
                              color: (sheet.totalIncome - sheet.totalExpense) >= 0 ? '#3f8600' : '#cf1322' 
                            }}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))}
              </Row>
            </TabPane>

            {/* 各个工作表Tab */}
            {sheetsData.sheets.map((sheet) => (
              <TabPane
                tab={
                  <span>
                    <FileExcelOutlined />
                    {sheet.name}
                    <Badge 
                      count={sheet.count} 
                      style={{ marginLeft: 8 }} 
                      showZero
                    />
                  </span>
                }
                key={sheet.name}
              >
                <div style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="收入"
                        value={sheet.totalIncome}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="支出"
                        value={sheet.totalExpense}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="结余"
                        value={sheet.totalIncome - sheet.totalExpense}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ 
                          color: (sheet.totalIncome - sheet.totalExpense) >= 0 ? '#3f8600' : '#cf1322' 
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="记录数"
                        value={sheet.count}
                        suffix="条"
                      />
                    </Col>
                  </Row>
                </div>

                {/* Excel原始结构表格 */}
                <Table
                  columns={buildTableColumns(sheet.columns)}
                  dataSource={sheet.data.map((row, index) => ({ ...row, key: index }))}
                  bordered
                  loading={isLoading}
                  scroll={{ x: 1000, y: 600 }} // 收窄后调整水平滚动宽度
                  pagination={{
                    total: sheet.data.length,
                    pageSize: 50,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                  }}
                  size="small"
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={sheet.columns.length}>
                          <Text strong>{sheet.name} 合计</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <Text strong style={{ color: (sheet.totalIncome - sheet.totalExpense) >= 0 ? '#3f8600' : '#cf1322' }}>
                            结余: ¥{(sheet.totalIncome - sheet.totalExpense).toLocaleString()}
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </TabPane>
            ))}
          </Tabs>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`${getDisplayTitle()} 暂无表格数据`}
            style={{ padding: '48px 0' }}
          >
            <Space>
              <Button type="primary" onClick={() => navigate('/excel-analysis')}>
                导入Excel数据
              </Button>
              <Button onClick={() => navigate('/bills')}>
                手动添加账单
              </Button>
            </Space>
          </Empty>
        )}
      </Card>
    </div>
  );
};

export default TableBillDisplay; 