// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Home, FileText, Calendar, FolderOpen, CheckSquare } from 'lucide-react';

export function TabBar({
  activeTab,
  onTabChange
}) {
  const tabs = [{
    id: 'dashboard',
    label: '首页',
    icon: Home
  }, {
    id: 'announcements',
    label: '公告',
    icon: FileText
  }, {
    id: 'calendar',
    label: '日历',
    icon: Calendar
  }, {
    id: 'files',
    label: '文件',
    icon: FolderOpen
  }, {
    id: 'tasks',
    label: '任务',
    icon: CheckSquare
  }];
  return <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 transition-all duration-200 ${isActive ? 'text-[#1E3A8A]' : 'text-gray-500'}`}>
              <Icon size={24} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>;
      })}
      </div>
    </div>;
}