// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Plus, Edit2, Trash2, Check, X, Search, Filter } from 'lucide-react';
// @ts-ignore;
import { useToast, Button, Input, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';

import { TabBar } from '@/components/TabBar';
export default function Tasks(props) {
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignee: ''
  });
  const currentUser = props.$w.auth.currentUser;
  const {
    navigateTo
  } = props.$w.utils;

  // 处理 Tab 切换
  const handleTabChange = tabId => {
    setActiveTab(tabId);
    navigateTo({
      pageId: tabId,
      params: {}
    });
  };

  // 加载数据
  useEffect(() => {
    loadTasks();
  }, []);
  const loadTasks = async () => {
    try {
      setLoading(true);
      const result = await props.$w.cloud.callDataSource({
        dataSourceName: 'tasks',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {}
          },
          orderBy: [{
            dueDate: 'asc'
          }],
          select: {
            $master: true
          },
          pageSize: 200,
          pageNumber: 1
        }
      });
      setTasks(result.records || []);
    } catch (error) {
      console.error('加载任务失败:', error);
      toast({
        title: '加载失败',
        description: error.message || '无法加载任务',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };
  const priorityLabels = {
    high: '高',
    medium: '中',
    low: '低'
  };
  const handleCreate = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      assignee: currentUser?.name || ''
    });
    setIsDialogOpen(true);
  };
  const handleEdit = task => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      dueDate: task.dueDate || '',
      assignee: task.assignee || ''
    });
    setIsDialogOpen(true);
  };
  const handleDelete = async id => {
    try {
      await props.$w.cloud.callDataSource({
        dataSourceName: 'tasks',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              $and: [{
                _id: {
                  $eq: id
                }
              }]
            }
          }
        }
      });
      setTasks(tasks.filter(t => t._id !== id));
      toast({
        title: '删除成功',
        description: '任务已删除',
        variant: 'default'
      });
    } catch (error) {
      console.error('删除任务失败:', error);
      toast({
        title: '删除失败',
        description: error.message || '无法删除任务',
        variant: 'destructive'
      });
    }
  };
  const handleStatusChange = async (id, newStatus) => {
    try {
      await props.$w.cloud.callDataSource({
        dataSourceName: 'tasks',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            status: newStatus
          },
          filter: {
            where: {
              $and: [{
                _id: {
                  $eq: id
                }
              }]
            }
          }
        }
      });
      setTasks(tasks.map(t => t._id === id ? {
        ...t,
        status: newStatus
      } : t));
      toast({
        title: '状态更新',
        description: '任务状态已更新',
        variant: 'default'
      });
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: '更新失败',
        description: error.message || '无法更新任务状态',
        variant: 'destructive'
      });
    }
  };
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: '验证失败',
        description: '标题不能为空',
        variant: 'destructive'
      });
      return;
    }
    try {
      if (editingTask) {
        await props.$w.cloud.callDataSource({
          dataSourceName: 'tasks',
          methodName: 'wedaUpdateV2',
          params: {
            data: {
              title: formData.title,
              description: formData.description,
              priority: formData.priority,
              dueDate: formData.dueDate,
              assignee: formData.assignee
            },
            filter: {
              where: {
                $and: [{
                  _id: {
                    $eq: editingTask._id
                  }
                }]
              }
            }
          }
        });
        setTasks(tasks.map(t => t._id === editingTask._id ? {
          ...t,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          dueDate: formData.dueDate,
          assignee: formData.assignee
        } : t));
        toast({
          title: '更新成功',
          description: '任务已更新',
          variant: 'default'
        });
      } else {
        const result = await props.$w.cloud.callDataSource({
          dataSourceName: 'tasks',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              title: formData.title,
              description: formData.description,
              status: 'pending',
              priority: formData.priority,
              dueDate: formData.dueDate,
              assignee: formData.assignee || currentUser?.name || '用户'
            }
          }
        });
        const newTask = {
          _id: result.id,
          title: formData.title,
          description: formData.description,
          status: 'pending',
          priority: formData.priority,
          dueDate: formData.dueDate,
          assignee: formData.assignee || currentUser?.name || '用户'
        };
        setTasks([newTask, ...tasks]);
        toast({
          title: '创建成功',
          description: '任务已创建',
          variant: 'default'
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('提交失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '无法保存任务',
        variant: 'destructive'
      });
    }
  };
  const TaskCard = ({
    task
  }) => <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-l-amber-400">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[#1E293B] mb-1">{task.title}</h3>
          <p className="text-xs text-gray-500">
            {task.assignee}
          </p>
        </div>
        <div className="flex space-x-1">
          <button onClick={() => handleEdit(task)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="编辑">
            <Edit2 size={18} className="text-blue-600" />
          </button>
          <button onClick={() => handleDelete(task._id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="删除">
            <Trash2 size={18} className="text-red-600" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{task.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded border ${priorityColors[task.priority || 'medium']}`}>
            {priorityLabels[task.priority || 'medium']}优先级
          </span>
          {task.dueDate && <span className="text-xs text-gray-500">
              截止: {task.dueDate}
            </span>}
        </div>
        <div className="flex space-x-1">
          {task.status !== 'pending' && <button onClick={() => handleStatusChange(task._id, 'pending')} className={`p-2 rounded-lg transition-colors ${task.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'hover:bg-amber-50'}`} title="待办">
              <X size={18} />
            </button>}
          {task.status !== 'in_progress' && <button onClick={() => handleStatusChange(task._id, 'in_progress')} className={`p-2 rounded-lg transition-colors ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50'}`} title="进行中">
              <Filter size={18} />
            </button>}
          {task.status !== 'completed' && <button onClick={() => handleStatusChange(task._id, 'completed')} className={`p-2 rounded-lg transition-colors ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'hover:bg-green-50'}`} title="完成">
              <Check size={18} />
            </button>}
        </div>
      </div>
    </div>;
  if (loading) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{
          fontFamily: 'Merriweather, serif'
        }}>
            任务管理
          </h1>
          <p className="text-blue-100 text-sm">跟踪和管理课题组任务</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input placeholder="搜索任务..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-white shadow-sm" />
        </div>

        {/* Create Button */}
        <Button onClick={handleCreate} className="w-full mb-4 bg-[#1E3A8A] hover:bg-[#1E40AF]">
          <Plus size={20} className="mr-2" />
          创建任务
        </Button>

        {/* Task List */}
        <Tabs defaultValue="pending" className="bg-white rounded-xl shadow-sm">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              待办 ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              进行中 ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              已完成 ({completedTasks.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="p-4">
            <div className="space-y-3">
              {pendingTasks.map(task => <TaskCard key={task._id} task={task} />)}
              {pendingTasks.length === 0 && <div className="text-center py-8 text-gray-500">
                  <p>暂无待办任务</p>
                </div>}
            </div>
          </TabsContent>
          <TabsContent value="in_progress" className="p-4">
            <div className="space-y-3">
              {inProgressTasks.map(task => <TaskCard key={task._id} task={task} />)}
              {inProgressTasks.length === 0 && <div className="text-center py-8 text-gray-500">
                  <p>暂无进行中任务</p>
                </div>}
            </div>
          </TabsContent>
          <TabsContent value="completed" className="p-4">
            <div className="space-y-3">
              {completedTasks.map(task => <TaskCard key={task._id} task={task} />)}
              {completedTasks.length === 0 && <div className="text-center py-8 text-gray-500">
                  <p>暂无已完成任务</p>
                </div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{
            fontFamily: 'Merriweather, serif'
          }}>
              {editingTask ? '编辑任务' : '创建任务'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题
              </label>
              <Input placeholder="请输入任务标题" value={formData.title} onChange={e => setFormData({
              ...formData,
              title: e.target.value
            })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                负责人
              </label>
              <Input placeholder="请输入负责人姓名" value={formData.assignee} onChange={e => setFormData({
              ...formData,
              assignee: e.target.value
            })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <Textarea placeholder="请输入任务描述" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} rows={4} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优先级
              </label>
              <select value={formData.priority} onChange={e => setFormData({
              ...formData,
              priority: e.target.value
            })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                截止日期
              </label>
              <Input type="date" value={formData.dueDate} onChange={e => setFormData({
              ...formData,
              dueDate: e.target.value
            })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-[#1E3A8A] hover:bg-[#1E40AF]">
              {editingTask ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>;
}