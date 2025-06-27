/**
 * 表格数据路由
 * 处理Excel表格数据的导入、查询和管理
 */

const express = require('express');
const router = express.Router();
const TableData = require('../models/TableData');
const mongoose = require('mongoose');

// 批量导入表格数据
router.post('/import', async (req, res) => {
  try {
    const { fileName, sheets, targetMonth, targetYear } = req.body;
    
    if (!sheets || !Array.isArray(sheets) || sheets.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '表格数据不能为空'
      });
    }

    if (!targetMonth || !targetYear) {
      return res.status(400).json({
        status: 'error',
        message: '目标月份和年份不能为空'
      });
    }

    const userId = req.user?.id || new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // 临时用户ID
    const importedSheets = [];

    // 处理每个工作表
    for (const sheet of sheets) {
      try {
        // 限制数据大小，避免超时
        const data = sheet.editingData || sheet.data || [];
        const limitedData = data.slice(0, 1000); // 限制每个工作表最多1000行
        
        const tableData = new TableData({
          fileName: fileName || '未知文件',
          sheetName: sheet.name,
          uploadDate: new Date(),
          targetMonth: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
          targetYear: parseInt(targetYear),
          columns: sheet.columns || [],
          originalData: limitedData,
          totalRows: limitedData.length,
          totalColumns: (sheet.columns || []).length,
          metadata: {
            hasChanges: sheet.hasChanges || false,
            originalStructure: {
              originalRowCount: data.length,
              editedRowCount: limitedData.length,
              columnCount: (sheet.columns || []).length
            },
            importSettings: {
              importTime: new Date(),
              targetMonth: targetMonth,
              targetYear: targetYear
            }
          },
          createdBy: userId,
          status: 'active'
        });

        console.log(`正在保存工作表: ${sheet.name}, 数据行数: ${limitedData.length}`);
        const saved = await tableData.save({ timeout: 30000 }); // 增加超时时间到30秒
        console.log(`工作表 ${sheet.name} 保存成功`);
        importedSheets.push(saved);
      } catch (error) {
        console.error(`导入工作表 ${sheet.name} 失败:`, error.message);
        // 继续处理其他工作表
      }
    }

    res.json({
      status: 'success',
      message: `成功导入 ${importedSheets.length} 个工作表`,
      data: {
        importedCount: importedSheets.length,
        totalSheets: sheets.length,
        targetMonth: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
        sheets: importedSheets.map(sheet => sheet.getSummary())
      }
    });
  } catch (error) {
    console.error('批量导入表格数据失败:', error);
    res.status(500).json({
      status: 'error',
      message: '批量导入表格数据失败',
      error: error.message
    });
  }
});

// 获取月份表格数据
router.get('/monthly', async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    
    let tableDataList = [];
    
    if (month && year) {
      // 按指定月份查询
      const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
      tableDataList = await TableData.find({
        targetYear: parseInt(year),
        targetMonth: targetMonth,
        status: 'active'
      }).populate('createdBy', 'username email').sort({ uploadDate: -1 });
    } else if (startDate && endDate) {
      // 按日期范围查询
      tableDataList = await TableData.find({
        uploadDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        status: 'active'
      }).populate('createdBy', 'username email').sort({ uploadDate: -1 });
    } else {
      return res.status(400).json({
        status: 'error',
        message: '请提供月份和年份，或者日期范围'
      });
    }

    // 按工作表分组
    const sheetGroups = {};
    
    tableDataList.forEach(tableData => {
      const sheetName = tableData.sheetName;
      if (!sheetGroups[sheetName]) {
        sheetGroups[sheetName] = {
          name: sheetName,
          data: [],
          columns: tableData.columns,
          uploads: [],
          totalRows: 0,
          totalIncome: 0, // 前端期望的字段
          totalExpense: 0, // 前端期望的字段
          count: 0, // 前端期望的字段
          structure: tableData.columns, // 前端期望的字段
          metadata: {
            latestUpload: null,
            totalUploads: 0
          }
        };
      }
      
      // 合并数据（如果同一个工作表有多次上传）
      sheetGroups[sheetName].data.push(...tableData.originalData);
      sheetGroups[sheetName].totalRows += tableData.totalRows;
      sheetGroups[sheetName].count += tableData.totalRows;
      sheetGroups[sheetName].uploads.push({
        id: tableData._id,
        fileName: tableData.fileName,
        uploadDate: tableData.uploadDate,
        rowCount: tableData.totalRows
      });
      sheetGroups[sheetName].metadata.totalUploads++;
      
      // 更新最新上传时间
      if (!sheetGroups[sheetName].metadata.latestUpload || 
          tableData.uploadDate > sheetGroups[sheetName].metadata.latestUpload) {
        sheetGroups[sheetName].metadata.latestUpload = tableData.uploadDate;
      }
    });

    // 转换为数组并排序
    const sheetsArray = Object.values(sheetGroups).sort((a, b) => b.totalRows - a.totalRows);

    res.json({
      status: 'success',
      message: '获取月份表格数据成功',
      data: {
        sheets: sheetsArray,
        totalSheets: sheetsArray.length,
        totalRecords: sheetsArray.reduce((sum, sheet) => sum + sheet.totalRows, 0),
        summary: {
          totalIncome: 0, // 暂时设为0，因为我们没有收入/支出的概念
          totalExpense: 0,
          totalCount: sheetsArray.reduce((sum, sheet) => sum + sheet.totalRows, 0)
        },
        queryInfo: {
          month: month,
          year: year,
          startDate: startDate,
          endDate: endDate,
          totalUploads: tableDataList.length
        }
      }
    });
  } catch (error) {
    console.error('获取月份表格数据失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取月份表格数据失败',
      error: error.message
    });
  }
});

// 获取表格列表（管理用）
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, month, year, sheetName } = req.query;
    
    const filter = { status: 'active' };
    if (month && year) {
      filter.targetMonth = `${year}-${String(month).padStart(2, '0')}`;
    }
    if (sheetName) {
      filter.sheetName = new RegExp(sheetName, 'i');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tableDataList = await TableData.find(filter)
      .populate('createdBy', 'username email')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await TableData.countDocuments(filter);

    res.json({
      status: 'success',
      message: '获取表格列表成功',
      data: {
        list: tableDataList.map(item => item.getSummary()),
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取表格列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取表格列表失败',
      error: error.message
    });
  }
});

// 删除表格数据
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tableData = await TableData.findById(id);
    if (!tableData) {
      return res.status(404).json({
        status: 'error',
        message: '表格数据不存在'
      });
    }

    // 软删除
    tableData.status = 'deleted';
    await tableData.save();

    res.json({
      status: 'success',
      message: '删除表格数据成功'
    });
  } catch (error) {
    console.error('删除表格数据失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除表格数据失败',
      error: error.message
    });
  }
});

// 获取单个表格详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tableData = await TableData.findById(id)
      .populate('createdBy', 'username email');
    
    if (!tableData) {
      return res.status(404).json({
        status: 'error',
        message: '表格数据不存在'
      });
    }

    res.json({
      status: 'success',
      message: '获取表格详情成功',
      data: tableData
    });
  } catch (error) {
    console.error('获取表格详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取表格详情失败',
      error: error.message
    });
  }
});

module.exports = router; 