import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  CheckSquare, 
  Clock, 
  Trash2, 
  Plus, 
  ArrowUpRight, 
  Search, 
  SlidersHorizontal,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export const TasksView = () => {
  const { 
    tasks, 
    leads, 
    toggleTaskCompletion, 
    deleteTask, 
    saveTask, 
    navigateTo,
    setAddTaskOpen 
  } = useCRM();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'completed', 'all'
  const [priorityFilter, setPriorityFilter] = useState('');
  const [taskSearch, setTaskSearch] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Helper: Format friendly date
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

  const handlePostpone = (task, days) => {
    const currentDueDate = task.dueDate ? new Date(task.dueDate) : new Date();
    currentDueDate.setDate(currentDueDate.getDate() + days);
    const updated = {
      ...task,
      dueDate: currentDueDate.toISOString().split('T')[0]
    };
    saveTask(updated);
  };

  // Filter & Search tasks
  const filteredTasks = tasks.filter(task => {
    // Tab checks
    if (activeTab === 'pending' && task.status !== 'Pending') return false;
    if (activeTab === 'completed' && task.status !== 'Completed') return false;

    // Search query matches title or description
    const query = taskSearch.toLowerCase();
    const matchesSearch = 
      task.title.toLowerCase().includes(query) || 
      (task.description && task.description.toLowerCase().includes(query));

    // Priority filter match
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;

    return matchesSearch && matchesPriority;
  });

  // Sort: Overdue first, then by due date, then time
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'Completed' && b.status !== 'Completed') return 1;
    if (b.status === 'Completed' && a.status !== 'Completed') return -1;
    
    // Sort by due date
    const dateCompare = a.dueDate.localeCompare(b.dueDate);
    if (dateCompare !== 0) return dateCompare;

    // Sort by due time
    return a.dueTime.localeCompare(b.dueTime);
  });

  return (
    <div className="view-content">
      {/* Header */}
      <header className="view-header">
        <div>
          <h1 className="view-title">Task Checklist</h1>
          <p className="view-description">Track sales follow-up calls, emails, and meetings to keep deals warm.</p>
        </div>
        <button 
          onClick={() => setAddTaskOpen(true)} 
          className="action-btn-primary"
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </header>

      {/* Tabs and Filters Row */}
      <section className="search-filter-bar">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search task titles, descriptions..."
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
          />
        </div>

        <div className="filters-wrapper">
          <div className="filter-select-group">
            <SlidersHorizontal size={14} className="filter-icon" />
            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
          
          {(taskSearch || priorityFilter) && (
            <button 
              onClick={() => { setTaskSearch(''); setPriorityFilter(''); }} 
              className="clear-filters-btn"
            >
              Reset
            </button>
          )}
        </div>
      </section>

      {/* Navigation tabs */}
      <div className="tasks-tabs-row">
        <button
          className={`tasks-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <span>Pending tasks</span>
          <span className="tab-count">{tasks.filter(t => t.status === 'Pending').length}</span>
        </button>
        <button
          className={`tasks-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <span>Completed</span>
          <span className="tab-count">{tasks.filter(t => t.status === 'Completed').length}</span>
        </button>
        <button
          className={`tasks-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span>All Tasks</span>
          <span className="tab-count">{tasks.length}</span>
        </button>
      </div>

      {/* Tasks List Container */}
      <div className="tasks-board">
        {sortedTasks.length === 0 ? (
          <div className="empty-section-state">
            <CheckCircle2 size={40} className="empty-state-icon" />
            <p>No tasks found in this section.</p>
          </div>
        ) : (
          <div className="tasks-full-list">
            {sortedTasks.map(task => {
              const lead = leads.find(l => l.id === task.leadId);
              const isOverdue = task.status === 'Pending' && task.dueDate < todayStr;
              
              return (
                <div 
                  key={task.id} 
                  className={`task-row-card ${task.status === 'Completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                >
                  <div className="task-row-checkbox-area">
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => toggleTaskCompletion(task.id)}
                      aria-label="Toggle task completed"
                    />
                  </div>

                  <div className="task-row-content-area">
                    <div className="task-row-header">
                      <h3 className="task-row-title">{task.title}</h3>
                      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="task-row-desc">{task.description}</p>
                    )}

                    <div className="task-row-meta">
                      <span className={`task-meta-item ${isOverdue ? 'text-danger' : ''}`}>
                        <Calendar size={12} />
                        <span>Due: {formatFriendlyDate(task.dueDate)} {task.dueTime ? `at ${task.dueTime}` : ''}</span>
                        {isOverdue && <span className="overdue-tag">Overdue</span>}
                      </span>

                      {lead && (
                        <button 
                          onClick={() => navigateTo('leads', lead.id)}
                          className="task-meta-lead-link"
                        >
                          <ArrowUpRight size={12} />
                          <span>Lead: {lead.name} ({lead.company})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="task-row-actions-area">
                    {task.status === 'Pending' && (
                      <div className="postpone-actions-group">
                        <button 
                          onClick={() => handlePostpone(task, 1)}
                          className="btn-postpone-action"
                        >
                          +1 Day
                        </button>
                        <button 
                          onClick={() => handlePostpone(task, 3)}
                          className="btn-postpone-action"
                        >
                          +3 Days
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => { if(confirm('Delete task?')) deleteTask(task.id); }}
                      className="delete-btn-subtle"
                      aria-label="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
