import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Calendar, 
  Settings, 
  UserPlus, 
  PlusCircle, 
  Menu, 
  X,
  Globe,
  Clock,
  BookOpen,
  ClipboardList
} from 'lucide-react';

export const Sidebar = () => {
  const { currentView, navigateTo, setAddLeadOpen, setAddTaskOpen } = useCRM();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'outreach', label: 'Outreach Intel', icon: Globe },
    { id: 'timecomparison', label: 'Time Comparison', icon: Clock },
    { id: 'timecomparison2', label: 'Time Comparison 2', icon: Clock },
    { id: 'playbook', label: 'Playbook Library', icon: BookOpen },
    { id: 'predemonotes', label: 'Pre-Demo Notes', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (viewId) => {
    navigateTo(viewId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-header">
        <div className="mobile-logo-area">
          <div className="logo-icon-g"></div>
          <span className="logo-text">FollowUp</span>
        </div>
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-graphic">
            <span className="logo-spark"></span>
          </div>
          <div className="logo-details">
            <span className="logo-title">FollowUp</span>
            <span className="logo-subtitle">Sales Companion</span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {isActive && <span className="nav-indicator-dot"></span>}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions Section */}
        <div className="sidebar-actions">
          <div className="actions-header">Quick Action</div>
          <button
            onClick={() => {
              setAddLeadOpen(true);
              setMobileOpen(false);
            }}
            className="action-btn-secondary"
          >
            <UserPlus size={16} />
            <span>Add Lead</span>
          </button>
          
          <button
            onClick={() => {
              setAddTaskOpen(true);
              setMobileOpen(false);
            }}
            className="action-btn-primary"
          >
            <PlusCircle size={16} />
            <span>Add Task</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="version-info">v1.1.0 • Stable Local</div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setMobileOpen(false)}
        ></div>
      )}
    </>
  );
};
