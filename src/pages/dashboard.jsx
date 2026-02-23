// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Bell, Calendar, FileText, CheckSquare, ChevronRight, Plus } from 'lucide-react';
// @ts-ignore;
import { useToast } from '@/components/ui';

import { TabBar } from '@/components/TabBar';
export default function Dashboard(props) {
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const {
    navigateTo
  } = props.$w.utils;
  const currentUser = props.$w.auth.currentUser;

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
    loadData();
  }, []);
  const loadData = async () => {
    try {
      setLoading(true);

      // 并行加载所有数据
      const [announcementsResult, eventsResult, tasksResult] = await Promise.all([props.$w.cloud.callDataSource({
        dataSourceName: 'announcements',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {}
          },
          orderBy: [{
            isPinned: 'desc'
          }, {
            date: 'desc'
          }],
          select: {
            $master: true
          },
          pageSize: 5,
          pageNumber: 1
        }
      }), props.$w.cloud.callDataSource({
        dataSourceName: 'events',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              $and: [{
                startDate: {
                  $gte: new Date().toISOString().split('T')[0]
                }
              }]
            }
          },
          orderBy: [{
            startDate: 'asc'
          }, {
            startTime: 'asc'
          }],
          select: {
            $master: true
          },
          pageSize: 5,
          pageNumber: 1
        }
      }), props.$w.cloud.callDataSource({
        dataSourceName: 'tasks',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {}
          },
          select: {
            $master: true
          },
          getCount: true,
          pageSize: 200,
          pageNumber: 1
        }
      })]);
      setAnnouncements(announcementsResult.records || []);
      setEvents(eventsResult.records || []);
      setTasks(tasksResult.records || []);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast({
        title: '加载失败',
        description: error.message || '无法加载数据',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 计算任务统计
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  // 格式化星期几
  const formatWeekDay = dateStr => {
    const date = new Date(dateStr);
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  };

  // 格式化日程数据
  const schedule = events.map(event => ({
    id: event._id,
    title: event.title,
    time: `${formatWeekDay(event.startDate)} ${event.startTime || ''}`,
    location: event.location || ''
  }));
  const quickActions = [{
    id: 'announcements',
    label: '公告',
    icon: Bell,
    color: 'bg-blue-500',
    pageId: 'announcements'
  }, {
    id: 'calendar',
    label: '日历',
    icon: Calendar,
    color: 'bg-green-500',
    pageId: 'calendar'
  }, {
    id: 'files',
    label: '文件',
    icon: FileText,
    color: 'bg-orange-500',
    pageId: 'files'
  }, {
    id: 'tasks',
    label: '任务',
    icon: CheckSquare,
    color: 'bg-purple-500',
    pageId: 'tasks'
  }];
  const handleQuickAction = pageId => {
    navigateTo({
      pageId,
      params: {}
    });
  };
  const handleViewAllAnnouncements = () => {
    navigateTo({
      pageId: 'announcements',
      params: {}
    });
  };
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
      <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white p-6 pb-12">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{
          fontFamily: 'Merriweather, serif'
        }}>
            课题组管理
          </h1>
          <p className="text-blue-100 text-sm">欢迎回来，{currentUser?.name || '同学'}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8">
        {/* Task Stats Card */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1E293B]" style={{
            fontFamily: 'Merriweather, serif'
          }}>
              任务概览
            </h2>
            <span className="text-sm text-gray-500">共 {taskStats.total} 项</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{taskStats.pending}</div>
              <div className="text-xs text-amber-700 mt-1">待办</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
              <div className="text-xs text-blue-700 mt-1">进行中</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-xs text-green-700 mt-1">已完成</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-4">
          <h2 className="text-lg font-semibold text-[#1E293B] mb-4" style={{
          fontFamily: 'Merriweather, serif'
        }}>
            快捷入口
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(action => {
            const Icon = action.icon;
            return <button key={action.id} onClick={() => handleQuickAction(action.pageId)} className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center shadow-md`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{action.label}</span>
                </button>;
          })}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1E293B]" style={{
            fontFamily: 'Merriweather, serif'
          }}>
              最近公告
            </h2>
            <button onClick={handleViewAllAnnouncements} className="text-sm text-[#1E3A8A] flex items-center hover:underline">
              查看全部
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {announcements.slice(0, 3).map(announcement => <div key={announcement._id} className={`p-3 rounded-lg border ${announcement.isPinned ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-[#1E293B] mb-1">
                      {announcement.isPinned && <span className="inline-block bg-[#1E3A8A] text-white text-xs px-2 py-0.5 rounded mr-2">
                          置顶
                        </span>}
                      {announcement.title}
                    </h3>
                    <p className="text-xs text-gray-500">{announcement.date}</p>
                  </div>
                </div>
              </div>)}
            {announcements.length === 0 && <div className="text-center py-4 text-gray-500">
                <p>暂无公告</p>
              </div>}
          </div>
        </div>

        {/* This Week Schedule */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-4">
          <h2 className="text-lg font-semibold text-[#1E293B] mb-4" style={{
          fontFamily: 'Merriweather, serif'
        }}>
            即将到来
          </h2>
          <div className="space-y-3">
            {schedule.map(item => <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-[#1E3A8A] text-white text-xs px-2 py-1 rounded font-medium">
                  {item.time.split(' ')[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[#1E293B]">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.time} · {item.location}</p>
                </div>
              </div>)}
            {schedule.length === 0 && <div className="text-center py-4 text-gray-500">
                <p>暂无日程</p>
              </div>}
          </div>
        </div>
      </div>

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>;
}