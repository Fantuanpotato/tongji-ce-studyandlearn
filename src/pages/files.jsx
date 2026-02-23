// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Plus, FileText, Link as LinkIcon, Trash2, Download, Search, Folder } from 'lucide-react';
// @ts-ignore;
import { useToast, Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';

import { TabBar } from '@/components/TabBar';
export default function Files(props) {
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('file'); // 'file' or 'link'
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
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
    loadFiles();
  }, []);
  const loadFiles = async () => {
    try {
      setLoading(true);
      const result = await props.$w.cloud.callDataSource({
        dataSourceName: 'files',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {}
          },
          orderBy: [{
            uploadDate: 'desc'
          }],
          select: {
            $master: true
          },
          pageSize: 200,
          pageNumber: 1
        }
      });
      setFiles(result.records || []);
    } catch (error) {
      console.error('加载文件失败:', error);
      toast({
        title: '加载失败',
        description: error.message || '无法加载文件',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const fileItems = filteredFiles.filter(f => f.type === 'file');
  const linkItems = filteredFiles.filter(f => f.type === 'link');
  const handleAddFile = () => {
    setDialogType('file');
    setFormData({
      name: '',
      url: '',
      description: ''
    });
    setIsDialogOpen(true);
  };
  const handleAddLink = () => {
    setDialogType('link');
    setFormData({
      name: '',
      url: '',
      description: ''
    });
    setIsDialogOpen(true);
  };
  const handleDelete = async id => {
    try {
      await props.$w.cloud.callDataSource({
        dataSourceName: 'files',
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
      setFiles(files.filter(f => f._id !== id));
      toast({
        title: '删除成功',
        description: '文件已删除',
        variant: 'default'
      });
    } catch (error) {
      console.error('删除文件失败:', error);
      toast({
        title: '删除失败',
        description: error.message || '无法删除文件',
        variant: 'destructive'
      });
    }
  };
  const handleDownload = file => {
    toast({
      title: '下载开始',
      description: `正在下载 ${file.name}`,
      variant: 'default'
    });
  };
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: '验证失败',
        description: '名称不能为空',
        variant: 'destructive'
      });
      return;
    }
    if (dialogType === 'link' && !formData.url.trim()) {
      toast({
        title: '验证失败',
        description: '链接不能为空',
        variant: 'destructive'
      });
      return;
    }
    try {
      const result = await props.$w.cloud.callDataSource({
        dataSourceName: 'files',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            name: formData.name,
            type: dialogType,
            ...(dialogType === 'link' ? {
              url: formData.url
            } : {}),
            uploader: currentUser?.name || '用户',
            uploadDate: new Date().toISOString().split('T')[0],
            description: formData.description
          }
        }
      });
      const newItem = {
        _id: result.id,
        name: formData.name,
        type: dialogType,
        ...(dialogType === 'link' ? {
          url: formData.url
        } : {}),
        uploadDate: new Date().toISOString().split('T')[0],
        uploader: currentUser?.name || '用户',
        description: formData.description
      };
      setFiles([newItem, ...files]);
      toast({
        title: '添加成功',
        description: dialogType === 'file' ? '文件已添加' : '链接已添加',
        variant: 'default'
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('添加失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '无法添加文件',
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
            文件资源
          </h1>
          <p className="text-blue-100 text-sm">共享和管理课题组文件</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input placeholder="搜索文件..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-white shadow-sm" />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mb-4">
          <Button onClick={handleAddFile} className="flex-1 bg-[#1E3A8A] hover:bg-[#1E40AF]">
            <Plus size={20} className="mr-2" />
            上传文件
          </Button>
          <Button onClick={handleAddLink} variant="outline" className="flex-1 border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50">
            <LinkIcon size={20} className="mr-2" />
            添加链接
          </Button>
        </div>

        {/* File List */}
        <Tabs defaultValue="files" className="bg-white rounded-xl shadow-sm">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files">文件</TabsTrigger>
            <TabsTrigger value="links">链接</TabsTrigger>
          </TabsList>
          <TabsContent value="files" className="p-4">
            <div className="space-y-3">
              {fileItems.map(file => <div key={file._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText size={24} className="text-[#1E3A8A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#1E293B] truncate">{file.name}</h3>
                    <p className="text-xs text-gray-500">
                      {file.uploadDate}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => handleDownload(file)} className="p-2 hover:bg-white rounded-lg transition-colors" title="下载">
                      <Download size={18} className="text-blue-600" />
                    </button>
                    <button onClick={() => handleDelete(file._id)} className="p-2 hover:bg-white rounded-lg transition-colors" title="删除">
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>)}
              {fileItems.length === 0 && <div className="text-center py-8 text-gray-500">
                  <p>暂无文件</p>
                </div>}
            </div>
          </TabsContent>
          <TabsContent value="links" className="p-4">
            <div className="space-y-3">
              {linkItems.map(link => <div key={link._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <LinkIcon size={24} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#1E293B] truncate">{link.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{link.url}</p>
                  </div>
                  <button onClick={() => handleDelete(link._id)} className="p-2 hover:bg-white rounded-lg transition-colors" title="删除">
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>)}
              {linkItems.length === 0 && <div className="text-center py-8 text-gray-500">
                  <p>暂无链接</p>
                </div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add File/Link Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{
            fontFamily: 'Merriweather, serif'
          }}>
              {dialogType === 'file' ? '上传文件' : '添加链接'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                名称
              </label>
              <Input placeholder={dialogType === 'file' ? '请输入文件名' : '请输入链接名称'} value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} />
            </div>
            {dialogType === 'link' && <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  链接地址
                </label>
                <Input placeholder="请输入链接地址" value={formData.url} onChange={e => setFormData({
              ...formData,
              url: e.target.value
            })} />
              </div>}
            {dialogType === 'file' && <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Folder size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">点击或拖拽文件到此处上传</p>
                <p className="text-xs text-gray-400 mt-1">支持 docx, xlsx, pdf 等格式</p>
              </div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <Input placeholder="请输入描述（可选）" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-[#1E3A8A] hover:bg-[#1E40AF]">
              {dialogType === 'file' ? '上传' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>;
}