// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Plus, Edit2, Trash2, Pin, PinOff, X, Search } from 'lucide-react';
// @ts-ignore;
import { useToast, Button, Input, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';

import { TabBar } from '@/components/TabBar';
export default function Announcements(props) {
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('announcements');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: ''
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
    loadAnnouncements();
  }, []);
  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const result = await props.$w.cloud.callDataSource({
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
          pageSize: 200,
          pageNumber: 1
        }
      });
      setAnnouncements(result.records || []);
    } catch (error) {
      console.error('加载公告失败:', error);
      toast({
        title: '加载失败',
        description: error.message || '无法加载公告',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const filteredAnnouncements = announcements.filter(a => a.title && a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content && a.content.toLowerCase().includes(searchQuery.toLowerCase()));
  const handleCreate = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      author: currentUser?.name || ''
    });
    setIsDialogOpen(true);
  };
  const handleEdit = announcement => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      author: announcement.author || ''
    });
    setIsDialogOpen(true);
  };
  const handleDelete = async id => {
    try {
      await props.$w.cloud.callDataSource({
        dataSourceName: 'announcements',
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
      setAnnouncements(announcements.filter(a => a._id !== id));
      toast({
        title: '删除成功',
        description: '公告已删除',
        variant: 'default'
      });
    } catch (error) {
      console.error('删除公告失败:', error);
      toast({
        title: '删除失败',
        description: error.message || '无法删除公告',
        variant: 'destructive'
      });
    }
  };
  const handleTogglePin = async id => {
    const announcement = announcements.find(a => a._id === id);
    if (!announcement) return;
    try {
      await props.$w.cloud.callDataSource({
        dataSourceName: 'announcements',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            isPinned: !announcement.isPinned
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
      setAnnouncements(announcements.map(a => a._id === id ? {
        ...a,
        isPinned: !a.isPinned
      } : a));
      toast({
        title: '操作成功',
        description: '公告置顶状态已更新',
        variant: 'default'
      });
    } catch (error) {
      console.error('更新置顶状态失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '无法更新置顶状态',
        variant: 'destructive'
      });
    }
  };
  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: '验证失败',
        description: '标题和内容不能为空',
        variant: 'destructive'
      });
      return;
    }
    try {
      if (editingAnnouncement) {
        await props.$w.cloud.callDataSource({
          dataSourceName: 'announcements',
          methodName: 'wedaUpdateV2',
          params: {
            data: {
              title: formData.title,
              content: formData.content,
              author: formData.author
            },
            filter: {
              where: {
                $and: [{
                  _id: {
                    $eq: editingAnnouncement._id
                  }
                }]
              }
            }
          }
        });
        setAnnouncements(announcements.map(a => a._id === editingAnnouncement._id ? {
          ...a,
          title: formData.title,
          content: formData.content,
          author: formData.author
        } : a));
        toast({
          title: '更新成功',
          description: '公告已更新',
          variant: 'default'
        });
      } else {
        const result = await props.$w.cloud.callDataSource({
          dataSourceName: 'announcements',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              title: formData.title,
              content: formData.content,
              author: formData.author || currentUser?.name || '用户',
              date: new Date().toISOString().split('T')[0],
              isPinned: false
            }
          }
        });
        const newAnnouncement = {
          _id: result.id,
          title: formData.title,
          content: formData.content,
          date: new Date().toISOString().split('T')[0],
          author: formData.author || currentUser?.name || '用户',
          isPinned: false
        };
        setAnnouncements([newAnnouncement, ...announcements]);
        toast({
          title: '发布成功',
          description: '公告已发布',
          variant: 'default'
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('提交失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '无法保存公告',
        variant: 'destructive'
      });
    }
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
      <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-1" style={{
          fontFamily: 'Merriweather, serif'
        }}>
            公告管理
          </h1>
          <p className="text-blue-100 text-sm">发布和管理课题组公告</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input placeholder="搜索公告..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-white shadow-sm" />
        </div>

        {/* Create Button */}
        <Button onClick={handleCreate} className="w-full mb-4 bg-[#1E3A8A] hover:bg-[#1E40AF]">
          <Plus size={20} className="mr-2" />
          发布公告
        </Button>

        {/* Announcement List */}
        <div className="space-y-3">
          {filteredAnnouncements.map(announcement => <div key={announcement._id} className={`bg-white rounded-xl shadow-sm p-4 ${announcement.isPinned ? 'border-l-4 border-[#1E3A8A]' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-[#1E293B] mb-1">
                    {announcement.isPinned && <span className="inline-block bg-[#1E3A8A] text-white text-xs px-2 py-0.5 rounded mr-2">
                        置顶
                      </span>}
                    {announcement.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {announcement.author} · {announcement.date}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => handleTogglePin(announcement._id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={announcement.isPinned ? '取消置顶' : '置顶'}>
                    {announcement.isPinned ? <PinOff size={18} className="text-gray-600" /> : <Pin size={18} className="text-gray-600" />}
                  </button>
                  <button onClick={() => handleEdit(announcement)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="编辑">
                    <Edit2 size={18} className="text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(announcement._id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="删除">
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{announcement.content}</p>
            </div>)}

          {filteredAnnouncements.length === 0 && <div className="text-center py-12 text-gray-500">
              <p>暂无公告</p>
            </div>}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{
            fontFamily: 'Merriweather, serif'
          }}>
              {editingAnnouncement ? '编辑公告' : '发布公告'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题
              </label>
              <Input placeholder="请输入公告标题" value={formData.title} onChange={e => setFormData({
              ...formData,
              title: e.target.value
            })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                发布人
              </label>
              <Input placeholder="请输入发布人姓名" value={formData.author} onChange={e => setFormData({
              ...formData,
              author: e.target.value
            })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容
              </label>
              <Textarea placeholder="请输入公告内容" value={formData.content} onChange={e => setFormData({
              ...formData,
              content: e.target.value
            })} rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-[#1E3A8A] hover:bg-[#1E40AF]">
              {editingAnnouncement ? '更新' : '发布'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>;
}