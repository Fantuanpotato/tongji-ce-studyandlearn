// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X } from 'lucide-react';
// @ts-ignore;
import { useToast, Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';

import { TabBar } from '@/components/TabBar';
export default function Calendar(props) {
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    description: ''
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
    loadEvents();
  }, []);
  const loadEvents = async () => {
    try {
      setLoading(true);
      const result = await props.$w.cloud.callDataSource({
        dataSourceName: 'events',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {}
          },
          orderBy: [{
            startDate: 'asc'
          }, {
            startTime: 'asc'
          }],
          select: {
            $master: true
          },
          pageSize: 200,
          pageNumber: 1
        }
      });
      setEvents(result.records || []);
    } catch (error) {
      console.error('加载活动失败:', error);
      toast({
        title: '加载失败',
        description: error.message || '无法加载活动',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const getDaysInMonth = date => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    return days;
  };
  const getEventsForDate = date => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.startDate === dateStr);
  };
  const isToday = date => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const handleDateClick = date => {
    setSelectedDate(date);
    setFormData({
      title: '',
      startTime: '',
      endTime: '',
      location: '',
      description: ''
    });
    setEditingEvent(null);
    setIsDialogOpen(true);
  };
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setEditingEvent(event);
    setFormData({
      title: event.title,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      description: event.description || ''
    });
    setIsDialogOpen(true);
  };
  const handleDelete = async eventId => {
    try {
      await props.$w.cloud.callDataSource({
        dataSourceName: 'events',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              $and: [{
                _id: {
                  $eq: eventId
                }
              }]
            }
          }
        }
      });
      setEvents(events.filter(e => e._id !== eventId));
      toast({
        title: '删除成功',
        description: '活动已删除',
        variant: 'default'
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('删除活动失败:', error);
      toast({
        title: '删除失败',
        description: error.message || '无法删除活动',
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
      const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : editingEvent.startDate;
      if (editingEvent) {
        await props.$w.cloud.callDataSource({
          dataSourceName: 'events',
          methodName: 'wedaUpdateV2',
          params: {
            data: {
              title: formData.title,
              startTime: formData.startTime,
              endTime: formData.endTime,
              location: formData.location,
              description: formData.description
            },
            filter: {
              where: {
                $and: [{
                  _id: {
                    $eq: editingEvent._id
                  }
                }]
              }
            }
          }
        });
        setEvents(events.map(e => e._id === editingEvent._id ? {
          ...e,
          title: formData.title,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          description: formData.description
        } : e));
        toast({
          title: '更新成功',
          description: '活动已更新',
          variant: 'default'
        });
      } else {
        const result = await props.$w.cloud.callDataSource({
          dataSourceName: 'events',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              title: formData.title,
              startDate: dateStr,
              endDate: dateStr,
              startTime: formData.startTime,
              endTime: formData.endTime,
              location: formData.location,
              description: formData.description,
              creator: currentUser?.name || '用户'
            }
          }
        });
        const newEvent = {
          _id: result.id,
          title: formData.title,
          startDate: dateStr,
          endDate: dateStr,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          description: formData.description,
          creator: currentUser?.name || '用户'
        };
        setEvents([...events, newEvent]);
        toast({
          title: '创建成功',
          description: '活动已添加',
          variant: 'default'
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('提交失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '无法保存活动',
        variant: 'destructive'
      });
    }
  };
  const days = getDaysInMonth(currentDate);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
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
            日历管理
          </h1>
          <p className="text-blue-100 text-sm">管理课题组活动和日程</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        {/* Calendar Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-[#1E293B]" style={{
            fontFamily: 'Merriweather, serif'
          }}>
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </h2>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>)}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
            const dayEvents = getEventsForDate(day.date);
            return <div key={index} onClick={() => handleDateClick(day.date)} className={`min-h-[60px] p-1 rounded-lg cursor-pointer transition-colors ${day.isCurrentMonth ? isToday(day.date) ? 'bg-[#1E3A8A] text-white' : 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-100 text-gray-400'}`}>
                  <div className="text-xs font-medium mb-1">{day.date.getDate()}</div>
                  {dayEvents.length > 0 && <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => <div key={event._id} onClick={e => handleEventClick(event, e)} className={`text-xs p-1 rounded truncate ${isToday(day.date) ? 'bg-white text-[#1E3A8A]' : 'bg-[#1E3A8A] text-white'}`}>
                          {event.title}
                        </div>)}
                      {dayEvents.length > 2 && <div className={`text-xs ${isToday(day.date) ? 'text-white' : 'text-gray-500'}`}>
                          +{dayEvents.length - 2}
                        </div>}
                    </div>}
                </div>;
          })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4" style={{
          fontFamily: 'Merriweather, serif'
        }}>
            即将到来
          </h3>
          <div className="space-y-3">
            {events.filter(e => new Date(e.startDate) >= new Date()).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 5).map(event => <div key={event._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-[#1E3A8A] text-white text-xs px-2 py-1 rounded font-medium">
                    {event.startDate.slice(5)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-[#1E293B]">{event.title}</h4>
                    <p className="text-xs text-gray-500">{event.startTime} · {event.location}</p>
                  </div>
                </div>)}
            {events.filter(e => new Date(e.startDate) >= new Date()).length === 0 && <div className="text-center py-4 text-gray-500">
                <p>暂无即将到来的活动</p>
              </div>}
          </div>
        </div>
      </div>

      {/* Create/Edit Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{
            fontFamily: 'Merriweather, serif'
          }}>
              {editingEvent ? '编辑活动' : '添加活动'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日期
              </label>
              <Input type="date" value={selectedDate ? selectedDate.toISOString().split('T')[0] : editingEvent?.startDate || ''} onChange={e => setSelectedDate(new Date(e.target.value))} disabled={!!editingEvent} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题
              </label>
              <Input placeholder="请输入活动标题" value={formData.title} onChange={e => setFormData({
              ...formData,
              title: e.target.value
            })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始时间
              </label>
              <Input type="time" value={formData.startTime} onChange={e => setFormData({
              ...formData,
              startTime: e.target.value
            })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                结束时间
              </label>
              <Input type="time" value={formData.endTime} onChange={e => setFormData({
              ...formData,
              endTime: e.target.value
            })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                地点
              </label>
              <Input placeholder="请输入活动地点" value={formData.location} onChange={e => setFormData({
              ...formData,
              location: e.target.value
            })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <Input placeholder="请输入活动描述" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} />
            </div>
          </div>
          <DialogFooter>
            {editingEvent && <Button variant="destructive" onClick={() => handleDelete(editingEvent._id)} className="mr-auto">
                删除
              </Button>}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-[#1E3A8A] hover:bg-[#1E40AF]">
              {editingEvent ? '更新' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>;
}