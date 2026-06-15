import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../services/db';

const CRMContext = createContext();

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error('useCRM must be used within a CRMProvider');
  return context;
};

export const CRMProvider = ({ children }) => {
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [actions, setActions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [settings, setSettings] = useState({});
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [outreachBuckets, setOutreachBuckets] = useState([]);
  const [countryConfigs, setCountryConfigs] = useState({});
  const [outreachHistory, setOutreachHistory] = useState([]);
  const [accountExecutives, setAccountExecutives] = useState([]);
  const [aeDemos, setAeDemos] = useState([]);
  const [playbookCategories, setPlaybookCategories] = useState([]);
  const [playbookTemplates, setPlaybookTemplates] = useState([]);
  
  // Modals state
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [activeTaskLeadId, setActiveTaskLeadId] = useState(null);

  // Keep track of triggered notifications for this session to prevent duplicate popups
  const triggeredNotifications = useRef(new Set());

  // Load initial data
  const loadData = () => {
    setLeads(db.getLeads());
    setTasks(db.getTasks());
    setActions(db.getActions());
    setNotes(db.getNotes());
    setSettings(db.getSettings());
    setOutreachBuckets(db.getOutreachBuckets());
    setCountryConfigs(db.getCountryConfigs());
    setOutreachHistory(db.getOutreachHistory());
    setAccountExecutives(db.getAccountExecutives());
    setAeDemos(db.getAEDemos());
    setPlaybookCategories(db.getPlaybookCategories());
    setPlaybookTemplates(db.getPlaybookTemplates());
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      console.log("Supabase sync completed. Reloading database state...");
      loadData();
    };

    window.addEventListener('db-synced', handleSync);
    return () => {
      window.removeEventListener('db-synced', handleSync);
    };
  }, []);

  // Sync tasks check for notification reminders every 30 seconds
  useEffect(() => {
    if (!settings.browserNotificationsEnabled || Notification.permission !== 'granted') {
      return;
    }

    const checkReminders = () => {
      const now = new Date();
      const pendingTasks = tasks.filter(t => t.status === 'Pending');

      pendingTasks.forEach(task => {
        if (!task.dueDate || !task.dueTime) return;

        // Parse task due datetime
        const [year, month, day] = task.dueDate.split('-');
        const [hours, minutes] = task.dueTime.split(':');
        const taskDueTime = new Date(year, month - 1, day, hours, minutes, 0);
        
        const diffMs = taskDueTime.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);

        let shouldNotify = false;
        let timingLabel = '';

        const timingSetting = settings.notificationTiming || 'at_time';

        if (timingSetting === 'at_time' && diffMins >= 0 && diffMins <= 1) {
          shouldNotify = true;
          timingLabel = 'Due Now';
        } else if (timingSetting === '15m_before' && diffMins >= 14 && diffMins <= 16) {
          shouldNotify = true;
          timingLabel = 'Starting in 15 mins';
        } else if (timingSetting === '1h_before' && diffMins >= 58 && diffMins <= 62) {
          shouldNotify = true;
          timingLabel = 'Starting in 1 hour';
        } else if (timingSetting === '1d_before' && diffMins >= 1430 && diffMins <= 1450) {
          shouldNotify = true;
          timingLabel = 'Starting tomorrow';
        }

        // Ensure we only notify once per task
        const notificationKey = `${task.id}-${timingSetting}`;
        if (shouldNotify && !triggeredNotifications.current.has(notificationKey)) {
          triggeredNotifications.current.add(notificationKey);
          
          const leadName = leads.find(l => l.id === task.leadId)?.name || 'Lead';
          new Notification(`Sales CRM: ${task.title}`, {
            body: `${timingLabel} | Ref: ${leadName}\n${task.description || ''}`,
            icon: '/favicon.svg'
          });
        }
      });
    };

    // Run check immediately, then every 30 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks, settings, leads]);

  // View Navigation
  const navigateTo = (view, leadId = null) => {
    setCurrentView(view);
    if (leadId) {
      setSelectedLeadId(leadId);
    }
  };

  // CRUD Operations

  // Leads
  const saveLead = (leadData) => {
    const saved = db.saveLead(leadData);
    setLeads(db.getLeads());
    return saved;
  };

  const deleteLead = (id) => {
    db.deleteLead(id);
    loadData();
    if (selectedLeadId === id) {
      setSelectedLeadId(null);
      setCurrentView('leads');
    }
  };

  // Tasks
  const saveTask = (taskData) => {
    const saved = db.saveTask(taskData);
    setTasks(db.getTasks());
    return saved;
  };

  const deleteTask = (id) => {
    db.deleteTask(id);
    setTasks(db.getTasks());
  };

  const toggleTaskCompletion = (id) => {
    const taskList = db.getTasks();
    const index = taskList.findIndex(t => t.id === id);
    if (index !== -1) {
      taskList[index].status = taskList[index].status === 'Completed' ? 'Pending' : 'Completed';
      db.saveTask(taskList[index]);
      setTasks(db.getTasks());
    }
  };

  // Actions (Logs)
  const logAction = (actionData) => {
    const saved = db.saveAction(actionData);
    setActions(db.getActions());
    // Refresh leads as action logging might trigger status updates
    setLeads(db.getLeads());
    return saved;
  };

  // Notes
  const saveNote = (noteData) => {
    const saved = db.saveNote(noteData);
    setNotes(db.getNotes());
    return saved;
  };

  const deleteNote = (id) => {
    db.deleteNote(id);
    setNotes(db.getNotes());
  };

  // Settings
  const saveSettings = (newSettings) => {
    const saved = db.saveSettings(newSettings);
    setSettings(saved);
    return saved;
  };

  // Database Management
  const resetDatabase = () => {
    db.resetDB();
    loadData();
    triggeredNotifications.current.clear();
  };

  const clearDatabase = () => {
    db.clearDB();
    loadData();
    triggeredNotifications.current.clear();
  };

  const importJSON = (jsonData) => {
    const success = db.importData(jsonData);
    if (success) {
      loadData();
      triggeredNotifications.current.clear();
    }
    return success;
  };

  const exportJSON = () => {
    return db.exportData();
  };

  // Helper stats
  const getStats = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const totalLeads = leads.length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending');
    const pendingFollowupsCount = pendingTasks.length;

    const tasksDueToday = pendingTasks.filter(t => t.dueDate === todayStr).length;

    const overdueTasks = pendingTasks.filter(t => {
      if (!t.dueDate) return false;
      if (t.dueDate < todayStr) return true;
      if (t.dueDate === todayStr && t.dueTime) {
        const [h, m] = t.dueTime.split(':');
        const dueTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
        return dueTime < now;
      }
      return false;
    }).length;

    return {
      totalLeads,
      pendingFollowupsCount,
      tasksDueToday,
      overdueTasks
    };
  };

  // Outreach Buckets
  const saveOutreachBucket = (bucketData) => {
    const saved = db.saveOutreachBucket(bucketData);
    setOutreachBuckets(db.getOutreachBuckets());
    return saved;
  };

  const deleteOutreachBucket = (id) => {
    db.deleteOutreachBucket(id);
    setOutreachBuckets(db.getOutreachBuckets());
  };

  const duplicateOutreachBucket = (id) => {
    const buckets = db.getOutreachBuckets();
    const source = buckets.find(b => b.id === id);
    if (source) {
      const copy = {
        name: `${source.name} (Copy)`,
        countries: [...source.countries],
        archived: source.archived
      };
      db.saveOutreachBucket(copy);
      setOutreachBuckets(db.getOutreachBuckets());
    }
  };

  const archiveOutreachBucket = (id, archived = true) => {
    const buckets = db.getOutreachBuckets();
    const bucket = buckets.find(b => b.id === id);
    if (bucket) {
      bucket.archived = archived;
      db.saveOutreachBucket(bucket);
      setOutreachBuckets(db.getOutreachBuckets());
    }
  };

  // Outreach Country Configs
  const saveCountryConfig = (countryName, config) => {
    const saved = db.saveCountryConfig(countryName, config);
    setCountryConfigs(db.getCountryConfigs());
    return saved;
  };

  // Log Call
  const logOutreachCall = (callRecord) => {
    const saved = db.logOutreachCall(callRecord);
    setOutreachHistory(db.getOutreachHistory());
    if (callRecord.leadId) {
      logAction({
        leadId: callRecord.leadId,
        type: 'Called',
        notes: `Outreach Planner Call: Outcome: ${callRecord.outcome}. ${callRecord.notes || ''}`
      });
    }
    return saved;
  };

  // Account Executives CRUD
  const saveAccountExecutive = (aeData) => {
    const saved = db.saveAccountExecutive(aeData);
    setAccountExecutives(db.getAccountExecutives());
    return saved;
  };

  const deleteAccountExecutive = (id) => {
    db.deleteAccountExecutive(id);
    setAccountExecutives(db.getAccountExecutives());
    setAeDemos(db.getAEDemos()); // cascade delete sync
  };

  // Demo Bookings CRUD
  const saveAEDemo = (demoData) => {
    const saved = db.saveAEDemo(demoData);
    setAeDemos(db.getAEDemos());
    
    // Auto-create a task in the general tasks list for this demo booking as well!
    const associatedLead = leads.find(l => l.id === demoData.leadId);
    const associatedLeadName = associatedLead ? associatedLead.name : 'Lead';
    const associatedAe = accountExecutives.find(a => a.id === demoData.aeId);
    const associatedAeName = associatedAe ? associatedAe.name : 'AE';
    
    // Date/time text
    const dateText = new Date(demoData.dateTime).toLocaleDateString();
    const timeText = new Date(demoData.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    db.saveTask({
      title: `Demo with ${associatedLeadName} (AE: ${associatedAeName})`,
      description: `SDR scheduled a demo. Platform: ${demoData.platform.toUpperCase()}. Link: ${demoData.meetingLink}. Notes: ${demoData.notes || ''}`,
      leadId: demoData.leadId,
      dueDate: demoData.dateTime.split('T')[0],
      dueTime: timeText,
      priority: 'High',
      status: 'Pending'
    });
    setTasks(db.getTasks()); // reload context tasks

    // Also log an action
    logAction({
      leadId: demoData.leadId,
      type: 'Meeting Scheduled',
      notes: `Demo scheduled on ${dateText} at ${timeText} with AE ${associatedAeName}. Platform: ${demoData.platform.toUpperCase()}. Link: ${demoData.meetingLink}`
    });
    
    return saved;
  };

  const deleteAEDemo = (id) => {
    db.deleteAEDemo(id);
    setAeDemos(db.getAEDemos());
  };

  // Playbook CRUD operations
  const savePlaybookCategory = (catData) => {
    const saved = db.savePlaybookCategory(catData);
    setPlaybookCategories(db.getPlaybookCategories());
    return saved;
  };

  const deletePlaybookCategory = (id) => {
    db.deletePlaybookCategory(id);
    setPlaybookCategories(db.getPlaybookCategories());
  };

  const savePlaybookTemplate = (tempData) => {
    const saved = db.savePlaybookTemplate(tempData);
    setPlaybookTemplates(db.getPlaybookTemplates());
    return saved;
  };

  const deletePlaybookTemplate = (id) => {
    db.deletePlaybookTemplate(id);
    setPlaybookTemplates(db.getPlaybookTemplates());
  };

  const togglePinPlaybookTemplate = (id) => {
    const templatesList = db.getPlaybookTemplates();
    const index = templatesList.findIndex(t => t.id === id);
    if (index !== -1) {
      templatesList[index].isPinned = !templatesList[index].isPinned;
      db.savePlaybookTemplate(templatesList[index]);
      setPlaybookTemplates(db.getPlaybookTemplates());
    }
  };

  const duplicatePlaybookTemplate = (id) => {
    const templatesList = db.getPlaybookTemplates();
    const source = templatesList.find(t => t.id === id);
    if (source) {
      const copy = { ...source };
      delete copy.id;
      copy.name = `${source.name} (Copy)`;
      copy.isPinned = false;
      copy.usageCount = 0;
      copy.lastUsed = null;
      if (copy.versions) {
        copy.versions = copy.versions.map(v => ({ ...v, usageCount: 0, replyRate: 0 }));
      }
      db.savePlaybookTemplate(copy);
      setPlaybookTemplates(db.getPlaybookTemplates());
    }
  };

  const archivePlaybookTemplate = (id, archived = true) => {
    const templatesList = db.getPlaybookTemplates();
    const temp = templatesList.find(t => t.id === id);
    if (temp) {
      temp.archived = archived;
      db.savePlaybookTemplate(temp);
      setPlaybookTemplates(db.getPlaybookTemplates());
    }
  };

  const incrementTemplateUsage = (templateId, versionId) => {
    const templatesList = db.getPlaybookTemplates();
    const index = templatesList.findIndex(t => t.id === templateId);
    if (index !== -1) {
      const temp = templatesList[index];
      temp.usageCount = (temp.usageCount || 0) + 1;
      temp.lastUsed = new Date().toISOString();
      if (temp.versions) {
        const vIdx = temp.versions.findIndex(v => v.id === versionId);
        if (vIdx !== -1) {
          temp.versions[vIdx].usageCount = (temp.versions[vIdx].usageCount || 0) + 1;
        }
      }
      db.savePlaybookTemplate(temp);
      setPlaybookTemplates(db.getPlaybookTemplates());
    }
  };

  return (
    <CRMContext.Provider value={{
      leads,
      tasks,
      actions,
      notes,
      settings,
      currentView,
      selectedLeadId,
      addLeadOpen,
      addTaskOpen,
      activeTaskLeadId,
      outreachBuckets,
      countryConfigs,
      outreachHistory,
      accountExecutives,
      aeDemos,
      setAddLeadOpen,
      setAddTaskOpen,
      setActiveTaskLeadId,
      navigateTo,
      saveLead,
      deleteLead,
      saveTask,
      deleteTask,
      toggleTaskCompletion,
      logAction,
      saveNote,
      deleteNote,
      saveSettings,
      resetDatabase,
      clearDatabase,
      importJSON,
      exportJSON,
      getStats,
      saveOutreachBucket,
      deleteOutreachBucket,
      duplicateOutreachBucket,
      archiveOutreachBucket,
      saveCountryConfig,
      logOutreachCall,
      saveAccountExecutive,
      deleteAccountExecutive,
      saveAEDemo,
      deleteAEDemo,
      playbookCategories,
      playbookTemplates,
      savePlaybookCategory,
      deletePlaybookCategory,
      savePlaybookTemplate,
      deletePlaybookTemplate,
      togglePinPlaybookTemplate,
      duplicatePlaybookTemplate,
      archivePlaybookTemplate,
      incrementTemplateUsage
    }}>
      {children}
    </CRMContext.Provider>
  );
};
