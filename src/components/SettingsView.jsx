import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Bell, 
  Database, 
  ShieldAlert, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const SettingsView = () => {
  const {
    settings,
    saveSettings,
    resetDatabase,
    clearDatabase,
    importJSON,
    exportJSON
  } = useCRM();

  const [notificationStatus, setNotificationStatus] = useState(Notification.permission);
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState(null); // { success: boolean, message: string }

  // Request browser notifications permission
  const handleRequestPermission = () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    Notification.requestPermission().then(permission => {
      setNotificationStatus(permission);
      saveSettings({
        ...settings,
        browserNotificationsEnabled: permission === 'granted'
      });
    });
  };

  const handleNotificationToggle = (e) => {
    const enabled = e.target.checked;
    if (enabled && Notification.permission !== 'granted') {
      handleRequestPermission();
    } else {
      saveSettings({
        ...settings,
        browserNotificationsEnabled: enabled
      });
    }
  };

  const handleTimingChange = (e) => {
    saveSettings({
      ...settings,
      notificationTiming: e.target.value
    });
  };

  // Export Data Download
  const handleExportData = () => {
    const dataStr = exportJSON();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `followup_crm_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import Data Submit
  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importText.trim()) return;

    const success = importJSON(importText);
    if (success) {
      setImportFeedback({ success: true, message: 'CRM data imported successfully! All states reloaded.' });
      setImportText('');
    } else {
      setImportFeedback({ success: false, message: 'Invalid JSON schema. Failed to parse and import data.' });
    }
  };

  // Re-seed DB
  const handleReSeed = () => {
    if (confirm('Re-seeding will restore default mock leads, notes, and task lists. Any current modifications will be lost. Continue?')) {
      resetDatabase();
      alert('Mock data seeded successfully!');
    }
  };

  // Clear DB
  const handleClearAll = () => {
    if (confirm('WARNING: This will permanently delete all leads, tasks, action logs, and notes. This action is irreversible. Continue?')) {
      clearDatabase();
      alert('Database cleared successfully!');
    }
  };

  return (
    <div className="view-content settings-layout">
      {/* Header */}
      <header className="view-header">
        <div>
          <h1 className="view-title">Settings & Configuration</h1>
          <p className="view-description">Configure desktop reminders, back up your customer data, or reset mock sandboxes.</p>
        </div>
      </header>

      <div className="settings-grid">
        {/* Left Column */}
        <div className="settings-main-col">
          {/* Notifications Panel */}
          <div className="dashboard-section-card">
            <div className="section-card-header">
              <div className="header-title-group">
                <Bell size={20} className="text-primary" />
                <h2 className="section-card-title">Desktop Notifications</h2>
              </div>
            </div>

            <div className="settings-panel-body">
              <p className="settings-panel-desc">
                Get real-time browser alerts when sales calls, meeting reminders, or follow-ups are due. Works entirely locally in your browser.
              </p>

              <div className="notification-status-box">
                <span className="status-label">Notification Permission:</span>
                <span className={`status-badge-val permission-${notificationStatus}`}>
                  {notificationStatus.toUpperCase()}
                </span>
                
                {notificationStatus !== 'granted' && (
                  <button 
                    onClick={handleRequestPermission}
                    className="action-btn-secondary btn-sm"
                  >
                    Grant Permission
                  </button>
                )}
              </div>

              <div className="settings-form-options">
                <label className="settings-checkbox-row">
                  <input
                    type="checkbox"
                    checked={settings.browserNotificationsEnabled || false}
                    onChange={handleNotificationToggle}
                    disabled={notificationStatus === 'denied'}
                  />
                  <div className="checkbox-text-group">
                    <span className="checkbox-title">Enable Task Due Reminders</span>
                    <span className="checkbox-desc">Trigger popup notifications when tasks are due.</span>
                  </div>
                </label>

                <div className="settings-select-row">
                  <label htmlFor="notif-timing-select" className="select-label">Reminder Timing</label>
                  <select
                    id="notif-timing-select"
                    className="name-input"
                    value={settings.notificationTiming || 'at_time'}
                    onChange={handleTimingChange}
                    disabled={!settings.browserNotificationsEnabled}
                  >
                    <option value="at_time">At task due time</option>
                    <option value="15m_before">15 minutes before due time</option>
                    <option value="1h_before">1 hour before due time</option>
                    <option value="1d_before">1 day before due date</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Backup / JSON Export/Import */}
          <div className="dashboard-section-card">
            <div className="section-card-header">
              <div className="header-title-group">
                <Database size={20} className="text-secondary" />
                <h2 className="section-card-title">Data Backup & Sync</h2>
              </div>
            </div>

            <div className="settings-panel-body">
              <p className="settings-panel-desc">
                Export all customer records, notes, and checklist items into a JSON backup file. Import it back to restore data on another device.
              </p>

              <div className="backup-actions-row">
                <button onClick={handleExportData} className="action-btn-secondary">
                  <Download size={16} />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              {/* Import Text Box */}
              <form onSubmit={handleImportSubmit} className="import-json-form">
                <label htmlFor="import-data-textarea" className="input-label">Paste Backup JSON Content</label>
                <textarea
                  id="import-data-textarea"
                  placeholder="Paste JSON text content here..."
                  className="note-textarea"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={4}
                  required
                ></textarea>
                
                {importFeedback && (
                  <div className={`feedback-alert ${importFeedback.success ? 'feedback-success' : 'feedback-error'}`}>
                    {importFeedback.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{importFeedback.message}</span>
                  </div>
                )}

                <button type="submit" className="action-btn-primary margin-top-sm">
                  <Upload size={14} />
                  <span>Upload & Restore Data</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="settings-side-col">
          {/* Database Reset / Seeding */}
          <div className="dashboard-section-card border-danger-glow">
            <div className="section-card-header">
              <div className="header-title-group">
                <ShieldAlert size={20} className="text-danger" />
                <h2 className="section-card-title text-danger">Danger Zone</h2>
              </div>
            </div>

            <div className="settings-panel-body">
              <p className="settings-panel-desc">
                Perform administrative database operations. Helpful for development testing or clearing out mock entries.
              </p>

              <div className="danger-buttons-list">
                <button onClick={handleReSeed} className="danger-btn-action">
                  <RotateCcw size={16} />
                  <div className="danger-btn-labels">
                    <span className="title">Re-Seed Mock Data</span>
                    <span className="desc">Reset to 5 default mock leads, logs, and tasks.</span>
                  </div>
                </button>

                <button onClick={handleClearAll} className="danger-btn-action danger-destructive">
                  <Trash2 size={16} />
                  <div className="danger-btn-labels">
                    <span className="title">Delete All Data</span>
                    <span className="desc">Wipe all leads, notes, and tasks. Clear local storage.</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Guidelines / Info Box */}
          <div className="tip-widget">
            <Info size={24} className="tip-icon" />
            <div className="tip-content">
              <h4 className="tip-title">Local Sandboxed Mode</h4>
              <p className="tip-text">
                Your data is stored 100% locally in your browser cache. Clearing site cookies or browsing data will wipe database tables. We recommend making frequent backup exports for safety.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
