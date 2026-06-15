import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Briefcase, 
  MessageSquare, 
  History, 
  CheckSquare, 
  X, 
  Link as LinkIcon, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export const LeadsView = () => {
  const {
    leads,
    tasks,
    actions,
    notes,
    selectedLeadId,
    navigateTo,
    saveLead,
    deleteLead,
    logAction,
    saveNote,
    deleteNote,
    saveTask,
    toggleTaskCompletion,
    addLeadOpen,
    setAddLeadOpen
  } = useCRM();

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  
  // Drawer Tab state
  const [drawerTab, setDrawerTab] = useState('notes'); // 'notes', 'actions', 'tasks'
  
  // Modal states for creating/editing a lead
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    name: '', company: '', role: '', email: '', phone: '', country: '', industry: '', status: 'New Lead', links: []
  });
  
  // Quick dynamic link inputs in the form
  const [tempLinks, setTempLinks] = useState([]);

  // Active Lead Detail object
  const activeLead = leads.find(l => l.id === selectedLeadId);

  // Sync state for editing when lead form opens
  const openAddLeadModal = () => {
    setLeadFormData({
      name: '', company: '', role: '', email: '', phone: '', country: '', industry: '', status: 'New Lead', links: []
    });
    setTempLinks([]);
    setIsEditingLead(false);
    setAddLeadOpen(true);
  };

  const openEditLeadModal = (lead) => {
    setLeadFormData({ ...lead });
    setTempLinks(lead.links ? [...lead.links] : []);
    setIsEditingLead(true);
    setAddLeadOpen(true);
  };

  const handleAddLinkFormRow = () => {
    setTempLinks([...tempLinks, { id: 'temp-' + Math.random(), label: 'LinkedIn', url: '' }]);
  };

  const handleRemoveLinkFormRow = (id) => {
    setTempLinks(tempLinks.filter(lnk => lnk.id !== id));
  };

  const handleLinkRowChange = (id, field, value) => {
    setTempLinks(tempLinks.map(lnk => lnk.id === id ? { ...lnk, [field]: value } : lnk));
  };

  const handleLeadFormSubmit = (e) => {
    e.preventDefault();
    const finalLinks = tempLinks.filter(lnk => lnk.url.trim() !== '').map(lnk => {
      // Strip temp ids
      const { id, ...rest } = lnk;
      return { id: id.startsWith('temp-') ? Math.random().toString(36).substring(2, 9) : id, ...rest };
    });

    saveLead({
      ...leadFormData,
      links: finalLinks
    });
    setAddLeadOpen(false);
  };

  // --- DRAWER FORM STATES ---
  // Notes state
  const [newNoteContent, setNewNoteContent] = useState('');
  
  // Action logging state
  const [actionType, setActionType] = useState('Called');
  const [actionNotes, setActionNotes] = useState('');
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [followUpPriority, setFollowUpPriority] = useState('Medium');

  // Lead tasks state
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDate, setQuickTaskDate] = useState('');
  const [quickTaskTime, setQuickTaskTime] = useState('09:00');

  // Trigger prefills when action type changes
  useEffect(() => {
    if (activeLead) {
      if (actionType === 'Called') {
        setFollowUpTitle(`Follow Up Call: ${activeLead.name}`);
      } else if (actionType === 'Sent Email') {
        setFollowUpTitle(`Review proposal with ${activeLead.name}`);
      } else if (actionType === 'Busy - Call Later') {
        setFollowUpTitle(`Callback: ${activeLead.name}`);
      } else {
        setFollowUpTitle(`Follow up with ${activeLead.name}`);
      }
    }
  }, [actionType, activeLead]);

  // Set default follow-up date (tomorrow)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFollowUpDate(tomorrow.toISOString().split('T')[0]);
    setQuickTaskDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  if (addLeadOpen && !leadFormData.id && isEditingLead) {
    // If open-state conflicts, force correction
    setIsEditingLead(false);
  }

  // Handle Note Submit
  const handleNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !selectedLeadId) return;
    saveNote({
      leadId: selectedLeadId,
      content: newNoteContent
    });
    setNewNoteContent('');
  };

  // Handle Action Log Submit
  const handleActionLogSubmit = (e) => {
    e.preventDefault();
    if (!actionNotes.trim() || !selectedLeadId) return;

    // 1. Log the Action
    logAction({
      leadId: selectedLeadId,
      type: actionType,
      notes: actionNotes,
      nextFollowUpDate: createFollowUp ? `${followUpDate}T${followUpTime}:00` : null
    });

    // 2. Automatically create Follow-up Task if enabled
    if (createFollowUp && followUpTitle.trim() && followUpDate) {
      saveTask({
        title: followUpTitle,
        description: `Auto-scheduled follow-up task logged during action: "${actionType}". Notes: ${actionNotes}`,
        leadId: selectedLeadId,
        dueDate: followUpDate,
        dueTime: followUpTime,
        priority: followUpPriority,
        status: 'Pending'
      });
    }

    // 3. Update Lead Status dynamically based on action outcomes
    if (actionType === 'Busy - Call Later') {
      saveLead({ id: selectedLeadId, status: 'Busy - Call Later' });
    } else if (actionType === 'No Answer') {
      saveLead({ id: selectedLeadId, status: 'No Answer' });
    }

    // Reset action logger form
    setActionNotes('');
    setCreateFollowUp(false);
  };

  // Handle Quick Task Submit
  const handleQuickTaskSubmit = (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !selectedLeadId) return;
    
    saveTask({
      title: quickTaskTitle,
      description: 'Quick task created from lead details view.',
      leadId: selectedLeadId,
      dueDate: quickTaskDate,
      dueTime: quickTaskTime,
      priority: 'Medium',
      status: 'Pending'
    });
    setQuickTaskTitle('');
  };

  // Filter Leads
  const filteredLeads = leads.filter(lead => {
    const query = search.toLowerCase();
    const matchesSearch = 
      lead.name.toLowerCase().includes(query) ||
      lead.company.toLowerCase().includes(query) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.phone && lead.phone.includes(query));

    const matchesStatus = statusFilter ? lead.status === statusFilter : true;
    const matchesIndustry = industryFilter ? lead.industry === industryFilter : true;

    return matchesSearch && matchesStatus && matchesIndustry;
  });

  // Extract unique industries for filters
  const industriesList = Array.from(new Set(leads.map(l => l.industry).filter(Boolean)));

  const leadStatuses = [
    'New Lead',
    'Contacted',
    'Busy - Call Later',
    'No Answer',
    'Follow Up Required',
    'Interested',
    'Meeting Scheduled',
    'Closed Won',
    'Closed Lost'
  ];

  return (
    <div className="view-content leads-layout">
      {/* Main Section */}
      <div className="leads-main-section">
        <header className="view-header">
          <div>
            <h1 className="view-title">Leads Directory</h1>
            <p className="view-description">Manage prospects, record conversations, and trigger follow-up tasks.</p>
          </div>
          <button onClick={openAddLeadModal} className="action-btn-primary">
            <Plus size={18} />
            <span>Add New Lead</span>
          </button>
        </header>

        {/* Filter Controls Row */}
        <section className="search-filter-bar">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search leads by name, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filters-wrapper">
            <div className="filter-select-group">
              <Filter size={14} className="filter-icon" />
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {leadStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-group">
              <Briefcase size={14} className="filter-icon" />
              <select
                className="filter-select"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <option value="">All Industries</option>
                {industriesList.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            
            {(statusFilter || industryFilter || search) && (
              <button 
                onClick={() => { setSearch(''); setStatusFilter(''); setIndustryFilter(''); }} 
                className="clear-filters-btn"
              >
                Reset
              </button>
            )}
          </div>
        </section>

        {/* Leads Table Card */}
        <div className="table-card">
          {filteredLeads.length === 0 ? (
            <div className="empty-section-state">
              <AlertCircle size={40} className="empty-state-icon" />
              <p>No leads found matching your search filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>Lead Name</th>
                    <th>Company</th>
                    <th>Industry</th>
                    <th>Email & Phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(lead => (
                    <tr 
                      key={lead.id} 
                      className={`lead-row ${selectedLeadId === lead.id ? 'row-selected' : ''}`}
                      onClick={() => navigateTo('leads', lead.id)}
                    >
                      <td>
                        <div className="table-lead-name">
                          <span className="lead-name-bold">{lead.name}</span>
                          {lead.role && <span className="lead-role-sub">{lead.role}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="table-lead-company">
                          <span>{lead.company}</span>
                          {lead.country && (
                            <span className="lead-country-tag">
                              <MapPin size={10} />
                              {lead.country}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="industry-text">{lead.industry || '—'}</span>
                      </td>
                      <td>
                        <div className="table-lead-contact">
                          {lead.email && (
                            <span className="contact-link">
                              <Mail size={12} />
                              {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="contact-link">
                              <Phone size={12} />
                              {lead.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill status-${(lead.status || 'New Lead').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                          {lead.status || 'New Lead'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Lead Details Drawer */}
      {activeLead && (
        <div className="lead-detail-drawer">
          <div className="drawer-header">
            <div className="drawer-title-area">
              <div className="title-lead-profile">
                <h3>{activeLead.name}</h3>
                <span>{activeLead.role ? `${activeLead.role} • ` : ''}{activeLead.company}</span>
              </div>
              <div className="lead-meta-row">
                <span className="meta-item"><MapPin size={12} /> {activeLead.country || 'No Country'}</span>
                <span className="meta-item"><Briefcase size={12} /> {activeLead.industry || 'No Industry'}</span>
              </div>
            </div>
            
            <div className="drawer-header-actions">
              <button 
                onClick={() => openEditLeadModal(activeLead)}
                className="btn-edit-lead"
              >
                Edit Profile
              </button>
              <button 
                className="close-drawer-btn" 
                onClick={() => navigateTo('leads', null)}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="drawer-content-container">
            {/* Status quick changer */}
            <div className="drawer-status-bar">
              <label htmlFor="drawer-status-select" className="status-bar-label">Current Status</label>
              <select
                id="drawer-status-select"
                className={`drawer-status-select status-select-pill status-${(activeLead.status || 'New Lead').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                value={activeLead.status || 'New Lead'}
                onChange={(e) => saveLead({ id: activeLead.id, status: e.target.value })}
              >
                {leadStatuses.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Links Section */}
            <div className="drawer-links-section">
              <h4 className="drawer-section-title">Lead Resources & Links</h4>
              <div className="drawer-links-grid">
                {activeLead.links && activeLead.links.length > 0 ? (
                  activeLead.links.map(lnk => (
                    <a 
                      key={lnk.id} 
                      href={lnk.url.startsWith('http') ? lnk.url : `https://${lnk.url}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="drawer-link-card"
                    >
                      <LinkIcon size={14} />
                      <span className="link-card-label">{lnk.label}</span>
                      <ExternalLink size={12} className="link-card-arrow" />
                    </a>
                  ))
                ) : (
                  <div className="no-links-text">No custom links saved. Edit profile to add resource links.</div>
                )}
              </div>
            </div>

            {/* Navigation Tabs inside Drawer */}
            <div className="drawer-tabs-row">
              <button
                className={`drawer-tab-btn ${drawerTab === 'notes' ? 'active' : ''}`}
                onClick={() => setDrawerTab('notes')}
              >
                <MessageSquare size={16} />
                <span>Notes</span>
              </button>
              <button
                className={`drawer-tab-btn ${drawerTab === 'actions' ? 'active' : ''}`}
                onClick={() => setDrawerTab('actions')}
              >
                <History size={16} />
                <span>Action Log</span>
              </button>
              <button
                className={`drawer-tab-btn ${drawerTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setDrawerTab('tasks')}
              >
                <CheckSquare size={16} />
                <span>Tasks</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="drawer-tab-content">
              
              {/* NOTES TAB */}
              {drawerTab === 'notes' && (
                <div className="tab-pane-notes">
                  <form onSubmit={handleNoteSubmit} className="add-note-form">
                    <textarea
                      placeholder="Add a timestamped note (e.g. Budget starts in July...)"
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      rows={3}
                      className="note-textarea"
                      required
                    ></textarea>
                    <button type="submit" className="action-btn-primary note-submit-btn">Save Note</button>
                  </form>

                  <div className="notes-timeline">
                    {notes.filter(n => n.leadId === activeLead.id).length === 0 ? (
                      <div className="empty-tab-text">No notes saved for this lead yet.</div>
                    ) : (
                      [...notes]
                        .filter(n => n.leadId === activeLead.id)
                        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                        .map(note => (
                          <div key={note.id} className="timeline-note-item">
                            <div className="note-item-header">
                              <span className="note-time">
                                {new Date(note.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button 
                                onClick={() => deleteNote(note.id)} 
                                className="delete-btn-subtle"
                                aria-label="Delete note"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <p className="note-text-body">{note.content}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* ACTION HISTORY LOG TAB */}
              {drawerTab === 'actions' && (
                <div className="tab-pane-actions">
                  {/* Log action form with smart follow-up triggers */}
                  <form onSubmit={handleActionLogSubmit} className="log-action-form">
                    <h5 className="form-sub-title">Log New Interaction</h5>
                    
                    <div className="form-group-row">
                      <div className="form-item">
                        <label htmlFor="action-type-select" className="input-label">Action Outcome</label>
                        <select
                          id="action-type-select"
                          className="name-input"
                          value={actionType}
                          onChange={(e) => setActionType(e.target.value)}
                        >
                          <option value="Called">Called (General)</option>
                          <option value="Busy - Call Later">Called (Busy - Call Later)</option>
                          <option value="No Answer">Called (No Answer)</option>
                          <option value="Left Voicemail">Left Voicemail</option>
                          <option value="Followed Up">Followed Up</option>
                          <option value="Sent Email">Sent Email</option>
                          <option value="Sent LinkedIn Message">Sent LinkedIn Message</option>
                          <option value="Scheduled Meeting">Scheduled Meeting</option>
                          <option value="Received Callback">Received Callback</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-item">
                      <label htmlFor="action-notes-input" className="input-label">Conversation Notes</label>
                      <textarea
                        id="action-notes-input"
                        placeholder="What did you discuss? Add callback conditions..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        rows={2}
                        className="note-textarea"
                        required
                      ></textarea>
                    </div>

                    {/* SMART FOLLOW-UP TRIGGER */}
                    <div className="smart-followup-box">
                      <label className="smart-checkbox-label">
                        <input
                          type="checkbox"
                          checked={createFollowUp}
                          onChange={(e) => setCreateFollowUp(e.target.checked)}
                        />
                        <span className="smart-checkbox-text">Smart Schedule Follow-up Task</span>
                      </label>

                      {createFollowUp && (
                        <div className="smart-inputs-area">
                          <div className="form-item">
                            <label htmlFor="smart-title-input" className="input-label">Task Title</label>
                            <input
                              id="smart-title-input"
                              type="text"
                              className="name-input"
                              value={followUpTitle}
                              onChange={(e) => setFollowUpTitle(e.target.value)}
                              placeholder="Task description..."
                              required
                            />
                          </div>

                          <div className="form-group-row">
                            <div className="form-item">
                              <label htmlFor="smart-date-input" className="input-label">Due Date</label>
                              <input
                                id="smart-date-input"
                                type="date"
                                className="name-input"
                                value={followUpDate}
                                onChange={(e) => setFollowUpDate(e.target.value)}
                                required
                              />
                            </div>
                            <div className="form-item">
                              <label htmlFor="smart-time-input" className="input-label">Due Time</label>
                              <input
                                id="smart-time-input"
                                type="time"
                                className="name-input"
                                value={followUpTime}
                                onChange={(e) => setFollowUpTime(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="form-item">
                            <label htmlFor="smart-priority-select" className="input-label">Priority</label>
                            <select
                              id="smart-priority-select"
                              className="name-input"
                              value={followUpPriority}
                              onChange={(e) => setFollowUpPriority(e.target.value)}
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <button type="submit" className="action-btn-primary log-submit-btn">Log & Schedule</button>
                  </form>

                  {/* Actions History List */}
                  <div className="actions-timeline">
                    {actions.filter(a => a.leadId === activeLead.id).length === 0 ? (
                      <div className="empty-tab-text">No actions logged yet.</div>
                    ) : (
                      [...actions]
                        .filter(a => a.leadId === activeLead.id)
                        .sort((a, b) => b.dateTime.localeCompare(a.dateTime))
                        .map(act => (
                          <div key={act.id} className="timeline-act-item">
                            <div className="act-item-header">
                              <span className="act-badge">{act.type}</span>
                              <span className="act-time">
                                {new Date(act.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="act-notes-body">{act.notes}</p>
                            {act.nextFollowUpDate && (
                              <div className="act-followup-indicator">
                                <Calendar size={12} />
                                <span>Next Reconnect: {new Date(act.nextFollowUpDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* TASKS TAB */}
              {drawerTab === 'tasks' && (
                <div className="tab-pane-tasks">
                  <form onSubmit={handleQuickTaskSubmit} className="quick-task-form">
                    <input
                      type="text"
                      placeholder="Add a quick task..."
                      className="name-input quick-task-input"
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      required
                    />
                    <div className="form-group-row margin-top-sm">
                      <input
                        type="date"
                        className="name-input"
                        value={quickTaskDate}
                        onChange={(e) => setQuickTaskDate(e.target.value)}
                        required
                        aria-label="Quick task date"
                      />
                      <input
                        type="time"
                        className="name-input"
                        value={quickTaskTime}
                        onChange={(e) => setQuickTaskTime(e.target.value)}
                        required
                        aria-label="Quick task time"
                      />
                    </div>
                    <button type="submit" className="action-btn-secondary quick-task-submit">Create Task</button>
                  </form>

                  <div className="drawer-tasks-list">
                    {tasks.filter(t => t.leadId === activeLead.id).length === 0 ? (
                      <div className="empty-tab-text">No tasks created for this lead.</div>
                    ) : (
                      tasks
                        .filter(t => t.leadId === activeLead.id)
                        .sort((a, b) => a.status.localeCompare(b.status) || a.dueDate.localeCompare(b.dueDate))
                        .map(task => (
                          <div key={task.id} className={`drawer-task-item ${task.status === 'Completed' ? 'task-completed' : ''}`}>
                            <div className="task-item-main">
                              <input
                                type="checkbox"
                                className="task-checkbox"
                                checked={task.status === 'Completed'}
                                onChange={() => toggleTaskCompletion(task.id)}
                                aria-label="Mark task completed"
                              />
                              <div className="task-details">
                                <span className="task-title-text">{task.title}</span>
                                <span className="task-due-date">
                                  {task.dueDate} {task.dueTime}
                                </span>
                              </div>
                            </div>
                            <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                              {task.priority}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Danger Zone */}
            <div className="drawer-danger-zone">
              <h4 className="danger-zone-title">Danger Zone</h4>
              <button 
                onClick={() => { if(confirm('Delete lead and all corresponding history?')) deleteLead(activeLead.id); }} 
                className="btn-delete-lead-full"
              >
                <Trash2 size={14} />
                <span>Permanently Delete Lead</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Lead Modal dialog */}
      {addLeadOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{isEditingLead ? 'Edit Lead Profile' : 'Create New Lead'}</h3>
              <button onClick={() => setAddLeadOpen(false)} className="modal-close-btn" aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleLeadFormSubmit} className="modal-form">
              <div className="form-group-row">
                <div className="form-item">
                  <label htmlFor="modal-lead-name" className="input-label">Lead Name *</label>
                  <input
                    id="modal-lead-name"
                    type="text"
                    className="name-input"
                    value={leadFormData.name}
                    onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="form-item">
                  <label htmlFor="modal-lead-company" className="input-label">Company Name *</label>
                  <input
                    id="modal-lead-company"
                    type="text"
                    className="name-input"
                    value={leadFormData.company}
                    onChange={(e) => setLeadFormData({ ...leadFormData, company: e.target.value })}
                    placeholder="Company Inc."
                    required
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-item">
                  <label htmlFor="modal-lead-role" className="input-label">Designation / Role</label>
                  <input
                    id="modal-lead-role"
                    type="text"
                    className="name-input"
                    value={leadFormData.role}
                    onChange={(e) => setLeadFormData({ ...leadFormData, role: e.target.value })}
                    placeholder="e.g. Sales Director"
                  />
                </div>
                <div className="form-item">
                  <label htmlFor="modal-lead-industry" className="input-label">Industry</label>
                  <input
                    id="modal-lead-industry"
                    type="text"
                    className="name-input"
                    value={leadFormData.industry}
                    onChange={(e) => setLeadFormData({ ...leadFormData, industry: e.target.value })}
                    placeholder="e.g. Software, Finance"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-item">
                  <label htmlFor="modal-lead-email" className="input-label">Email</label>
                  <input
                    id="modal-lead-email"
                    type="email"
                    className="name-input"
                    value={leadFormData.email}
                    onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                    placeholder="name@company.com"
                  />
                </div>
                <div className="form-item">
                  <label htmlFor="modal-lead-phone" className="input-label">Phone Number</label>
                  <input
                    id="modal-lead-phone"
                    type="text"
                    className="name-input"
                    value={leadFormData.phone}
                    onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-item">
                  <label htmlFor="modal-lead-country" className="input-label">Country</label>
                  <input
                    id="modal-lead-country"
                    type="text"
                    className="name-input"
                    value={leadFormData.country}
                    onChange={(e) => setLeadFormData({ ...leadFormData, country: e.target.value })}
                    placeholder="United States"
                  />
                </div>
                <div className="form-item">
                  <label htmlFor="modal-lead-status" className="input-label">Status</label>
                  <select
                    id="modal-lead-status"
                    className="name-input"
                    value={leadFormData.status}
                    onChange={(e) => setLeadFormData({ ...leadFormData, status: e.target.value })}
                  >
                    {leadStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Links Section in Form */}
              <div className="form-links-editor">
                <div className="links-editor-header">
                  <label className="input-label">Salesforce, LinkedIn or CRM Links</label>
                  <button 
                    type="button" 
                    onClick={handleAddLinkFormRow} 
                    className="add-link-row-btn"
                  >
                    + Add Link
                  </button>
                </div>
                
                {tempLinks.map(link => (
                  <div key={link.id} className="link-row-inputs">
                    <select
                      className="name-input link-type-select"
                      value={link.label}
                      onChange={(e) => handleLinkRowChange(link.id, 'label', e.target.value)}
                      aria-label="Link type"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Salesforce">Salesforce</option>
                      <option value="Company Website">Website</option>
                      <option value="Meeting Notes">Meeting Notes</option>
                      <option value="Internal CRM">Internal CRM</option>
                      <option value="Custom">Custom Link</option>
                    </select>
                    <input
                      type="text"
                      className="name-input link-url-input"
                      placeholder="https://example.com/..."
                      value={link.url}
                      onChange={(e) => handleLinkRowChange(link.id, 'url', e.target.value)}
                      required
                      aria-label="Link URL"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveLinkFormRow(link.id)} 
                      className="delete-link-row-btn"
                      aria-label="Remove link row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  onClick={() => setAddLeadOpen(false)} 
                  className="theme-button"
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn-primary">
                  {isEditingLead ? 'Save Changes' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
