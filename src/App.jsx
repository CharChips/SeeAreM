import React, { useState, useEffect } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { TasksView } from './components/TasksView';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { OutreachView } from './components/OutreachView';
import { TimeComparisonView } from './components/TimeComparisonView';
import { TemplatesView } from './components/TemplatesView';
import { PreDemoNotesView } from './components/PreDemoNotesView';
import { X, Plus, AlertCircle } from 'lucide-react';
import './App.css';

function AppContent() {
  const {
    currentView,
    leads,
    addTaskOpen,
    setAddTaskOpen,
    activeTaskLeadId,
    setActiveTaskLeadId,
    saveTask,
    navigateTo
  } = useCRM();

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    leadId: '',
    dueDate: '',
    dueTime: '10:00',
    priority: 'Medium',
    status: 'Pending'
  });

  // Prefill default date (tomorrow) when modal opens
  useEffect(() => {
    if (addTaskOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setTaskForm({
        title: '',
        description: '',
        leadId: activeTaskLeadId || '',
        dueDate: tomorrow.toISOString().split('T')[0],
        dueTime: '10:00',
        priority: 'Medium',
        status: 'Pending'
      });
    }
  }, [addTaskOpen, activeTaskLeadId]);

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    saveTask({
      ...taskForm,
      leadId: taskForm.leadId || null
    });

    setAddTaskOpen(false);
  };

  // Render active view
  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'leads':
        return <LeadsView />;
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      case 'outreach':
        return <OutreachView />;
      case 'timecomparison':
        return <TimeComparisonView key="timecomparison1" />;
      case 'timecomparison2':
        return <TimeComparisonView key="timecomparison2" />;
      case 'playbook':
        return <TemplatesView />;
      case 'predemonotes':
        return <PreDemoNotesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-layout">
      {/* Background radial/mesh glows */}
      <div className="bg-glow-orb"></div>
      <div className="bg-glow-orb-secondary"></div>

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Pane */}
      <main className="app-main-pane">
        {renderActiveView()}
      </main>

      {/* Global Quick Add Task Modal */}
      {addTaskOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Create Follow-up Task</h3>
              <button 
                onClick={() => setAddTaskOpen(false)} 
                className="modal-close-btn"
                aria-label="Close task modal"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTaskSubmit} className="modal-form">
              <div className="form-item">
                <label htmlFor="global-task-title" className="input-label">Task Title *</label>
                <input
                  id="global-task-title"
                  type="text"
                  className="name-input"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Call back to discuss pricing deck..."
                  required
                />
              </div>

              <div className="form-item">
                <label htmlFor="global-task-desc" className="input-label">Description / Next Steps</label>
                <textarea
                  id="global-task-desc"
                  placeholder="Provide call conditions, voicemail summaries, or follow-up notes..."
                  className="note-textarea"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                ></textarea>
              </div>

              <div className="form-group-row">
                <div className="form-item">
                  <label htmlFor="global-task-lead-select" className="input-label">Associate Lead / Account</label>
                  <select
                    id="global-task-lead-select"
                    className="name-input"
                    value={taskForm.leadId}
                    onChange={(e) => setTaskForm({ ...taskForm, leadId: e.target.value })}
                    disabled={!!activeTaskLeadId}
                  >
                    <option value="">-- No Association --</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-item">
                  <label htmlFor="global-task-priority" className="input-label">Task Priority</label>
                  <select
                    id="global-task-priority"
                    className="name-input"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-item">
                  <label htmlFor="global-task-date" className="input-label">Due Date *</label>
                  <input
                    id="global-task-date"
                    type="date"
                    className="name-input"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-item">
                  <label htmlFor="global-task-time" className="input-label">Due Time *</label>
                  <input
                    id="global-task-time"
                    type="time"
                    className="name-input"
                    value={taskForm.dueTime}
                    onChange={(e) => setTaskForm({ ...taskForm, dueTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  onClick={() => setAddTaskOpen(false)} 
                  className="theme-button"
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <CRMProvider>
      <AppContent />
    </CRMProvider>
  );
}

export default App;
