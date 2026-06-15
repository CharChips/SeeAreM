import React from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Users, 
  CheckCircle2, 
  CalendarClock, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Briefcase,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const DashboardView = () => {
  const { 
    leads, 
    tasks, 
    getStats, 
    navigateTo, 
    toggleTaskCompletion, 
    saveTask 
  } = useCRM();

  const stats = getStats();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Helper: Format relative dates (e.g. "Today", "Yesterday", "Tomorrow", or date string)
  const formatFriendlyDate = (dateStr) => {
    if (dateStr === todayStr) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (dateStr === tomorrowStr) return 'Tomorrow';
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (dateStr === yesterdayStr) return 'Yesterday';

    const [y, m, d] = dateStr.split('-');
    return new Date(y, m - 1, d).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Get tasks due today (Pending)
  const todayTasks = tasks.filter(t => t.status === 'Pending' && t.dueDate === todayStr);

  // Get overdue tasks (Pending, due date < today)
  const overdueTasks = tasks.filter(t => {
    if (t.status !== 'Pending' || !t.dueDate) return false;
    if (t.dueDate < todayStr) return true;
    // Overdue if today and past the due time
    if (t.dueDate === todayStr && t.dueTime) {
      const [h, m] = t.dueTime.split(':');
      const dueTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      return dueTime < now;
    }
    return false;
  });

  // Get upcoming tasks (Next 7 days, excluding today)
  const next7DaysStr = [];
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date();
    nextDate.setDate(now.getDate() + i);
    next7DaysStr.push(nextDate.toISOString().split('T')[0]);
  }
  const upcomingTasks = tasks
    .filter(t => t.status === 'Pending' && next7DaysStr.includes(t.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.dueTime.localeCompare(b.dueTime));

  // Get recently added leads
  const recentLeads = [...leads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  // Quick reschedule (+1 day)
  const handleQuickPostpone = (task) => {
    const taskDate = new Date();
    taskDate.setDate(now.getDate() + 1);
    const updatedTask = {
      ...task,
      dueDate: taskDate.toISOString().split('T')[0]
    };
    saveTask(updatedTask);
  };

  return (
    <div className="view-content">
      {/* Header */}
      <header className="view-header">
        <div>
          <h1 className="view-title">Dashboard</h1>
          <p className="view-description">Welcome back! Here is your follow-up summary for today.</p>
        </div>
        <div className="header-date">
          <Clock size={16} />
          <span>{now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card" onClick={() => navigateTo('leads')}>
          <div className="stat-icon-wrapper leads-glow">
            <Users className="stat-icon" />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Leads</span>
            <h3 className="stat-number">{stats.totalLeads}</h3>
          </div>
          <ChevronRight className="stat-arrow" size={18} />
        </div>

        <div className="stat-card" onClick={() => navigateTo('tasks')}>
          <div className="stat-icon-wrapper pending-glow">
            <CheckCircle2 className="stat-icon" />
          </div>
          <div className="stat-details">
            <span className="stat-label">Pending Follow-Ups</span>
            <h3 className="stat-number">{stats.pendingFollowupsCount}</h3>
          </div>
          <ChevronRight className="stat-arrow" size={18} />
        </div>

        <div className="stat-card" onClick={() => navigateTo('tasks')}>
          <div className={`stat-icon-wrapper ${stats.tasksDueToday > 0 ? 'today-glow-active' : 'today-glow'}`}>
            <CalendarClock className="stat-icon" />
          </div>
          <div className="stat-details">
            <span className="stat-label">Due Today</span>
            <h3 className="stat-number">{stats.tasksDueToday}</h3>
          </div>
          <ChevronRight className="stat-arrow" size={18} />
        </div>

        <div className="stat-card" onClick={() => navigateTo('tasks')}>
          <div className={`stat-icon-wrapper ${stats.overdueTasks > 0 ? 'overdue-glow-active' : 'overdue-glow'}`}>
            <AlertTriangle className="stat-icon" />
          </div>
          <div className="stat-details">
            <span className="stat-label">Overdue Tasks</span>
            <h3 className="stat-number">{stats.overdueTasks}</h3>
          </div>
          <ChevronRight className="stat-arrow" size={18} />
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="dashboard-columns">
        {/* Left Column: Tasks */}
        <div className="dashboard-main-col">
          {/* Today's Tasks */}
          <div className="dashboard-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">Today's Tasks</h2>
              <span className="task-count-badge">{todayTasks.length} pending</span>
            </div>
            
            {todayTasks.length === 0 ? (
              <div className="empty-section-state">
                <CheckCircle2 size={40} className="empty-state-icon text-success" />
                <p>All clear! No pending tasks due today.</p>
              </div>
            ) : (
              <div className="task-list-container">
                {todayTasks.map(task => {
                  const leadName = leads.find(l => l.id === task.leadId)?.name || 'Unknown Lead';
                  return (
                    <div key={task.id} className="dashboard-task-item">
                      <div className="task-item-main">
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={task.status === 'Completed'}
                          onChange={() => toggleTaskCompletion(task.id)}
                          aria-label="Mark task completed"
                        />
                        <div className="task-details">
                          <h4 className="task-title-text">{task.title}</h4>
                          <div className="task-meta">
                            <span className="task-due-time">
                              <Clock size={12} />
                              {task.dueTime || 'No Time'}
                            </span>
                            <span className="task-lead-link" onClick={() => navigateTo('leads', task.leadId)}>
                              Ref: {leadName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="task-item-actions">
                        <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <div className="dashboard-section-card border-danger-glow">
              <div className="section-card-header">
                <div className="header-title-group">
                  <AlertTriangle className="text-danger animate-pulse" size={20} />
                  <h2 className="section-card-title text-danger">Overdue Tasks</h2>
                </div>
                <span className="task-count-badge bg-danger-glow text-danger">{overdueTasks.length} overdue</span>
              </div>
              
              <div className="task-list-container">
                {overdueTasks.map(task => {
                  const leadName = leads.find(l => l.id === task.leadId)?.name || 'Unknown Lead';
                  return (
                    <div key={task.id} className="dashboard-task-item border-left-danger">
                      <div className="task-item-main">
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={task.status === 'Completed'}
                          onChange={() => toggleTaskCompletion(task.id)}
                          aria-label="Mark task completed"
                        />
                        <div className="task-details">
                          <h4 className="task-title-text text-danger-hover">{task.title}</h4>
                          <div className="task-meta">
                            <span className="task-due-date text-danger">
                              {formatFriendlyDate(task.dueDate)} {task.dueTime}
                            </span>
                            <span className="task-lead-link" onClick={() => navigateTo('leads', task.leadId)}>
                              Ref: {leadName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="task-item-actions">
                        <button
                          className="action-btn-postpone"
                          onClick={() => handleQuickPostpone(task)}
                        >
                          +1 Day
                        </button>
                        <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Follow-Ups */}
          <div className="dashboard-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">Next 7 Days</h2>
              <span className="task-count-badge bg-secondary-glow">{upcomingTasks.length} tasks</span>
            </div>
            
            {upcomingTasks.length === 0 ? (
              <div className="empty-section-state">
                <p>No upcoming tasks scheduled for the next 7 days.</p>
              </div>
            ) : (
              <div className="task-list-container">
                {upcomingTasks.map(task => {
                  const leadName = leads.find(l => l.id === task.leadId)?.name || 'Unknown Lead';
                  return (
                    <div key={task.id} className="dashboard-task-item">
                      <div className="task-item-main">
                        <div className="task-details no-checkbox">
                          <h4 className="task-title-text">{task.title}</h4>
                          <div className="task-meta">
                            <span className="task-due-date">
                              {formatFriendlyDate(task.dueDate)} {task.dueTime ? `at ${task.dueTime}` : ''}
                            </span>
                            <span className="task-lead-link" onClick={() => navigateTo('leads', task.leadId)}>
                              Ref: {leadName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="task-item-actions">
                        <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leads */}
        <div className="dashboard-side-col">
          <div className="dashboard-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">Recent Leads</h2>
              <button 
                onClick={() => navigateTo('leads')} 
                className="view-all-link"
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {recentLeads.length === 0 ? (
              <div className="empty-section-state">
                <p>No leads added yet. Click "Add Lead" in the sidebar to start.</p>
              </div>
            ) : (
              <div className="dashboard-lead-list">
                {recentLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    className="dashboard-lead-item"
                    onClick={() => navigateTo('leads', lead.id)}
                  >
                    <div className="lead-item-header">
                      <div className="lead-name-group">
                        <span className="lead-name-text">{lead.name}</span>
                        <span className="lead-company-text">{lead.company}</span>
                      </div>
                      <span className={`status-pill status-${(lead.status || 'New Lead').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        {lead.status || 'New Lead'}
                      </span>
                    </div>
                    <div className="lead-item-details">
                      {lead.role && <span className="lead-role">{lead.role}</span>}
                      {lead.industry && (
                        <span className="lead-industry-tag">
                          <Briefcase size={12} />
                          {lead.industry}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tip Widget */}
          <div className="tip-widget">
            <TrendingUp size={24} className="tip-icon" />
            <div className="tip-content">
              <h4 className="tip-title">Smart Follow-Up Tip</h4>
              <p className="tip-text">Always log outcome after calling. The CRM will automatically prompt a rescheduling shortcut to avoid leaving a lead cold.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
