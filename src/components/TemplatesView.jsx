import React, { useState, useEffect, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  BookOpen, 
  Pin, 
  Trash2, 
  Edit, 
  Copy, 
  Check, 
  Plus, 
  Search, 
  Folder, 
  FolderPlus, 
  Sparkles, 
  Mail, 
  MessageSquare, 
  Phone, 
  FileText, 
  Layers, 
  Star, 
  Archive, 
  TrendingUp,
  X,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export const TemplatesView = () => {
  const {
    leads,
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
  } = useCRM();

  // Sidebar States
  const [selectedFolder, setSelectedFolder] = useState('all'); // 'all', 'pinned', 'recent', or categoryId
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all'); // 'all', 'email', 'linkedin', 'whatsapp', 'call_script', 'notes'
  const [selectedTags, setSelectedTags] = useState([]); // Array of strings
  const [selectedLeadId, setSelectedLeadId] = useState('');

  // Editor Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null); // null for create, template object for edit
  const [templateForm, setTemplateForm] = useState({
    name: '',
    categoryId: 'cat-outreach',
    type: 'email',
    tags: '',
    persona: '',
    country: '',
    industry: '',
    versions: [
      { id: 'v1', name: 'V1 - Pitch A', subject: '', body: '', usageCount: 0, replyRate: 0 }
    ]
  });

  // Active versions on template cards state
  const [activeVersionsMap, setActiveVersionsMap] = useState({}); // templateId -> versionIndex

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');

  // Default values
  const senderName = "John Doe";

  // Trigger temporary notification toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  // Find active lead
  const activeLead = useMemo(() => {
    return leads.find(l => l.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  // Set default active lead if available
  useEffect(() => {
    if (leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  // Extract all unique tags
  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set();
    playbookTemplates.forEach(t => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [playbookTemplates]);

  // Format templates lists
  const filteredTemplates = useMemo(() => {
    return playbookTemplates.filter(t => {
      // Archive filter (only non-archived unless specifically looking at something else)
      if (t.archived) return false;

      // Folder Filter
      if (selectedFolder === 'pinned') {
        if (!t.isPinned) return false;
      } else if (selectedFolder === 'recent') {
        if (!t.lastUsed) return false;
      } else if (selectedFolder !== 'all') {
        if (t.categoryId !== selectedFolder) return false;
      }

      // Format Type Filter
      if (selectedFormat !== 'all') {
        if (t.type !== selectedFormat) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const activeVer = t.versions[t.activeVersionIdx || 0];
        const matchName = t.name.toLowerCase().includes(query);
        const matchSubject = activeVer?.subject?.toLowerCase().includes(query) || false;
        const matchBody = activeVer?.body?.toLowerCase().includes(query) || false;
        const matchTags = t.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
        const matchPersona = t.persona?.toLowerCase().includes(query) || false;
        const matchCountry = t.country?.toLowerCase().includes(query) || false;
        const matchIndustry = t.industry?.toLowerCase().includes(query) || false;

        if (!matchName && !matchSubject && !matchBody && !matchTags && !matchPersona && !matchCountry && !matchIndustry) {
          return false;
        }
      }

      // Selected Tags Filter
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(tag => t.tags?.includes(tag));
        if (!hasAllTags) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort pinned templates first, then recently used, then name
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      if (selectedFolder === 'recent') {
        return new Date(b.lastUsed) - new Date(a.lastUsed);
      }
      
      return a.name.localeCompare(b.name);
    });
  }, [playbookTemplates, selectedFolder, selectedFormat, searchQuery, selectedTags]);

  // AI Recommendation Engine Logic
  const aiRecommendation = useMemo(() => {
    if (!activeLead) return null;

    const status = activeLead.status;
    let categoryName = '';
    let categoryId = '';
    let explanation = '';
    let sampleTemplate = null;

    switch (status) {
      case 'New Lead':
        categoryId = 'cat-outreach';
        categoryName = 'Cold Outreach';
        explanation = `Since ${activeLead.name} is a newly created contact, we recommend reaching out using introductory channels to establish a relationship.`;
        break;
      case 'Contacted':
        categoryId = 'cat-followup';
        categoryName = 'Follow-Ups';
        explanation = `You have already initiated contact with Sarah. Send a Follow-Up email to check if they had time to review your introductory proposal.`;
        break;
      case 'Interested':
        categoryId = 'cat-scheduling';
        categoryName = 'Demo Scheduling';
        explanation = `${activeLead.name} expressed interest in the platform. Coordinate an AE introduction calendar link or propose specific timeslots.`;
        break;
      case 'Busy - Call Later':
        categoryId = 'cat-objections';
        categoryName = 'Objection Handling';
        explanation = `The prospect requested to call back later due to scheduling conflicts. Utilize Objection scripts to pitch a quick 30-second summary or schedule a firm calendar sync.`;
        break;
      case 'Meeting Scheduled':
        categoryId = 'cat-scheduling';
        categoryName = 'Demo Reminders';
        explanation = `A meeting is booked. Send a short Demo Confirmation or Agenda Reminder to reduce no-show rates.`;
        break;
      default:
        categoryId = 'cat-followup';
        categoryName = 'Follow-Ups';
        explanation = `Follow up to keep ${activeLead.name} engaged with relevant case studies or industry insights.`;
    }

    // Find a match template
    sampleTemplate = playbookTemplates.find(t => t.categoryId === categoryId && !t.archived) || null;

    return {
      categoryId,
      categoryName,
      explanation,
      template: sampleTemplate
    };
  }, [activeLead, playbookTemplates]);

  // Template copy statistics / action
  const handleCopy = (template, textType, text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Determine active version
      const activeIdx = activeVersionsMap[template.id] !== undefined 
        ? activeVersionsMap[template.id] 
        : (template.activeVersionIdx || 0);
      const version = template.versions[activeIdx] || template.versions[0];
      
      incrementTemplateUsage(template.id, version.id);
      showToast(`Copied ${textType} to clipboard!`);
    }).catch(err => {
      console.error('Copy failed', err);
    });
  };

  // Add Category handler
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) return;

    savePlaybookCategory({
      name: categoryNameInput.trim(),
      icon: 'Folder'
    });

    setCategoryNameInput('');
    setShowAddCategory(false);
    showToast('Folder category created successfully.');
  };

  // Delete category and verify safety
  const handleDeleteCategory = (catId) => {
    if (window.confirm("Are you sure you want to delete this category? Templates inside won't be deleted but will lose category association.")) {
      deletePlaybookCategory(catId);
      if (selectedFolder === catId) {
        setSelectedFolder('all');
      }
      showToast('Category deleted.');
    }
  };

  // Setup Form for creating a new template
  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      categoryId: selectedFolder !== 'all' && selectedFolder !== 'pinned' && selectedFolder !== 'recent' 
        ? selectedFolder 
        : playbookCategories[0]?.id || 'cat-outreach',
      type: 'email',
      tags: '',
      persona: '',
      country: '',
      industry: '',
      versions: [
        { id: 'v_draft', name: 'V1 - Standard Copy', subject: '', body: '', usageCount: 0, replyRate: 0 }
      ]
    });
    setModalOpen(true);
  };

  // Setup Form for editing a template
  const handleOpenEditModal = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      categoryId: template.categoryId,
      type: template.type,
      tags: template.tags ? template.tags.join(', ') : '',
      persona: template.persona || '',
      country: template.country || '',
      industry: template.industry || '',
      versions: template.versions ? [...template.versions] : [
        { id: 'v_draft', name: 'V1 - Standard Copy', subject: template.subject || '', body: template.body || '', usageCount: 0, replyRate: 0 }
      ]
    });
    setModalOpen(true);
  };

  // Save template Form handler
  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!templateForm.name.trim()) return;

    // Validate versions
    const cleanedVersions = templateForm.versions.map((v, idx) => ({
      ...v,
      id: v.id || `v_${Date.now()}_${idx}`,
      name: v.name || `Version ${idx + 1}`,
      usageCount: v.usageCount || 0,
      replyRate: v.replyRate || 0
    }));

    const tagsArray = templateForm.tags
      ? templateForm.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    const payload = {
      ...editingTemplate,
      name: templateForm.name,
      categoryId: templateForm.categoryId,
      type: templateForm.type,
      tags: tagsArray,
      persona: templateForm.persona,
      country: templateForm.country,
      industry: templateForm.industry,
      versions: cleanedVersions,
      activeVersionIdx: editingTemplate ? editingTemplate.activeVersionIdx : 0
    };

    savePlaybookTemplate(payload);
    setModalOpen(false);
    showToast(editingTemplate ? 'Template updated successfully.' : 'Template created.');
  };

  // Version Management in Form
  const addVersionToForm = () => {
    const count = templateForm.versions.length;
    setTemplateForm({
      ...templateForm,
      versions: [
        ...templateForm.versions,
        {
          id: `v_${Date.now()}_${count}`,
          name: `V${count + 1} - Draft`,
          subject: '',
          body: '',
          usageCount: 0,
          replyRate: 0
        }
      ]
    });
  };

  const removeVersionFromForm = (index) => {
    if (templateForm.versions.length === 1) {
      alert("At least one copy version is required.");
      return;
    }
    const updated = templateForm.versions.filter((_, idx) => idx !== index);
    setTemplateForm({
      ...templateForm,
      versions: updated
    });
  };

  const handleVersionFormChange = (index, field, value) => {
    const updated = [...templateForm.versions];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setTemplateForm({
      ...templateForm,
      versions: updated
    });
  };

  // Toggle Favorite
  const handleTogglePin = (id, e) => {
    e.stopPropagation();
    togglePinPlaybookTemplate(id);
  };

  // Duplicate Template
  const handleDuplicate = (id) => {
    duplicatePlaybookTemplate(id);
    showToast("Template duplicated.");
  };

  // Archive Template
  const handleArchive = (id) => {
    archivePlaybookTemplate(id, true);
    showToast("Template archived.");
  };

  // Tag click handler
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Variable replacement engine
  const resolveTemplateText = (text, lead) => {
    if (!text) return "";
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });

    const replacements = {
      first_name: lead?.name?.split(' ')[0] || "there",
      last_name: lead?.name?.split(' ').slice(1).join(' ') || "",
      company_name: lead?.company || "your company",
      industry: lead?.industry || "your industry",
      country: lead?.country || "your country",
      role: lead?.role || lead?.designation || "your role",
      designation: lead?.role || lead?.designation || "your role",
      email: lead?.email || "your email",
      phone: lead?.phone || "your phone",
      sender_name: senderName,
      meeting_date: formattedDate,
      meeting_time: "10:00 AM"
    };

    return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
      const lowerKey = key.toLowerCase();
      return replacements[lowerKey] !== undefined ? replacements[lowerKey] : match;
    });
  };

  // JSX Highlighter helper for raw template text
  const highlightVariables = (text) => {
    if (!text) return "";
    const parts = text.split(/(\{\{[a-zA-Z0-9_]+\}\})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return <span key={index} className="var-badge">{part}</span>;
      }
      return part;
    });
  };

  // Get matching icon for category
  const renderCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Globe': return <BookOpen size={16} />;
      case 'Clock': return <Layers size={16} />;
      case 'CalendarClock': return <Layers size={16} />;
      default: return <Folder size={16} />;
    }
  };

  // Format Badge
  const getFormatBadge = (type) => {
    switch (type) {
      case 'email': 
        return <span className="format-indicator email"><Mail size={12} /> Email</span>;
      case 'linkedin': 
        return <span className="format-indicator linkedin"><MessageSquare size={12} /> LinkedIn</span>;
      case 'whatsapp': 
        return <span className="format-indicator whatsapp"><MessageSquare size={12} /> WhatsApp</span>;
      case 'call_script': 
        return <span className="format-indicator script"><Phone size={12} /> Call Script</span>;
      case 'notes': 
        return <span className="format-indicator notes"><FileText size={12} /> Notes</span>;
      default:
        return null;
    }
  };

  return (
    <div className="playbook-library-container">
      {/* Toast popup */}
      {toastMessage && (
        <div className="playbook-toast animate-fade-in">
          <Sparkles size={16} className="toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Notion-style Left Sidebar */}
      <div className="playbook-sidebar">
        <div className="playbook-sidebar-header">
          <BookOpen size={18} className="sidebar-title-icon" />
          <h3>Playbook Hub</h3>
        </div>

        <div className="playbook-sidebar-menu">
          <div className="menu-group">
            <span className="group-label">Quick Filters</span>
            <button 
              className={`menu-item-btn ${selectedFolder === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFolder('all')}
            >
              <Layers size={16} />
              <span>All Templates</span>
              <span className="badge-count">{playbookTemplates.filter(t => !t.archived).length}</span>
            </button>

            <button 
              className={`menu-item-btn ${selectedFolder === 'pinned' ? 'active' : ''}`}
              onClick={() => setSelectedFolder('pinned')}
            >
              <Star size={16} className="star-icon" />
              <span>Favorites</span>
              <span className="badge-count">{playbookTemplates.filter(t => t.isPinned && !t.archived).length}</span>
            </button>

            <button 
              className={`menu-item-btn ${selectedFolder === 'recent' ? 'active' : ''}`}
              onClick={() => setSelectedFolder('recent')}
            >
              <TrendingUp size={16} />
              <span>Recently Used</span>
              <span className="badge-count">{playbookTemplates.filter(t => t.lastUsed && !t.archived).length}</span>
            </button>
          </div>

          <div className="menu-group">
            <div className="group-header">
              <span className="group-label">Folders / Categories</span>
              <button 
                className="add-category-inline-btn"
                onClick={() => setShowAddCategory(!showAddCategory)}
                title="Add New Folder Category"
              >
                <FolderPlus size={14} />
              </button>
            </div>

            {showAddCategory && (
              <form onSubmit={handleCreateCategory} className="add-category-inline-form animate-slide-down">
                <input 
                  type="text" 
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  placeholder="Folder name..."
                  className="inline-cat-input"
                  autoFocus
                />
                <button type="submit" className="inline-cat-submit-btn">Create</button>
              </form>
            )}

            <div className="categories-list">
              {playbookCategories.map(cat => (
                <div 
                  key={cat.id} 
                  className={`category-item-row ${selectedFolder === cat.id ? 'active' : ''}`}
                >
                  <button
                    className="category-btn"
                    onClick={() => setSelectedFolder(cat.id)}
                  >
                    {renderCategoryIcon(cat.icon)}
                    <span className="cat-label">{cat.name}</span>
                    <span className="badge-count">
                      {playbookTemplates.filter(t => t.categoryId === cat.id && !t.archived).length}
                    </span>
                  </button>

                  {/* Allow deleting custom categories (categories not default seeded) */}
                  {!['cat-outreach', 'cat-followup', 'cat-scheduling', 'cat-objections', 'cat-postdemo'].includes(cat.id) && (
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="category-delete-btn"
                      title="Delete Category"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Lead HUD Panel */}
        <div className="active-lead-hud">
          <div className="hud-header">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Outreach Target</span>
          </div>

          <div className="hud-content">
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="lead-hud-select"
            >
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
              ))}
            </select>

            {activeLead && (
              <div className="lead-quick-details">
                <div className="detail-line">
                  <span className="lbl">Status:</span>
                  <span className={`status-pill ${(activeLead.status || 'New Lead').toLowerCase().replace(/\s+/g, '-')}`}>
                    {activeLead.status || 'New Lead'}
                  </span>
                </div>
                <div className="detail-line">
                  <span className="lbl">Industry:</span>
                  <span className="val">{activeLead.industry || 'None'}</span>
                </div>
                <div className="detail-line">
                  <span className="lbl">Country:</span>
                  <span className="val">{activeLead.country || 'None'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="playbook-workspace">
        {/* Workspace Toolbar Header */}
        <div className="workspace-toolbar">
          <div className="search-wrap">
            <Search size={18} className="search-icon-inside" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by title, content, tags, country, industry..."
              className="playbook-search-input"
            />
          </div>

          <button 
            onClick={handleOpenCreateModal}
            className="action-btn-primary create-template-btn"
          >
            <Plus size={16} />
            <span>New Template</span>
          </button>
        </div>

        {/* Filter Pills for Formats */}
        <div className="format-filter-tabs">
          <button 
            className={`format-tab-btn ${selectedFormat === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('all')}
          >
            All Formats
          </button>
          <button 
            className={`format-tab-btn ${selectedFormat === 'email' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('email')}
          >
            <Mail size={14} /> Email
          </button>
          <button 
            className={`format-tab-btn ${selectedFormat === 'linkedin' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('linkedin')}
          >
            <MessageSquare size={14} /> LinkedIn
          </button>
          <button 
            className={`format-tab-btn ${selectedFormat === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('whatsapp')}
          >
            <MessageSquare size={14} /> WhatsApp
          </button>
          <button 
            className={`format-tab-btn ${selectedFormat === 'call_script' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('call_script')}
          >
            <Phone size={14} /> Call Script
          </button>
          <button 
            className={`format-tab-btn ${selectedFormat === 'notes' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('notes')}
          >
            <FileText size={14} /> Meeting Notes
          </button>
        </div>

        {/* Tags cloud filtering */}
        {allUniqueTags.length > 0 && (
          <div className="tags-cloud-filter">
            <span className="tag-cloud-label">Tags:</span>
            <div className="tag-badges-row">
              {allUniqueTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`tag-filter-badge ${isSelected ? 'active' : ''}`}
                  >
                    #{tag}
                  </button>
                );
              })}
              {selectedTags.length > 0 && (
                <button 
                  onClick={() => setSelectedTags([])}
                  className="clear-tags-btn"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {/* AI Recommendations Hub panel (Glows dynamically) */}
        {aiRecommendation && (
          <div className="ai-recommender-panel animate-pulse-glow">
            <div className="recommender-header">
              <div className="icon-badge">
                <Sparkles size={16} className="recommender-spark" />
              </div>
              <div className="recommender-title-block">
                <h4>AI Smart Outreach Suggestion</h4>
                <p className="recommender-sub">Based on status: <strong>{activeLead?.status}</strong> for <strong>{activeLead?.name}</strong></p>
              </div>
            </div>
            <div className="recommender-body">
              <p className="rec-text">{aiRecommendation.explanation}</p>
              
              {aiRecommendation.template ? (
                <div className="rec-action-row">
                  <div className="rec-matched-name">
                    <span>Suggested Template:</span>
                    <strong>{aiRecommendation.template.name}</strong>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchQuery(aiRecommendation.template.name);
                      setSelectedFolder('all');
                    }}
                    className="rec-link-btn"
                  >
                    <span>Inspect Template</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="rec-action-row">
                  <span>No template matching this bucket yet.</span>
                  <button 
                    onClick={handleOpenCreateModal}
                    className="rec-link-btn"
                  >
                    <span>Create One Now</span>
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grid listing templates */}
        {filteredTemplates.length === 0 ? (
          <div className="empty-templates-state">
            <BookOpen size={48} className="empty-icon" />
            <h3>No Templates Found</h3>
            <p>Try modifying your folder categories, clearing your search keywords, or create a brand new sales playbook asset.</p>
            <button 
              onClick={handleOpenCreateModal}
              className="action-btn-primary"
            >
              Create New Template
            </button>
          </div>
        ) : (
          <div className="templates-cards-grid">
            {filteredTemplates.map(temp => {
              // Get selected version
              const activeVerIdx = activeVersionsMap[temp.id] !== undefined 
                ? activeVersionsMap[temp.id] 
                : (temp.activeVersionIdx || 0);
              
              const currentVersion = temp.versions[activeVerIdx] || temp.versions[0];
              
              // Resolve placeholders
              const resolvedSubject = resolveTemplateText(currentVersion?.subject, activeLead);
              const resolvedBody = resolveTemplateText(currentVersion?.body, activeLead);

              return (
                <div key={temp.id} className={`template-card ${temp.isPinned ? 'is-pinned' : ''}`}>
                  <div className="card-top-bar">
                    <div className="card-title-group">
                      <div className="title-left">
                        {getFormatBadge(temp.type)}
                        <h4 className="template-name">{temp.name}</h4>
                      </div>
                      <div className="actions-cluster">
                        <button 
                          onClick={(e) => handleTogglePin(temp.id, e)}
                          className={`pin-btn ${temp.isPinned ? 'pinned' : ''}`}
                          title={temp.isPinned ? "Unfavorite" : "Favorite"}
                        >
                          <Pin size={15} />
                        </button>
                        
                        <button 
                          onClick={() => handleDuplicate(temp.id)}
                          className="card-action-icon-btn"
                          title="Duplicate"
                        >
                          <Layers size={14} />
                        </button>

                        <button 
                          onClick={() => handleOpenEditModal(temp)}
                          className="card-action-icon-btn"
                          title="Edit Template"
                        >
                          <Edit size={14} />
                        </button>

                        <button 
                          onClick={() => handleArchive(temp.id)}
                          className="card-action-icon-btn"
                          title="Archive Template"
                        >
                          <Archive size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="card-meta-row">
                      {temp.persona && <span className="meta-badge">Persona: {temp.persona}</span>}
                      {temp.industry && <span className="meta-badge">Industry: {temp.industry}</span>}
                      {temp.country && <span className="meta-badge">Country: {temp.country}</span>}
                      {temp.tags && temp.tags.map(tag => (
                        <span key={tag} className="tag-badge">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Version Picker & Stats */}
                  <div className="version-bar-wrapper">
                    <div className="version-selectors">
                      {temp.versions.map((ver, idx) => (
                        <button
                          key={ver.id || idx}
                          onClick={() => setActiveVersionsMap({ ...activeVersionsMap, [temp.id]: idx })}
                          className={`ver-tab-btn ${activeVerIdx === idx ? 'active' : ''}`}
                        >
                          {ver.name}
                        </button>
                      ))}
                    </div>

                    <div className="version-performance-stats">
                      <span className="stat-pill" title="Total times this template version was copied">
                        Copied: <strong>{currentVersion.usageCount || 0}</strong>
                      </span>
                      {currentVersion.replyRate > 0 && (
                        <span className="stat-pill success" title="Simulated callback or email reply rate">
                          Reply Rate: <strong>{currentVersion.replyRate}%</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Side-by-Side Comparison Workspace */}
                  <div className="comparison-columns-wrapper">
                    {/* Left: Raw Code Template */}
                    <div className="comparison-col raw-template-pane">
                      <div className="col-header">
                        <span>Raw Template Code</span>
                      </div>
                      
                      <div className="col-body">
                        {currentVersion?.subject && (
                          <div className="template-field-wrap">
                            <span className="field-label">Subject:</span>
                            <div className="template-field-content font-mono">
                              {highlightVariables(currentVersion.subject)}
                            </div>
                          </div>
                        )}
                        <div className="template-field-wrap">
                          <span className="field-label">Body:</span>
                          <div className="template-field-content font-mono pre-wrap">
                            {highlightVariables(currentVersion.body)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Resolved Live Preview */}
                    <div className="comparison-col resolved-preview-pane">
                      <div className="col-header">
                        <span>Live Preview ({activeLead?.name || 'No Lead Selected'})</span>
                        <div className="col-actions">
                          {currentVersion?.subject && (
                            <button 
                              onClick={() => handleCopy(temp, "Subject", resolvedSubject)}
                              className="micro-copy-btn"
                              title="Copy Subject Only"
                            >
                              <Copy size={12} />
                              <span>Copy Subject</span>
                            </button>
                          )}
                          <button 
                            onClick={() => handleCopy(temp, "Message Body", resolvedBody)}
                            className="micro-copy-btn"
                            title="Copy Body Only"
                          >
                            <Copy size={12} />
                            <span>Copy Body</span>
                          </button>
                        </div>
                      </div>

                      <div className="col-body">
                        {currentVersion?.subject && (
                          <div className="template-field-wrap">
                            <span className="field-label">Resolved Subject:</span>
                            <div className="template-field-content text-green-glow">
                              {resolvedSubject}
                            </div>
                          </div>
                        )}
                        <div className="template-field-wrap">
                          <span className="field-label">Resolved Body:</span>
                          <div className="template-field-content pre-wrap text-green-glow">
                            {resolvedBody}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats & Trigger Action */}
                  <div className="card-footer-actions">
                    <span className="last-used-label">
                      {temp.lastUsed 
                        ? `Last used: ${new Date(temp.lastUsed).toLocaleDateString()} ${new Date(temp.lastUsed).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                        : "Never used yet"
                      }
                    </span>
                    <button 
                      onClick={() => handleCopy(temp, "Full Copy (Subject + Body)", 
                        currentVersion?.subject ? `Subject: ${resolvedSubject}\n\n${resolvedBody}` : resolvedBody
                      )}
                      className="action-btn-primary copy-asset-full-btn"
                    >
                      <Copy size={14} />
                      <span>One-Click Full Copy</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor dialog modal for Create/Edit templates */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container playbook-edit-modal animate-slide-down">
            <div className="modal-header">
              <h3 className="modal-title">{editingTemplate ? 'Modify Template Asset' : 'Create Sales Playbook Asset'}</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="modal-form">
              <div className="form-group-row">
                <div className="form-item">
                  <label htmlFor="temp-name" className="input-label">Template Name *</label>
                  <input 
                    id="temp-name"
                    type="text" 
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g. Follow Up #2 - Value Pitch"
                    className="name-input"
                    required
                  />
                </div>

                <div className="form-item">
                  <label htmlFor="temp-cat" className="input-label">Category Folder</label>
                  <select
                    id="temp-cat"
                    value={templateForm.categoryId}
                    onChange={(e) => setTemplateForm({ ...templateForm, categoryId: e.target.value })}
                    className="name-input"
                  >
                    {playbookCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-item">
                  <label htmlFor="temp-type" className="input-label">Format Type</label>
                  <select
                    id="temp-type"
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                    className="name-input"
                  >
                    <option value="email">Email</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="call_script">Call Script</option>
                    <option value="notes">Meeting Notes</option>
                  </select>
                </div>

                <div className="form-item">
                  <label htmlFor="temp-tags" className="input-label">Tags (comma-separated)</label>
                  <input 
                    id="temp-tags"
                    type="text" 
                    value={templateForm.tags}
                    onChange={(e) => setTemplateForm({ ...templateForm, tags: e.target.value })}
                    placeholder="e.g. manufacturing, follow-up, pricing"
                    className="name-input"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-item">
                  <label htmlFor="temp-persona" className="input-label">Target Persona (optional)</label>
                  <input 
                    id="temp-persona"
                    type="text" 
                    value={templateForm.persona}
                    onChange={(e) => setTemplateForm({ ...templateForm, persona: e.target.value })}
                    placeholder="e.g. Sales Director, CTO"
                    className="name-input"
                  />
                </div>

                <div className="form-item">
                  <label htmlFor="temp-country" className="input-label">Target Country (optional)</label>
                  <input 
                    id="temp-country"
                    type="text" 
                    value={templateForm.country}
                    onChange={(e) => setTemplateForm({ ...templateForm, country: e.target.value })}
                    placeholder="e.g. Germany, Japan"
                    className="name-input"
                  />
                </div>

                <div className="form-item">
                  <label htmlFor="temp-industry" className="input-label">Target Industry (optional)</label>
                  <input 
                    id="temp-industry"
                    type="text" 
                    value={templateForm.industry}
                    onChange={(e) => setTemplateForm({ ...templateForm, industry: e.target.value })}
                    placeholder="e.g. Software, Finance"
                    className="name-input"
                  />
                </div>
              </div>

              {/* Version Testing Section */}
              <div className="modal-versions-section">
                <div className="section-title-row">
                  <h4>A/B Performance Testing Copies</h4>
                  <button 
                    type="button" 
                    onClick={addVersionToForm}
                    className="action-btn-secondary add-ver-btn"
                  >
                    <Plus size={14} />
                    <span>Add Version</span>
                  </button>
                </div>

                <div className="form-versions-list">
                  {templateForm.versions.map((ver, idx) => (
                    <div key={ver.id || idx} className="form-version-card">
                      <div className="ver-card-header">
                        <input 
                          type="text" 
                          value={ver.name}
                          onChange={(e) => handleVersionFormChange(idx, 'name', e.target.value)}
                          placeholder={`Version ${idx + 1} Name`}
                          className="ver-name-input"
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => removeVersionFromForm(idx)}
                          className="ver-remove-btn"
                          title="Remove Version"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {templateForm.type === 'email' && (
                        <div className="ver-card-item">
                          <label className="input-label-sm">Email Subject</label>
                          <input 
                            type="text" 
                            value={ver.subject || ''}
                            onChange={(e) => handleVersionFormChange(idx, 'subject', e.target.value)}
                            placeholder="e.g. Scaling {{company_name}} sales outbound"
                            className="name-input ver-subject-input"
                          />
                        </div>
                      )}

                      <div className="ver-card-item">
                        <label className="input-label-sm">Message Body</label>
                        <textarea
                          value={ver.body || ''}
                          onChange={(e) => handleVersionFormChange(idx, 'body', e.target.value)}
                          placeholder="e.g. Hi {{first_name}},\n\nI noticed you are leading sales at {{company_name}}..."
                          className="note-textarea ver-body-textarea"
                          rows={4}
                          required
                        ></textarea>
                      </div>

                      <div className="ver-performance-row">
                        <div className="perf-item">
                          <span>Usage count: <strong>{ver.usageCount || 0}</strong></span>
                        </div>
                        <div className="perf-item">
                          <label className="input-label-sm inline-label">Reply Rate %:</label>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={ver.replyRate || 0}
                            onChange={(e) => handleVersionFormChange(idx, 'replyRate', parseInt(e.target.value) || 0)}
                            className="inline-number-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Variables Cheat Sheet Helper */}
              <div className="variables-cheat-sheet">
                <div className="cheat-header">
                  <Info size={14} />
                  <span>Dynamic Variable Cheat Sheet</span>
                </div>
                <div className="cheat-grid">
                  <code>{"{{first_name}}"}</code>
                  <code>{"{{last_name}}"}</code>
                  <code>{"{{company_name}}"}</code>
                  <code>{"{{role}}"}</code>
                  <code>{"{{industry}}"}</code>
                  <code>{"{{country}}"}</code>
                  <code>{"{{email}}"}</code>
                  <code>{"{{phone}}"}</code>
                  <code>{"{{sender_name}}"}</code>
                  <code>{"{{meeting_date}}"}</code>
                  <code>{"{{meeting_time}}"}</code>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="theme-button"
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn-primary">
                  {editingTemplate ? 'Update Asset' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
