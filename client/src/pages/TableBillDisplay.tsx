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

import { tableDataAPI, billAPI } from '../services/api';

const { Title, Text } = Typography;
const { MonthPicker, RangePicker } = DatePicker;
const { TabPane } = Tabs;

// 自定义样式
const tableStyles = `
  .compact-table {
    width: 100% !important;
  }
  .compact-table .ant-table {
    width: 100% !important;
    table-layout: fixed !important;
  }
  .compact-table .ant-table-thead > tr > th {
    padding: 8px 12px !important;
    font-size: 12px !important;
    text-align: center !important;
    word-wrap: break-word !important;
    overflow: hidden !important;
  }
  .compact-table .ant-table-tbody > tr > td {
    padding: 8px 12px !important;
    font-size: 11px !important;
    word-wrap: break-word !important;
    line-height: 1.4 !important;
    overflow: hidden !important;
  }
  .compact-table .ant-table-cell {
    border-right: 1px solid #f0f0f0 !important;
  }
  .compact-table .ant-table-summary > tr > td {
    padding: 8px 12px !important;
    font-size: 12px !important;
    font-weight: bold !important;
  }
  .compact-table .ant-table-container {
    width: 100% !important;
  }
  .compact-table .ant-table-content {
    width: 100% !important;
  }
  .compact-table .ant-table-body {
    width: 100% !important;
  }
`;

// 注入样式（避免重复添加）
if (typeof document !== 'undefined' && !document.getElementById('compact-table-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'compact-table-styles';
  styleElement.textContent = tableStyles;
  document.head.appendChild(styleElement);
}

// 工作表数据接口
interface ExcelSheetData {
  name: string;
  data: any[];
  columns?: any[];  // 可选，向后兼容
  headers?: any[];  // 可选，实际API返回的字段
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
    const initial = monthParam || dayjs().format('YYYY-MM');
    console.log('🎯 初始化月份:', initial);
    return initial;
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [activeSheetTab, setActiveSheetTab] = useState<string>('all');

  // 调试：监听状态变化
  React.useEffect(() => {
    console.log('📊 状态变化:', { dateMode, selectedMonth, dateRange });
  }, [dateMode, selectedMonth, dateRange]);

  // 构建稳定的查询键
  const queryKey = React.useMemo(() => {
    if (dateMode === 'single') {
      return ['monthlyTableData', 'single', selectedMonth];
    } else if (dateMode === 'range' && dateRange) {
      return ['monthlyTableData', 'range', dateRange.map(d => d.format('YYYY-MM')).join('-')];
    }
    return ['monthlyTableData', 'none'];
  }, [dateMode, selectedMonth, dateRange]);

  // 获取月份表格数据
  const { data: monthlyData, isLoading, refetch } = useQuery(
    queryKey,
    async () => {
      console.log('🔄 React Query 执行中...', { dateMode, selectedMonth, dateRange });
      
      if (dateMode === 'single') {
        const [year, month] = selectedMonth.split('-');
        const apiParams = {
          month: month,
          year: parseInt(year),
        };
        console.log('📤 API 调用参数 (tableDataAPI):', apiParams);
        
        return tableDataAPI.getMonthlyTableData(apiParams);
      } else if (dateMode === 'range' && dateRange) {
        const apiParams = {
          startDate: dateRange[0].startOf('month').toISOString(),
          endDate: dateRange[1].endOf('month').toISOString(),
        };
        console.log('📤 API 调用参数 (tableDataAPI):', apiParams);
        
        return tableDataAPI.getMonthlyTableData(apiParams);
      }
      
      console.log('⚠️ 没有有效的查询参数');
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
      refetchOnWindowFocus: false, // 防止窗口切换时重复请求
      staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的
    }
  );

  // 安全地提取数据，确保sheets始终是数组
  const sheetsData: MonthlySheetResponse = React.useMemo(() => {
    const defaultData = { 
      sheets: [], 
      totalSheets: 0, 
      totalRecords: 0, 
      summary: { totalIncome: 0, totalExpense: 0, totalCount: 0 }
    };
    
    if (!monthlyData?.data) {
      console.log('⚠️ API数据为空:', monthlyData);
      return defaultData;
    }
    
    const apiData = monthlyData.data;
    console.log('📊 API返回数据结构:', { 
      hasSheets: !!apiData.sheets, 
      sheetsLength: Array.isArray(apiData.sheets) ? apiData.sheets.length : 'not array',
      totalSheets: apiData.totalSheets 
    });
    
    return {
      sheets: Array.isArray(apiData.sheets) ? apiData.sheets : [],
      totalSheets: apiData.totalSheets || 0,
      totalRecords: apiData.totalRecords || 0,
      summary: apiData.summary || { totalIncome: 0, totalExpense: 0, totalCount: 0 }
    };
  }, [monthlyData]);

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
      console.log('📅 月份切换:', { 
        oldMonth: selectedMonth, 
        newMonth: monthStr, 
        dateMode,
        queryKey: ['monthlyTableData', dateMode, monthStr, null]
      });
      
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
      return 50;
    }
    
    // 日期相关列（紧凑）
    if (titleLower.includes('日期') || titleLower.includes('时间') || dataIndexLower.includes('date') || dataIndexLower.includes('time')) {
      return 80;
    }
    
    // 金额相关列（紧凑）
    if (titleLower.includes('金额') || titleLower.includes('价格') || titleLower.includes('费用') || titleLower.includes('单价') || titleLower.includes('合价') ||
        dataIndexLower.includes('amount') || dataIndexLower.includes('price') || dataIndexLower.includes('money')) {
      return 80;
    }
    
    // 数量、单位相关列（很窄）
    if (titleLower.includes('数量') || titleLower.includes('单位') || titleLower.includes('记录数') ||
        dataIndexLower.includes('quantity') || dataIndexLower.includes('unit') || dataIndexLower.includes('count')) {
      return 60;
    }
    
    // 名称相关列（适中）
    if (titleLower.includes('名称') || titleLower.includes('姓名') || titleLower.includes('品牌') || 
        dataIndexLower.includes('name') || dataIndexLower.includes('brand')) {
      return 100;
    }
    
    // 规格、型号相关列（适中）
    if (titleLower.includes('规格') || titleLower.includes('型号') || titleLower.includes('规格') ||
        dataIndexLower.includes('spec') || dataIndexLower.includes('model')) {
      return 120;
    }
    
    // 描述相关列（收窄但保持可读性）
    if (titleLower.includes('描述') || titleLower.includes('备注') || titleLower.includes('说明') || 
        dataIndexLower.includes('desc') || dataIndexLower.includes('remark') || dataIndexLower.includes('comment')) {
      return 120;
    }
    
    // 其他列默认宽度（更紧凑）
    return 90;
  };

  // 构建表格列（添加操作列）
  const buildTableColumns = (originalColumns: any[]): ColumnsType<any> => {
    // 安全检查：确保originalColumns是数组
    if (!Array.isArray(originalColumns)) {
      console.warn('⚠️ buildTableColumns: originalColumns不是数组:', originalColumns);
      return [];
    }
    
    // 处理原始列，添加省略和Tooltip功能
    const columns: ColumnsType<any> = originalColumns.map((col, index) => {
      const title = col.title || col.dataIndex || `列${index + 1}`;
      const dataIndex = col.dataIndex || col.key || `col_${index}`;
      const titleLower = (title || '').toLowerCase();
      
      // 根据列类型设置不同的宽度权重
      let width;
      if (titleLower.includes('序号') || titleLower.includes('编号')) {
        width = '8%';  // 序号列较窄
      } else if (titleLower.includes('数量') || titleLower.includes('单位')) {
        width = '10%'; // 数量单位列
      } else if (titleLower.includes('单价') || titleLower.includes('合价') || titleLower.includes('金额')) {
        width = '12%'; // 金额列
      } else if (titleLower.includes('名称')) {
        width = '20%'; // 名称列较宽
      } else if (titleLower.includes('规格') || titleLower.includes('品牌')) {
        width = '25%'; // 规格品牌列最宽
      } else {
        width = '15%'; // 其他列默认宽度
      }
      
      return {
        title: title,
        dataIndex: dataIndex,
        key: col.key || dataIndex,
        width: width, // 使用百分比宽度
        ellipsis: {
          showTitle: false, // 禁用默认的title，使用自定义Tooltip
        },
        render: (text: any) => renderEllipsisText(text, 25), // 进一步增加显示字符数
      };
    });
    
    // 添加账单信息列
    columns.push({
      title: '账单信息',
      key: 'billInfo',
      width: '10%',  // 使用百分比宽度
      fixed: 'right', // 固定在右侧
      render: (_: any, record: any) => (
        <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
          <div style={{ 
            color: record._billType === '收入' ? '#52c41a' : '#ff4d4f', 
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {record._billType === '收入' ? '+' : '-'}¥{record._billAmount?.toLocaleString()}
          </div>
          <div style={{ 
            color: '#999', 
            fontSize: '10px',
            marginTop: '2px'
          }}>
            {dayjs(record._billDate).format('MM-DD')}
          </div>
        </div>
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

      {/* <Alert
        message="Excel原始结构展示"
        description="这里按照Excel原始表格结构展示导入的数据，每个Tab对应一个工作表，保持原有的表头和数据格式。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      /> */}

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
                        {/* <Col span={12}>
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
                        </Col> */}
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
                <div style={{ 
                  width: '100%',         // 使用100%宽度
                  overflow: 'auto',      // 允许滚动
                  borderRadius: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  <Table
                    className="compact-table"  // 添加紧凑样式
                    columns={buildTableColumns(sheet.columns || sheet.headers || [])}
                    dataSource={Array.isArray(sheet.data) ? sheet.data.map((row, index) => ({ ...row, key: index })) : []}
                    bordered
                    loading={isLoading}
                    scroll={{ 
                      x: '100%',         // 表格宽度100%，充满容器
                      y: 450             // 适当降低高度
                    }}
                    pagination={{
                      total: Array.isArray(sheet.data) ? sheet.data.length : 0,
                      pageSize: 20,      // 减少每页显示条数
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => 
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                      pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    size="small"
                    tableLayout="fixed"   // 固定布局，让列宽平均分配
                    summary={() => (
                      <Table.Summary>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={Math.max((sheet.columns || sheet.headers || []).length - 1, 1)}>
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
                </div>
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