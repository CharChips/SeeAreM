import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Calendar as CalendarIcon,
  Check,
  Trash2,
  X
} from 'lucide-react';

export const CalendarView = () => {
  const { 
    tasks, 
    leads, 
    saveTask, 
    toggleTaskCompletion, 
    deleteTask,
    navigateTo,
    setAddTaskOpen,
    setActiveTaskLeadId 
  } = useCRM();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState('month'); // 'month', 'week', 'day'
  const [selectedTask, setSelectedTask] = useState(null); // Task object currently clicked for edit
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper date generators
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  // Navigations
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (calendarMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (calendarMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (calendarMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (calendarMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Quick Reschedule handler
  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTask || !editDate) return;
    saveTask({
      ...selectedTask,
      dueDate: editDate,
      dueTime: editTime
    });
    setSelectedTask(null);
  };

  const openRescheduleBox = (task, e) => {
    e.stopPropagation(); // Avoid cell click triggers
    setSelectedTask(task);
    setEditDate(task.dueDate);
    setEditTime(task.dueTime || '10:00');
  };

  // --- MONTH VIEW LOGIC ---
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const cells = [];
    
    // Pad previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonthDate = new Date(year, month - 1, dayNum);
      const dateStr = prevMonthDate.toISOString().split('T')[0];
      cells.push({ day: dayNum, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentMonthDate = new Date(year, month, i);
      const dateStr = currentMonthDate.toISOString().split('T')[0];
      cells.push({ day: i, dateStr, isCurrentMonth: true });
    }

    // Pad next month days to complete grid (multiples of 7)
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const nextMonthPadding = totalCells - cells.length;
    for (let i = 1; i <= nextMonthPadding; i++) {
      const nextMonthDate = new Date(year, month + 1, i);
      const dateStr = nextMonthDate.toISOString().split('T')[0];
      cells.push({ day: i, dateStr, isCurrentMonth: false });
    }

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="calendar-grid-month">
        {/* Weekday headers */}
        <div className="grid-weekdays-row">
          {weekdays.map(d => <div key={d} className="weekday-header-cell">{d}</div>)}
        </div>

        {/* Days grid */}
        <div className="grid-days-container">
          {cells.map((cell, idx) => {
            const dayTasks = tasks.filter(t => t.dueDate === cell.dateStr);
            const isToday = cell.dateStr === todayStr;

            return (
              <div 
                key={idx} 
                className={`day-cell ${cell.isCurrentMonth ? '' : 'day-muted'} ${isToday ? 'day-today' : ''}`}
                onClick={() => {
                  // Pre-fill task form date and open modal
                  setActiveTaskLeadId(null);
                  setAddTaskOpen(true);
                  // We can store cell.dateStr temporarily or just open modal
                }}
              >
                <div className="day-number-label">{cell.day}</div>
                <div className="day-cell-tasks-area">
                  {dayTasks.slice(0, 3).map(task => {
                    const lead = leads.find(l => l.id === task.leadId);
                    const isCompleted = task.status === 'Completed';
                    return (
                      <div 
                        key={task.id} 
                        className={`calendar-task-badge priority-${task.priority.toLowerCase()} ${isCompleted ? 'badge-completed' : ''}`}
                        onClick={(e) => openRescheduleBox(task, e)}
                        title={`${task.title} (Ref: ${lead?.name || 'No Lead'})`}
                      >
                        <span className="badge-text">{task.title}</span>
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="calendar-tasks-more">+{dayTasks.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- WEEK VIEW LOGIC ---
  const renderWeekView = () => {
    // Find Sunday of the current week
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      weekDays.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        dayLabel: d.toLocaleDateString([], { weekday: 'short' }),
        numLabel: d.getDate()
      });
    }

    return (
      <div className="calendar-grid-week">
        {weekDays.map((wd, idx) => {
          const dayTasks = tasks.filter(t => t.dueDate === wd.dateStr);
          const isToday = wd.dateStr === todayStr;

          return (
            <div key={idx} className={`week-col ${isToday ? 'week-col-today' : ''}`}>
              <div className="week-col-header">
                <span className="week-day-name">{wd.dayLabel}</span>
                <span className="week-day-number">{wd.numLabel}</span>
              </div>
              <div className="week-col-tasks-list">
                {dayTasks.length === 0 ? (
                  <div className="week-empty-text">No tasks</div>
                ) : (
                  dayTasks.map(task => {
                    const lead = leads.find(l => l.id === task.leadId);
                    const isCompleted = task.status === 'Completed';
                    return (
                      <div 
                        key={task.id} 
                        className={`week-task-card priority-${task.priority.toLowerCase()} ${isCompleted ? 'completed' : ''}`}
                        onClick={(e) => openRescheduleBox(task, e)}
                      >
                        <h4 className="week-task-title">{task.title}</h4>
                        {task.dueTime && (
                          <div className="week-task-time">
                            <Clock size={10} />
                            <span>{task.dueTime}</span>
                          </div>
                        )}
                        {lead && (
                          <div 
                            className="week-task-lead"
                            onClick={(e) => { e.stopPropagation(); navigateTo('leads', lead.id); }}
                          >
                            Ref: {lead.name}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- DAY VIEW LOGIC ---
  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);

    return (
      <div className="calendar-grid-day">
        <div className="day-view-container">
          <div className="day-view-header">
            <span className="day-header-full-date">
              Schedule for {currentDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="day-header-count">{dayTasks.length} tasks scheduled</span>
          </div>

          {dayTasks.length === 0 ? (
            <div className="empty-section-state">
              <CheckCircle2 size={40} className="empty-state-icon text-success" />
              <p>No follow-ups or callbacks scheduled for today.</p>
            </div>
          ) : (
            <div className="day-schedule-list">
              {dayTasks
                .sort((a, b) => a.dueTime.localeCompare(b.dueTime))
                .map(task => {
                  const lead = leads.find(l => l.id === task.leadId);
                  const isCompleted = task.status === 'Completed';
                  return (
                    <div key={task.id} className={`day-schedule-item priority-${task.priority.toLowerCase()} ${isCompleted ? 'completed' : ''}`}>
                      <div className="schedule-item-time">
                        <Clock size={14} />
                        <span>{task.dueTime || '—'}</span>
                      </div>
                      
                      <div className="schedule-item-details">
                        <h4 className="schedule-item-title">{task.title}</h4>
                        {task.description && <p className="schedule-item-desc">{task.description}</p>}
                        
                        {lead && (
                          <button 
                            onClick={() => navigateTo('leads', lead.id)}
                            className="schedule-item-lead-link"
                          >
                            Ref: {lead.name} ({lead.company})
                          </button>
                        )}
                      </div>

                      <div className="schedule-item-actions">
                        <button
                          className="schedule-item-btn-check"
                          onClick={() => toggleTaskCompletion(task.id)}
                          aria-label="Toggle task completion"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="schedule-item-btn-resched"
                          onClick={(e) => openRescheduleBox(task, e)}
                        >
                          Reschedule
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

  // Header display label helper
  const getHeaderLabel = () => {
    if (calendarMode === 'month') {
      return currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
    } else if (calendarMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      const startMonth = start.toLocaleDateString([], { month: 'short' });
      const endMonth = end.toLocaleDateString([], { month: 'short' });
      
      if (startMonth === endMonth) {
        return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return currentDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="view-content calendar-layout">
      {/* Header controls */}
      <header className="view-header">
        <div className="calendar-header-nav">
          <h1 className="view-title">{getHeaderLabel()}</h1>
          
          <div className="nav-arrows-group">
            <button onClick={handlePrev} className="btn-nav-arrow" aria-label="Previous date range">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleToday} className="btn-nav-today">
              Today
            </button>
            <button onClick={handleNext} className="btn-nav-arrow" aria-label="Next date range">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Mode Select Tabs */}
        <div className="calendar-modes-row">
          <button
            className={`calendar-mode-btn ${calendarMode === 'month' ? 'active' : ''}`}
            onClick={() => setCalendarMode('month')}
          >
            Month
          </button>
          <button
            className={`calendar-mode-btn ${calendarMode === 'week' ? 'active' : ''}`}
            onClick={() => setCalendarMode('week')}
          >
            Week
          </button>
          <button
            className={`calendar-mode-btn ${calendarMode === 'day' ? 'active' : ''}`}
            onClick={() => setCalendarMode('day')}
          >
            Day
          </button>
        </div>
      </header>

      {/* Render selected view */}
      <div className="calendar-body-card">
        {calendarMode === 'month' && renderMonthView()}
        {calendarMode === 'week' && renderWeekView()}
        {calendarMode === 'day' && renderDayView()}
      </div>

      {/* Reschedule Popover Modal overlay */}
      {selectedTask && (
        <div className="modal-overlay z-index-top">
          <div className="modal-container modal-sm">
            <div className="modal-header">
              <h3 className="modal-title">Reschedule Task</h3>
              <button onClick={() => setSelectedTask(null)} className="modal-close-btn" aria-label="Close reschedule modal">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRescheduleSubmit} className="modal-form">
              <div className="task-preview-info">
                <h4 className="resched-task-title">{selectedTask.title}</h4>
                <p className="resched-task-desc">{selectedTask.description || 'No description provided.'}</p>
              </div>

              <div className="form-item">
                <label htmlFor="resched-date-input" className="input-label">New Due Date</label>
                <input
                  id="resched-date-input"
                  type="date"
                  className="name-input"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-item">
                <label htmlFor="resched-time-input" className="input-label">New Due Time</label>
                <input
                  id="resched-time-input"
                  type="time"
                  className="name-input"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  required
                />
              </div>

              <div className="resched-actions-panel">
                <button
                  type="button"
                  onClick={() => {
                    toggleTaskCompletion(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className={`theme-button ${selectedTask.status === 'Completed' ? 'text-warning' : 'text-success'}`}
                >
                  {selectedTask.status === 'Completed' ? 'Mark Pending' : 'Mark Completed'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete task?')) {
                      deleteTask(selectedTask.id);
                      setSelectedTask(null);
                    }
                  }}
                  className="theme-button text-danger"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>

              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  onClick={() => setSelectedTask(null)} 
                  className="theme-button"
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
