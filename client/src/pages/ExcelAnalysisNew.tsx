/**
 * Excel数据分析页面 - 多工作表版本
 * 功能：上传Excel文件，支持多个工作表切换，每个工作表可独立编辑和分析
 */
import React, { useState, useMemo } from 'react';
import {
  Card,
  Upload,
  Table,
  Button,
  Space,
  Select,
  Statistic,
  Row,
  Col,
  message,
  Divider,
  Tag,
  Typography,
  Alert,
  Empty,
  Input,
  Popconfirm,
  Form,
  Tabs,
  Tooltip,
  Modal,
} from 'antd';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToHorizontalAxis,
} from '@dnd-kit/modifiers';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  InboxOutlined,
  CalculatorOutlined,
  DownloadOutlined,
  ClearOutlined,
  FileExcelOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  EyeOutlined,
  ToolOutlined,
  TableOutlined,
  FunctionOutlined,
  DragOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import type { UploadProps, TableColumnType } from 'antd';
import { billAPI, tableDataAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Dragger } = Upload;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

// 可拖拽的行组件
const DraggableRow: React.FC<any> = ({ index, record, ...restProps }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: record?.key,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...restProps}
      {...attributes}
      {...listeners}
      className={`${restProps.className || ''} ${isDragging ? 'sortable-chosen' : ''}`}
    >
      {restProps.children}
    </tr>
  );
};

interface ExcelData {
  [key: string]: any;
}

interface ColumnStat {
  column: string;
  sum?: number;
  avg?: number;
  max?: number;
  min?: number;
  count?: number;
  nonEmptyCount?: number;
}

interface SheetData {
  name: string;
  data: ExcelData[];
  editingData: ExcelData[];
  columns: TableColumnType<ExcelData>[];
  editableColumns: TableColumnType<ExcelData>[];
  hasChanges: boolean;
}

const ExcelAnalysisNew: React.FC = () => {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnStats, setColumnStats] = useState<ColumnStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string>('');
  const [form] = Form.useForm();
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [calculateForm] = Form.useForm();
  const [calculatedColumns, setCalculatedColumns] = useState<{
    [columnName: string]: {
      column1: string;
      column2: string;
      operation: string;
    }
  }>({});
  const [showBillGenerateModal, setShowBillGenerateModal] = useState(false);
  const [billGenerateForm] = Form.useForm();
  const [billGenerateLoading, setBillGenerateLoading] = useState(false);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 获取当前活动工作表的数据
  const currentSheet = sheets[activeSheetIndex];
  const { data = [], editingData = [], columns = [], editableColumns = [], hasChanges = false } = currentSheet || {};

  // 检查是否正在编辑
  const isEditing = (record: ExcelData) => {
    const result = record.key === editingKey;
    console.log('检查编辑状态:', record.key, editingKey, result);
    return result;
  };

  // 更新当前工作表数据
  const updateCurrentSheet = (updates: Partial<SheetData>) => {
    if (activeSheetIndex >= 0 && activeSheetIndex < sheets.length) {
      const newSheets = [...sheets];
      newSheets[activeSheetIndex] = { ...newSheets[activeSheetIndex], ...updates };
      setSheets(newSheets);
    }
  };

  // 开始编辑行
  const edit = (record: ExcelData) => {
    // 创建一个干净的对象，排除key和action字段
    const formData: { [key: string]: any } = {};
    Object.keys(record).forEach(key => {
      if (key !== 'key' && key !== 'action') {
        formData[key] = record[key];
      }
    });
    
    form.setFieldsValue(formData);
    setEditingKey(record.key);
    console.log('开始编辑:', record.key, formData);
  };

  // 取消编辑
  const cancel = () => {
    setEditingKey('');
  };

  // 重新计算指定行的所有计算列
  const recalculateRow = (rowData: ExcelData) => {
    let updatedRow = { ...rowData };
    
    Object.entries(calculatedColumns).forEach(([resultColumn, formula]) => {
      const val1 = parseFloat(updatedRow[formula.column1]) || 0;
      const val2 = parseFloat(updatedRow[formula.column2]) || 0;
      let result = 0;

      switch (formula.operation) {
        case 'add':
          result = val1 + val2;
          break;
        case 'subtract':
          result = val1 - val2;
          break;
        case 'multiply':
          result = val1 * val2;
          break;
        case 'divide':
          result = val2 !== 0 ? val1 / val2 : 0;
          break;
        default:
          result = 0;
      }

      updatedRow[resultColumn] = Math.round(result * 100) / 100;
    });
    
    return updatedRow;
  };

  // 保存编辑
  const save = async (key: string) => {
    try {
      const row = await form.validateFields();
      console.log('保存数据:', key, row);
      
      const newData = [...editingData];
      const index = newData.findIndex((item) => key === item.key);
      
      if (index > -1) {
        const item = newData[index];
        let updatedItem = { ...item, ...row };
        
        // 重新计算该行的所有计算列
        updatedItem = recalculateRow(updatedItem);
        
        newData.splice(index, 1, updatedItem);
        
        console.log('更新后的数据:', updatedItem);
        updateCurrentSheet({ editingData: newData, hasChanges: true });
        setEditingKey('');
        message.success('保存成功');
      } else {
        console.error('找不到要更新的行:', key);
        message.error('保存失败：找不到要更新的行');
      }
    } catch (errInfo) {
      console.log('验证失败:', errInfo);
      message.error('请检查输入数据格式');
    }
  };

  // 添加新行
  const addRow = () => {
    const newRowKey = Date.now().toString();
    let newRow: ExcelData = { key: newRowKey };
    
    // 根据现有列初始化新行数据
    if (editableColumns.length > 0) {
      editableColumns.forEach(col => {
        const colKey = col.dataIndex as string;
        if (colKey !== 'key' && colKey !== 'action') {
          newRow[colKey] = '';
        }
      });
    }

    // 计算新行的计算列值（初始为0，因为其他列都是空的）
    newRow = recalculateRow(newRow);

    const newData = [...editingData, newRow];
    updateCurrentSheet({ editingData: newData, hasChanges: true });
    message.success('已添加新行');
  };

  // 删除行
  const deleteRow = (key: string) => {
    const newEditingData = editingData.filter(item => item.key !== key);
    updateCurrentSheet({ editingData: newEditingData, hasChanges: true });
    message.success('删除成功');
  };

  // 动态创建可编辑列定义，确保能正确访问当前的editingKey状态
  const dynamicEditableColumns = useMemo(() => {
    if (!editableColumns || editableColumns.length === 0) return [];
    
    // 添加拖拽手柄列
    const dragColumn = {
      title: '',
      dataIndex: 'drag',
      key: 'drag',
      width: 40,
      className: 'drag-column',
      render: () => (
        <div
          className="drag-handle"
          style={{ 
            cursor: 'move', 
            textAlign: 'center',
            color: '#999',
            fontSize: '16px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}
          title="拖拽调整行顺序"
        >
          <DragOutlined />
        </div>
      ),
    };

    const columnsWithDrag = [dragColumn, ...editableColumns];

    return columnsWithDrag.map((col) => {
      if (col.dataIndex === 'action') {
        // 操作列
        return {
          ...col,
          render: (_: any, record: ExcelData) => {
            const editing = isEditing(record);
            return editing ? (
              <Space size="small">
                <Button
                  type="link"
                  onClick={() => save(record.key)}
                  size="small"
                  icon={<SaveOutlined />}
                >
                  保存
                </Button>
                <Button
                  type="link"
                  onClick={cancel}
                  size="small"
                >
                  取消
                </Button>
              </Space>
            ) : (
              <Space size="small">
                <Button
                  type="link"
                  disabled={editingKey !== ''}
                  onClick={() => edit(record)}
                  size="small"
                  icon={<EditOutlined />}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除这行数据吗？"
                  onConfirm={() => deleteRow(record.key)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="link"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            );
          },
        };
      } else {
        // 数据列
        const header = col.title as string;
        const headerStr = String(header).toLowerCase().trim();
        const isSequenceColumn = 
          headerStr === '序号' || 
          headerStr === '序' || 
          headerStr === 'no' || 
          headerStr === 'no.' ||
          headerStr === 'id' || 
          headerStr === '编号' ||
          headerStr === '行号' ||
          headerStr.includes('序号') ||
          headerStr.includes('编号') ||
          (headerStr.length <= 3 && /^(序|no|id|\d+)/.test(headerStr));

        return {
          ...col,
          render: (text: any, record: ExcelData) => {
            const editing = isEditing(record);
            const isCalculatedColumn = calculatedColumns[header]; // 检查是否为计算列
            
            console.log(`渲染列 "${header}":`, {
              recordKey: record.key,
              editingKey,
              isEditing: editing,
              isCalculated: !!isCalculatedColumn,
              text: text
            });
            
            // 计算列不可编辑，直接显示内容
            if (isCalculatedColumn) {
              if (text === null || text === undefined || text === '') {
                return <Text type="secondary">-</Text>;
              }
              
              const num = parseFloat(text);
              if (!isNaN(num) && isFinite(num)) {
                return (
                  <Text style={{ fontWeight: 500, color: '#1890ff' }}>
                    {num.toLocaleString()}
                  </Text>
                );
              }
              
              return <Text style={{ color: '#1890ff' }}>{text}</Text>;
            }
            
            if (editing) {
              return (
                <Form.Item
                  name={header}
                  style={{ margin: 0 }}
                  rules={[]}
                >
                  <Input 
                    style={{ textAlign: isSequenceColumn ? 'center' : 'left' }}
                    placeholder="请输入内容"
                  />
                </Form.Item>
              );
            } else {
              if (text === null || text === undefined || text === '') {
                return <Text type="secondary">-</Text>;
              }
              
              const displayText = String(text);
              
              // 序号列不需要tooltip，直接显示，居中对齐
              if (isSequenceColumn) {
                return <Text style={{ fontWeight: 500 }}>{displayText}</Text>;
              }
              
              const needTooltip = displayText.length > 15;
              
              const content = (
                <div 
                  style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                >
                  {displayText}
                </div>
              );
              
              return needTooltip ? (
                <Tooltip title={displayText} placement="topLeft">
                  {content}
                </Tooltip>
              ) : content;
            }
          },
        };
      }
    });
  }, [editableColumns, editingKey, isEditing, edit, save, cancel, deleteRow, calculatedColumns]);

  // 处理行拖拽排序
  const handleRowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = editingData.findIndex((item) => item.key === active.id);
      const newIndex = editingData.findIndex((item) => item.key === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newData = arrayMove(editingData, oldIndex, newIndex);
        updateCurrentSheet({ editingData: newData, hasChanges: true });
        message.success('行顺序已调整');
      }
    }
  };

  // 处理列拖拽排序
  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = dynamicEditableColumns.findIndex((col) => col.key === active.id);
      const newIndex = dynamicEditableColumns.findIndex((col) => col.key === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // 不允许移动操作列
        const activeCol = dynamicEditableColumns[oldIndex];
        const overCol = dynamicEditableColumns[newIndex];
        
        if (activeCol.dataIndex === 'action' || overCol.dataIndex === 'action') {
          message.warning('操作列不能移动');
          return;
        }
        
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        const newEditableColumns = arrayMove(editableColumns, oldIndex, newIndex);
        
        updateCurrentSheet({ 
          columns: newColumns,
          editableColumns: newEditableColumns,
          hasChanges: true 
        });
        message.success('列顺序已调整');
      }
    }
  };

  // 添加新列
  const addColumn = () => {
    if (!newColumnName.trim()) {
      message.warning('请输入列名');
      return;
    }

    if (columns.some(col => col.title === newColumnName.trim())) {
      message.error('列名已存在');
      return;
    }

    const columnName = newColumnName.trim();
    
    // 为所有现有数据添加新列，默认值为空
    const newEditingData = editingData.map(row => ({
      ...row,
      [columnName]: ''
    }));

    // 创建新的列定义
    const newColumn = {
      title: columnName,
      dataIndex: columnName,
      key: columnName,
      width: 150,
      ellipsis: true,
      sorter: (a: ExcelData, b: ExcelData) => {
        const aVal = a[columnName];
        const bVal = b[columnName];
        
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        return String(aVal || '').localeCompare(String(bVal || ''));
      },
      render: (text: any) => {
        if (text === null || text === undefined || text === '') {
          return <Text type="secondary">-</Text>;
        }
        
        const displayText = String(text);
        const needTooltip = displayText.length > 15;
        
        const content = (
          <div 
            style={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}
          >
            {displayText}
          </div>
        );
        
        return needTooltip ? (
          <Tooltip title={displayText} placement="topLeft">
            {content}
          </Tooltip>
        ) : content;
      },
    };

    // 创建新的可编辑列定义
    const newEditableColumn = {
      ...newColumn,
      render: (text: any, record: ExcelData) => {
        const editing = isEditing(record);
        console.log(`渲染列 "${newColumn.title}":`, {
          recordKey: record.key,
          editingKey,
          isEditing: editing,
          text: text
        });
        
        if (editing) {
          return (
            <Form.Item
              name={newColumn.title}
              style={{ margin: 0 }}
              rules={[]}
            >
              <Input 
                                 style={{ textAlign: columnName.toLowerCase().includes('序号') || columnName.toLowerCase().includes('no') ? 'center' : 'left' }}
                placeholder="请输入内容"
              />
            </Form.Item>
          );
        } else {
          if (text === null || text === undefined || text === '') {
            return <Text type="secondary">-</Text>;
          }
          
          const displayText = String(text);
          
                     // 序号列不需要tooltip，直接显示，居中对齐
           if (columnName.toLowerCase().includes('序号') || columnName.toLowerCase().includes('no')) {
             return <Text style={{ fontWeight: 500 }}>{displayText}</Text>;
           }
          
          const needTooltip = displayText.length > 15;
          
          const content = (
            <div 
              style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              {displayText}
            </div>
          );
          
          return needTooltip ? (
            <Tooltip title={displayText} placement="topLeft">
              {content}
            </Tooltip>
          ) : content;
        }
      },
    };

    // 更新列定义（在操作列之前插入）
    const newColumns = [...columns, newColumn];
    const newEditableColumns = [...editableColumns.slice(0, -1), newEditableColumn, editableColumns[editableColumns.length - 1]];

    updateCurrentSheet({ 
      editingData: newEditingData,
      columns: newColumns,
      editableColumns: newEditableColumns,
      hasChanges: true 
    });

    setNewColumnName('');
    setShowAddColumnModal(false);
    message.success(`已添加列："${columnName}"`);
  };

  // 计算列功能
  const calculateColumn = async () => {
    try {
      const values = await calculateForm.validateFields();
      const { resultColumnName, operation, column1, column2 } = values;

      // 检查结果列名是否已存在
      if (columns.some(col => col.title === resultColumnName)) {
        message.error('结果列名已存在');
        return;
      }

      // 为所有现有数据添加计算结果列
      const newEditingData = editingData.map((row, index) => {
        const val1 = parseFloat(row[column1]) || 0;
        const val2 = parseFloat(row[column2]) || 0;
        let result = 0;

        switch (operation) {
          case 'add':
            result = val1 + val2;
            break;
          case 'subtract':
            result = val1 - val2;
            break;
          case 'multiply':
            result = val1 * val2;
            break;
          case 'divide':
            result = val2 !== 0 ? val1 / val2 : 0;
            break;
          default:
            result = 0;
        }

        const finalResult = Math.round(result * 100) / 100; // 保留两位小数
        
        // 调试信息
        if (index < 3) {
          console.log(`计算第${index + 1}行:`, {
            [column1]: val1,
            operation,
            [column2]: val2,
            result: finalResult
          });
        }

        return {
          ...row,
          [resultColumnName]: finalResult
        };
      });
      
      console.log('计算完成，新数据行数:', newEditingData.length);
      console.log('新列名:', resultColumnName);

      // 创建新的列定义
      const newColumn = {
        title: (
          <span>
            <FunctionOutlined style={{ color: '#1890ff', marginRight: 4 }} />
            {resultColumnName}
          </span>
        ),
        dataIndex: resultColumnName,
        key: resultColumnName,
        width: 120,
        ellipsis: true,
        sorter: (a: ExcelData, b: ExcelData) => {
          const aVal = parseFloat(a[resultColumnName]) || 0;
          const bVal = parseFloat(b[resultColumnName]) || 0;
          return aVal - bVal;
        },
        render: (text: any) => {
          if (text === null || text === undefined || text === '') {
            return <Text type="secondary">-</Text>;
          }
          
          const num = parseFloat(text);
          if (!isNaN(num) && isFinite(num)) {
            return <Text style={{ fontWeight: 500, color: '#1890ff' }}>{num.toLocaleString()}</Text>;
          }
          
          return <Text style={{ color: '#1890ff' }}>{text}</Text>;
        },
      };

      // 更新列定义（在操作列之前插入）
      const newColumns = [...columns, newColumn];
      
      // 同时更新可编辑列定义（在操作列之前插入）
      const newEditableColumn = {
        ...newColumn,
        // 可编辑列的render函数会在dynamicEditableColumns中动态生成
      };
      
      // 找到操作列的位置
      const actionColumnIndex = editableColumns.findIndex(col => col.dataIndex === 'action');
      let newEditableColumns;
      
      if (actionColumnIndex >= 0) {
        // 在操作列之前插入新列
        newEditableColumns = [
          ...editableColumns.slice(0, actionColumnIndex),
          newEditableColumn,
          ...editableColumns.slice(actionColumnIndex)
        ];
      } else {
        // 如果没有操作列，直接添加到最后
        newEditableColumns = [...editableColumns, newEditableColumn];
      }

      // 保存计算公式
      setCalculatedColumns(prev => ({
        ...prev,
        [resultColumnName]: {
          column1,
          column2,
          operation
        }
      }));

      updateCurrentSheet({ 
        editingData: newEditingData,
        columns: newColumns,
        editableColumns: newEditableColumns,
        hasChanges: true 
      });

      calculateForm.resetFields();
      setShowCalculateModal(false);
      message.success(`已添加计算列："${resultColumnName}"，将自动根据相关列的变化重新计算`);
    } catch (error) {
      console.error('计算列失败:', error);
      message.error('请检查输入信息');
    }
  };

  // 获取数值类型的列
  const getNumericColumns = () => {
    if (!editingData || editingData.length === 0) return [];
    
    return columns
      .filter(col => col.dataIndex !== 'action' && col.title)
      .filter(col => {
        // 检查该列是否为纯数值列
        const allValues = editingData.map(row => row[col.dataIndex as string]);
        const nonEmptyValues = allValues.filter(val => 
          val !== null && val !== undefined && val !== ''
        );
        
        // 如果没有非空值，跳过
        if (nonEmptyValues.length === 0) return false;
        
        // 检查所有非空值是否都是数值
        const numericValues = nonEmptyValues.filter(val => {
          const num = parseFloat(String(val));
          return !isNaN(num) && isFinite(num);
        });
        
        // 至少80%的非空值是数值才认为是数值列
        const numericRatio = numericValues.length / nonEmptyValues.length;
        return numericRatio >= 0.8;
      })
      .map(col => ({
        label: col.title as string,
        value: col.dataIndex as string,
      }));
  };

  // 保存所有修改
  const saveAllChanges = () => {
    updateCurrentSheet({ data: [...editingData], hasChanges: false });
    message.success('所有修改已保存');
  };

  // 重置修改
  const resetChanges = () => {
    updateCurrentSheet({ editingData: [...data], hasChanges: false });
    setEditingKey('');
    message.success('已重置所有修改');
  };

  // 导出工作区数据
  const exportWorkspaceData = () => {
    if (!currentSheet || currentSheet.editingData.length === 0) {
      message.warning('没有可导出的工作区数据');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(currentSheet.editingData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '工作区数据');
    
    const fileName = `工作区数据_${currentSheet.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    message.success('工作区数据已导出');
  };

  // 计算列的合适宽度
  const calculateColumnWidth = (header: string, data: ExcelData[]): number => {
    const headerStr = String(header).toLowerCase().trim();
    
    // 序号列特殊处理 - 更严格的识别条件
    const isSequenceColumn = 
      headerStr === '序号' || 
      headerStr === '序' || 
      headerStr === 'no' || 
      headerStr === 'no.' ||
      headerStr === 'id' || 
      headerStr === '编号' ||
      headerStr === '行号' ||
      headerStr.includes('序号') ||
      headerStr.includes('编号') ||
      (headerStr.length <= 3 && /^(序|no|id|\d+)/.test(headerStr)) ||
      // 检查数据是否为连续数字序列
      (data.length > 0 && data.every((row, index) => {
        const val = row[header];
        return val !== null && val !== undefined && 
               (Number(val) === index + 1 || String(val).trim() === String(index + 1));
      }));
    
    if (isSequenceColumn) {
      return 60; // 序号列设置为60px
    }

    // 基于表头长度计算最小宽度
    const headerWidth = header.length * 14 + 50; // 稍微减少padding
    
    // 基于数据内容计算宽度
    let maxDataLength = 0;
    data.forEach(row => {
      const cellValue = row[header];
      if (cellValue !== null && cellValue !== undefined) {
        const valueLength = String(cellValue).length;
        maxDataLength = Math.max(maxDataLength, valueLength);
      }
    });
    
    const dataWidth = maxDataLength * 12 + 50; // 减少padding
    
    // 取较大值
    const calculatedWidth = Math.max(headerWidth, dataWidth);
    
    // 根据列类型设置不同的宽度范围
    if (header.includes('名称') || header.includes('描述') || header.includes('备注') || header.includes('说明') || header.includes('品牌') || header.includes('规格')) {
      // 文本类列：120-350px
      return Math.min(Math.max(calculatedWidth, 120), 350);
    } else if (header.includes('数量') || header.includes('价格') || header.includes('金额') || header.includes('单价') || header.includes('总计')) {
      // 数值类列：80-150px
      return Math.min(Math.max(calculatedWidth, 80), 150);
    } else if (header.includes('日期') || header.includes('时间')) {
      // 日期类列：100-160px
      return Math.min(Math.max(calculatedWidth, 100), 160);
    } else if (header.includes('单位')) {
      // 单位列：60-100px
      return Math.min(Math.max(calculatedWidth, 60), 100);
    } else {
      // 其他列：80-250px
      return Math.min(Math.max(calculatedWidth, 80), 250);
    }
  };

  // 解析单个工作表
  const parseSheet = (worksheet: XLSX.WorkSheet, sheetName: string): SheetData => {
    // 转换为JSON数据
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      return {
        name: sheetName,
        data: [],
        editingData: [],
        columns: [],
        editableColumns: [],
        hasChanges: false,
      };
    }

    // 智能识别表头行
    let headerRowIndex = 0;
    let headers: string[] = [];
    
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      const row = jsonData[i] as any[];
      const nonEmptyCells = row.filter(cell => 
        cell !== null && cell !== undefined && cell !== '' && typeof cell === 'string'
      );
      
      if (nonEmptyCells.length >= 2) {
        headers = row;
        headerRowIndex = i;
        break;
      }
    }

    if (headers.length === 0) {
      headers = jsonData[0] as string[];
      headerRowIndex = 0;
    }

    const rows = jsonData.slice(headerRowIndex + 1) as any[][];

    // 过滤并清理表头
    const validHeaders = headers
      .map(header => {
        if (header === null || header === undefined) return '';
        return String(header).trim();
      })
      .filter(header => header !== '');

    // 构建数据对象
    const tableData: ExcelData[] = rows
      .filter(row => {
        if (!row || row.length === 0) return false;
        const nonEmptyCount = row.filter(cell => 
          cell !== null && cell !== undefined && cell !== ''
        ).length;
        return nonEmptyCount > 0;
      })
      .map((row, index) => {
        const rowData: ExcelData = { key: index.toString() };
        
        validHeaders.forEach((header, headerIndex) => {
          const cellValue = row[headerIndex];
          
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            if (typeof cellValue === 'number') {
              rowData[header] = cellValue;
            } else if (cellValue instanceof Date) {
              rowData[header] = cellValue.toLocaleDateString();
            } else {
              rowData[header] = String(cellValue).trim();
            }
          } else {
            rowData[header] = '';
          }
        });
        
        return rowData;
      });

    // 构建只读表格列
    const tableColumns: TableColumnType<ExcelData>[] = validHeaders.map((header) => {
      const headerStr = String(header).toLowerCase().trim();
      const isSequenceColumn = 
        headerStr === '序号' || 
        headerStr === '序' || 
        headerStr === 'no' || 
        headerStr === 'no.' ||
        headerStr === 'id' || 
        headerStr === '编号' ||
        headerStr === '行号' ||
        headerStr.includes('序号') ||
        headerStr.includes('编号') ||
        (headerStr.length <= 3 && /^(序|no|id|\d+)/.test(headerStr));

      return {
        title: header,
        dataIndex: header,
        key: header,
        width: calculateColumnWidth(header, tableData),
        ellipsis: true,
        align: isSequenceColumn ? 'center' as const : undefined,
        className: isSequenceColumn ? 'sequence-column' : undefined,
        sorter: (a: ExcelData, b: ExcelData) => {
          const aVal = a[header];
          const bVal = b[header];
          
          const aNum = parseFloat(aVal);
          const bNum = parseFloat(bVal);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          
          return String(aVal).localeCompare(String(bVal));
        },
        render: (text) => {
          if (text === null || text === undefined || text === '') {
            return <Text type="secondary">-</Text>;
          }
          
          const displayText = String(text);
          const num = parseFloat(text);
          
          // 序号列不需要tooltip，直接显示
          if (isSequenceColumn) {
            return <Text style={{ fontWeight: 500 }}>{displayText}</Text>;
          }
          
          // 判断是否需要显示tooltip（文本长度超过15个字符）
          const needTooltip = displayText.length > 15;
          
          if (!isNaN(num) && isFinite(num)) {
            const formattedText = num.toLocaleString();
            const content = (
              <div 
                style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                  maxWidth: '100%'
                }}
              >
                {formattedText}
              </div>
            );
            
            return needTooltip ? (
              <Tooltip title={formattedText} placement="topLeft">
                {content}
              </Tooltip>
            ) : content;
          }
          
          const content = (
            <div 
              style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              {displayText}
            </div>
          );
          
          return needTooltip ? (
            <Tooltip title={displayText} placement="topLeft">
              {content}
            </Tooltip>
          ) : content;
        },
      };
    });

    // 构建可编辑表格列
    const editableTableColumns: TableColumnType<ExcelData>[] = [
      ...validHeaders.map((header) => {
        const headerStr = String(header).toLowerCase().trim();
        const isSequenceColumn = 
          headerStr === '序号' || 
          headerStr === '序' || 
          headerStr === 'no' || 
          headerStr === 'no.' ||
          headerStr === 'id' || 
          headerStr === '编号' ||
          headerStr === '行号' ||
          headerStr.includes('序号') ||
          headerStr.includes('编号') ||
          (headerStr.length <= 3 && /^(序|no|id|\d+)/.test(headerStr));

        return {
          title: header,
          dataIndex: header,
          key: header,
          width: calculateColumnWidth(header, tableData),
          ellipsis: true,
          align: isSequenceColumn ? 'center' as const : undefined,
          className: isSequenceColumn ? 'sequence-column' : undefined,
          sorter: (a: ExcelData, b: ExcelData) => {
            const aVal = a[header];
            const bVal = b[header];
            
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return aNum - bNum;
            }
            
            return String(aVal).localeCompare(String(bVal));
          },
          render: (text: any, record: ExcelData) => {
            const editing = isEditing(record);
            console.log(`渲染列 "${header}":`, {
              recordKey: record.key,
              editingKey,
              isEditing: editing,
              text: text
            });
            
            if (editing) {
              return (
                <Form.Item
                  name={header}
                  style={{ margin: 0 }}
                  rules={[]}
                >
                  <Input 
                    style={{ textAlign: isSequenceColumn ? 'center' : 'left' }}
                    placeholder="请输入内容"
                  />
                </Form.Item>
              );
            } else {
              if (text === null || text === undefined || text === '') {
                return <Text type="secondary">-</Text>;
              }
              
              const displayText = String(text);
              
              // 序号列不需要tooltip，直接显示，居中对齐
              if (isSequenceColumn) {
                return <Text style={{ fontWeight: 500 }}>{displayText}</Text>;
              }
              
              const needTooltip = displayText.length > 15;
              
              const content = (
                <div 
                  style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                >
                  {displayText}
                </div>
              );
              
              return needTooltip ? (
                <Tooltip title={displayText} placement="topLeft">
                  {content}
                </Tooltip>
              ) : content;
            }
          },
        };
      }),
      {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        width: 120,
        fixed: 'right',
        render: (_: any, record: ExcelData) => {
          const editing = isEditing(record);
          return editing ? (
            <Space size="small">
              <Button
                type="link"
                onClick={() => save(record.key)}
                size="small"
                icon={<SaveOutlined />}
              >
                保存
              </Button>
              <Button
                type="link"
                onClick={cancel}
                size="small"
              >
                取消
              </Button>
            </Space>
          ) : (
            <Space size="small">
              <Button
                type="link"
                disabled={editingKey !== ''}
                onClick={() => edit(record)}
                size="small"
                icon={<EditOutlined />}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除这行数据吗？"
                onConfirm={() => deleteRow(record.key)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ];

    return {
      name: sheetName,
      data: tableData,
      editingData: [...tableData],
      columns: tableColumns,
      editableColumns: editableTableColumns,
      hasChanges: false,
    };
  };

  // 处理文件上传
  const handleFileUpload: UploadProps['customRequest'] = (options) => {
    const { file } = options;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('工作表名称:', workbook.SheetNames);
        
        // 解析所有工作表
        const parsedSheets: SheetData[] = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          return parseSheet(worksheet, sheetName);
        });

        // 过滤掉空的工作表
        const validSheets = parsedSheets.filter(sheet => sheet.data.length > 0);
        
        if (validSheets.length === 0) {
          message.error('Excel文件中没有找到有效数据');
          setLoading(false);
          return;
        }

        setSheets(validSheets);
        setActiveSheetIndex(0);
        setFileName((file as File).name);
        setSelectedColumns([]);
        setColumnStats([]);
        setEditingKey('');
        
        message.success(`成功导入 ${validSheets.length} 个工作表，共 ${validSheets.reduce((sum, sheet) => sum + sheet.data.length, 0)} 行数据`);
      } catch (error) {
        console.error('解析Excel文件失败:', error);
        message.error('解析Excel文件失败，请检查文件格式');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file as File);
  };

  // 上传组件配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    customRequest: handleFileUpload,
    showUploadList: false,
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.type === 'application/vnd.ms-excel' ||
                     file.name.toLowerCase().endsWith('.xlsx') ||
                     file.name.toLowerCase().endsWith('.xls');
      
      if (!isExcel) {
        message.error('只能上传Excel文件（.xlsx, .xls）');
        return false;
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过10MB');
        return false;
      }
      
      return true;
    },
  };

  // 计算列统计
  const calculateStats = () => {
    if (selectedColumns.length === 0) {
      message.warning('请先选择要计算的列');
      return;
    }

    const stats: ColumnStat[] = selectedColumns.map((columnName) => {
      const values = editingData.map(row => row[columnName]).filter(val => val !== null && val !== undefined && val !== '');
      const numericValues = values.map(val => parseFloat(val)).filter(num => !isNaN(num) && isFinite(num));
      
      const stat: ColumnStat = {
        column: columnName,
        count: values.length,
        nonEmptyCount: values.length,
      };

      if (numericValues.length > 0) {
        stat.sum = numericValues.reduce((acc, val) => acc + val, 0);
        stat.avg = stat.sum / numericValues.length;
        stat.max = Math.max(...numericValues);
        stat.min = Math.min(...numericValues);
      }

      return stat;
    });

    setColumnStats(stats);
    message.success('计算完成');
  };

  // 获取可选择的列（数字列优先）
  const selectableColumns = useMemo(() => {
    if (columns.length === 0) return [];
    
    return columns.map(col => {
      const columnName = col.dataIndex as string;
      const hasNumbers = editingData.some(row => {
        const val = row[columnName];
        return val !== null && val !== undefined && val !== '' && !isNaN(parseFloat(val));
      });
      
      return {
        value: columnName,
        label: columnName,
        hasNumbers,
      };
    }).sort((a, b) => {
      if (a.hasNumbers && !b.hasNumbers) return -1;
      if (!a.hasNumbers && b.hasNumbers) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [columns, editingData]);

  // 清除数据
  const clearData = () => {
    setSheets([]);
    setActiveSheetIndex(0);
    setFileName('');
    setSelectedColumns([]);
    setColumnStats([]);
    setEditingKey('');
    message.success('已清除所有数据');
  };

  // 导出统计结果
  const exportStats = () => {
    if (columnStats.length === 0) {
      message.warning('没有统计数据可导出');
      return;
    }

    const statsData = columnStats.map(stat => ({
      '列名': stat.column,
      '总计': stat.sum || '-',
      '平均值': stat.avg ? stat.avg.toFixed(2) : '-',
      '最大值': stat.max || '-',
      '最小值': stat.min || '-',
      '数据行数': stat.count || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(statsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '统计结果');
    
    const sheetName = currentSheet?.name || '工作表';
    const exportFileName = `${fileName.replace(/\.[^/.]+$/, '')}_${sheetName}_统计结果.xlsx`;
    XLSX.writeFile(workbook, exportFileName);
    
    message.success('统计结果已导出');
  };

  // 生成月份表格
  const generateTableData = async () => {
    try {
      const values = await billGenerateForm.validateFields();
      setBillGenerateLoading(true);

      if (!sheets || sheets.length === 0) {
        message.warning('没有工作表数据可以生成');
        return;
      }

      // 调用表格数据API导入Excel数据
      const response = await tableDataAPI.importTableData({
        fileName: fileName || '未命名文件',
        sheets: sheets,
        targetMonth: values.month,
        targetYear: values.year
      });

      if (response.status === 'success' && response.data) {
        message.success(`成功导入 ${response.data.importedCount} 个工作表到 ${response.data.targetMonth}！`);
        setShowBillGenerateModal(false);
        billGenerateForm.resetFields();
        
        // 询问是否跳转到月份表格展示页面
        Modal.confirm({
          title: '导入成功',
          content: `已成功导入 ${sheets.length} 个工作表的数据到 ${response.data.targetMonth} 月份表格，是否立即查看？`,
          onOk: () => {
            navigate(`/table-bills?month=${response.data.targetMonth}`);
          },
          onCancel: () => {
            message.info('您可以在"月份表格"页面查看导入的数据');
          }
        });
      }
    } catch (error) {
      console.error('导入表格数据失败:', error);
      message.error('导入表格数据失败，请检查数据格式');
    } finally {
      setBillGenerateLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <style>
        {`
          .ant-table-cell {
            padding: 8px 12px !important;
          }
          .ant-table-thead > tr > th {
            background: #fafafa;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .ant-table-tbody > tr > td {
            padding: 8px 12px !important;
          }
          .ant-tooltip {
            max-width: 400px;
          }
          /* 序号列特殊样式 */
          .sequence-column {
            text-align: center !important;
            padding: 8px 4px !important;
            width: 60px !important;
            max-width: 60px !important;
            min-width: 60px !important;
          }
        `}
      </style>
      <Title level={2}>
        <FileExcelOutlined style={{ marginRight: 8 }} />
        Excel多工作表分析工具
      </Title>
      
      <Alert
        message="功能说明"
        description="上传Excel文件(.xlsx, .xls)，自动识别所有工作表并支持切换编辑。每个工作表都可以独立进行数据编辑、统计运算等操作。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 文件上传区域 */}
      <Card title="文件上传" style={{ marginBottom: 24 }}>
        <Dragger {...uploadProps} style={{ minHeight: 150 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽Excel文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持 .xlsx 和 .xls 格式，文件大小不超过10MB，自动识别所有工作表
          </p>
        </Dragger>
        
        {fileName && (
          <div style={{ marginTop: 16 }}>
            <Text strong>当前文件：</Text>
            <Tag color="blue" icon={<FileExcelOutlined />}>
              {fileName}
            </Tag>
            <Text type="secondary">
              （共 {sheets.length} 个工作表）
            </Text>
            {hasChanges && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                当前工作表有未保存的修改
              </Tag>
            )}
          </div>
        )}
      </Card>

      {/* 数据操作区域 */}
      {sheets.length > 0 && (
        <Card 
          title={`数据分析 - ${currentSheet?.name || '工作表'}`}
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              <Button 
                type="primary" 
                icon={<CalculatorOutlined />}
                onClick={calculateStats}
                disabled={selectedColumns.length === 0}
              >
                计算统计
              </Button>
              {columnStats.length > 0 && (
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={exportStats}
                >
                  导出统计
                </Button>
              )}
              <Button 
                danger 
                icon={<ClearOutlined />}
                onClick={clearData}
              >
                清除数据
              </Button>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Text strong>选择要分析的列：</Text>
              <Select
                mode="multiple"
                style={{ width: '100%', marginTop: 8 }}
                placeholder="选择一个或多个列进行统计分析"
                value={selectedColumns}
                onChange={setSelectedColumns}
                optionFilterProp="label"
              >
                {selectableColumns.map(option => (
                  <Option key={option.value} value={option.value} label={option.label}>
                    {option.label}
                    {option.hasNumbers && <Tag color="green" style={{ marginLeft: 8 }}>数值</Tag>}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>
      )}

      {/* 统计结果展示 */}
      {columnStats.length > 0 && (
        <Card title="统计结果" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {columnStats.map((stat, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card size="small" title={stat.column} style={{ height: '100%' }}>
                  <Row gutter={[8, 8]}>
                    {stat.sum !== undefined && (
                      <Col span={12}>
                        <Statistic
                          title="总计"
                          value={stat.sum}
                          precision={2}
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                    )}
                    {stat.avg !== undefined && (
                      <Col span={12}>
                        <Statistic
                          title="平均值"
                          value={stat.avg}
                          precision={2}
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                    )}
                    {stat.max !== undefined && (
                      <Col span={12}>
                        <Statistic
                          title="最大值"
                          value={stat.max}
                          precision={2}
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                    )}
                    {stat.min !== undefined && (
                      <Col span={12}>
                        <Statistic
                          title="最小值"
                          value={stat.min}
                          precision={2}
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                    )}
                    <Col span={24}>
                      <Divider style={{ margin: '8px 0' }} />
                      <Text type="secondary">数据行数: {stat.count}</Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 多工作表展示 */}
      {sheets.length > 0 ? (
        <Card>
          <Tabs 
            activeKey={activeSheetIndex.toString()} 
            onChange={(key) => setActiveSheetIndex(parseInt(key))}
            type="card"
            tabBarExtraContent={
              <Space>
                <Text type="secondary">
                  共 {sheets.length} 个工作表
                </Text>
              </Space>
            }
          >
            {sheets.map((sheet, index) => (
              <TabPane 
                tab={
                  <span>
                    <TableOutlined />
                    {sheet.name}
                    {sheet.hasChanges && <Tag color="orange" style={{ marginLeft: 4 }}>已修改</Tag>}
                    <Text type="secondary" style={{ marginLeft: 4 }}>
                      ({sheet.data.length}行)
                    </Text>
                  </span>
                } 
                key={index.toString()}
              >
                {index === activeSheetIndex && (
                  <Tabs defaultActiveKey="workspace" type="card">
                    {/* 工作区表格 */}
                    <TabPane 
                      tab={
                        <span>
                          <ToolOutlined />
                          工作区表格 {hasChanges && <Tag color="orange">已修改</Tag>}
                        </span>
                      } 
                      key="workspace"
                    >
                      <div style={{ marginBottom: 16 }}>
                        <Space>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={addRow}
                          >
                            添加新行
                          </Button>
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => setShowAddColumnModal(true)}
                          >
                            添加新列
                          </Button>
                          <Button
                            icon={<FunctionOutlined />}
                            onClick={() => setShowCalculateModal(true)}
                            disabled={getNumericColumns().length < 2}
                          >
                            计算列
                          </Button>
                          {hasChanges && (
                            <>
                              <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={saveAllChanges}
                              >
                                保存所有修改
                              </Button>
                              <Button
                                onClick={resetChanges}
                              >
                                重置修改
                              </Button>
                            </>
                          )}
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={exportWorkspaceData}
                          >
                            导出工作区数据
                          </Button>
                          <Button
                            type="primary"
                            ghost
                            icon={<TableOutlined />}
                            onClick={() => setShowBillGenerateModal(true)}
                            disabled={!sheets || sheets.length === 0}
                          >
                            月份表格生成
                          </Button>

                        </Space>
                      </div>
                      
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleRowDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                      >
                        <SortableContext
                          items={editingData.map(item => item.key)}
                          strategy={verticalListSortingStrategy}
                        >
                          <Form form={form} component={false}>
                            <Table
                              components={{
                                body: {
                                  row: DraggableRow,
                                  cell: ({ children, ...restProps }: any) => (
                                    <td {...restProps}>{children}</td>
                                  ),
                                },
                              }}
                              bordered
                              dataSource={editingData}
                              columns={dynamicEditableColumns}
                              rowClassName={(record) => isEditing(record) ? 'editable-row editing' : 'editable-row'}
                              scroll={{ x: 'max-content', y: 600 }}
                              pagination={{
                                total: editingData.length,
                                pageSize: 50,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => 
                                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
                              }}
                              loading={loading}
                              size="small"
                            />
                          </Form>
                        </SortableContext>
                      </DndContext>
                    </TabPane>
                    
                    {/* 原始数据预览 */}
                    <TabPane 
                      tab={
                        <span>
                          <EyeOutlined />
                          原始数据预览
                        </span>
                      } 
                      key="preview"
                    >
                      <Table
                        columns={columns}
                        dataSource={data}
                        bordered
                        scroll={{ x: 'max-content', y: 600 }}
                        pagination={{
                          total: data.length,
                          pageSize: 50,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (total, range) => 
                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
                        }}
                        loading={loading}
                        size="small"
                      />
                    </TabPane>
                  </Tabs>
                )}
              </TabPane>
            ))}
          </Tabs>
        </Card>
      ) : (
        <Card>
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请上传Excel文件开始多工作表数据分析和编辑"
          />
        </Card>
      )}
      
      {/* 新增列Modal */}
      <Modal
        title="添加新列"
        open={showAddColumnModal}
        onOk={addColumn}
        onCancel={() => {
          setShowAddColumnModal(false);
          setNewColumnName('');
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="列名" required>
            <Input
              placeholder="请输入列名"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onPressEnter={addColumn}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 计算列Modal */}
      <Modal
        title="计算列"
        open={showCalculateModal}
        onOk={calculateColumn}
        onCancel={() => {
          setShowCalculateModal(false);
          calculateForm.resetFields();
        }}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form form={calculateForm} layout="vertical">
          <Form.Item 
            label="结果列名" 
            name="resultColumnName"
            rules={[{ required: true, message: '请输入结果列名' }]}
          >
            <Input placeholder="请输入新列的名称，如：利润、总价等" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                label="第一个数值列" 
                name="column1"
                rules={[{ required: true, message: '请选择第一个列' }]}
              >
                <Select placeholder="选择列">
                  {getNumericColumns().map(col => (
                    <Option key={col.value} value={col.value}>
                      {col.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                label="运算符" 
                name="operation"
                rules={[{ required: true, message: '请选择运算符' }]}
              >
                <Select placeholder="选择运算">
                  <Option value="add">+ (加法)</Option>
                  <Option value="subtract">- (减法)</Option>
                  <Option value="multiply">× (乘法)</Option>
                  <Option value="divide">÷ (除法)</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                label="第二个数值列" 
                name="column2"
                rules={[{ required: true, message: '请选择第二个列' }]}
              >
                <Select placeholder="选择列">
                  {getNumericColumns().map(col => (
                    <Option key={col.value} value={col.value}>
                      {col.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Alert
            message="计算说明"
            description="系统会对所有行进行计算，空值或非数值将被视为0。计算结果会自动保留两位小数。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
          
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              示例：选择"单价"列 × "数量"列 = "总价"列
            </Text>
          </div>
        </Form>
      </Modal>

      {/* 月份表格生成Modal */}
      <Modal
        title="生成月份表格"
        open={showBillGenerateModal}
        onOk={generateTableData}
        onCancel={() => {
          setShowBillGenerateModal(false);
          billGenerateForm.resetFields();
        }}
        confirmLoading={billGenerateLoading}
        okText="导入表格数据"
        cancelText="取消"
        width={600}
      >
        <Alert
          message="功能说明"
          description="系统将导入所有工作表的数据到指定月份的表格中，保留原始字段信息。所有工作表的数据都将被包含。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={billGenerateForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标年份"
                name="year"
                rules={[{ required: true, message: '请选择年份' }]}
                initialValue={new Date().getFullYear()}
              >
                <Select placeholder="选择年份">
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <Option key={year} value={year}>{year}年</Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="目标月份"
                name="month"
                rules={[{ required: true, message: '请选择月份' }]}
                initialValue={new Date().getMonth() + 1}
              >
                <Select placeholder="选择月份">
                  {Array.from({ length: 12 }, (_, i) => (
                    <Option key={i + 1} value={i + 1}>{i + 1}月</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          
          <div>
            <Text strong>数据预览：</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              共 {sheets?.length || 0} 个工作表，
              总计 {sheets?.reduce((total, sheet) => total + (sheet.editingData?.length || sheet.data?.length || 0), 0) || 0} 行数据
            </Text>
          </div>
          
          {sheets && sheets.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text strong>工作表列表：</Text>
              <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                {sheets.map((sheet, index) => (
                  <div key={index} style={{ marginBottom: 4 }}>
                    <Tag color="blue">{sheet.name}</Tag>
                    <Text type="secondary">
                      {sheet.editingData?.length || sheet.data?.length || 0} 行数据
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ExcelAnalysisNew; 