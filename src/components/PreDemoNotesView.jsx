import React, { useState, useEffect, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  ClipboardList, 
  Copy, 
  Check, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Star, 
  Info,
  User,
  Building,
  Globe,
  Link2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const PreDemoNotesView = () => {
  const {
    leads,
    accountExecutives,
    saveNote,
    logAction,
    leads: crmLeads
  } = useCRM();

  // State for form
  const [selectedLeadId, setSelectedLeadId] = useState('manual'); // 'manual' or leadId
  const [formState, setFormState] = useState({
    time: '4:00 pm',
    name: '',
    company: '',
    designation: '',
    noOfEmployees: '',
    existingSolution: '',
    painPoints: '',
    pocLinkedIn: '',
    companyLink: '',
    leadSource: 'SF',
    region: '',
    responsibleAe: 'Charchit', // SDR Name
    attendeeSdr: 'Yojna', // AE Name
    questions: '',
    timeline: '',
    feedback: '',
    rating: '',
    intent: '',
    gc: ''
  });

  // State for manual AE entry vs select
  const [aeSelectionMode, setAeSelectionMode] = useState('select'); // 'select' or 'manual'

  // Toast confirmation
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
    }, 2500);
  };

  // Pre-fill form when lead is selected
  useEffect(() => {
    if (selectedLeadId === 'manual') {
      // Don't overwrite if manual, but reset to blank if coming from lead selection
      setFormState(prev => ({
        ...prev,
        time: '4:00 pm',
        name: '',
        company: '',
        designation: '',
        noOfEmployees: '',
        existingSolution: '',
        painPoints: '',
        pocLinkedIn: '',
        companyLink: '',
        leadSource: 'SF',
        region: '',
        responsibleAe: 'Charchit',
        attendeeSdr: 'Yojna',
        questions: '',
        timeline: '',
        feedback: '',
        rating: '',
        intent: '',
        gc: ''
      }));
      return;
    }

    const lead = leads.find(l => l.id === selectedLeadId);
    if (lead) {
      // Attempt to extract website and linkedin link
      const liLink = lead.links?.find(lnk => lnk.label.toLowerCase().includes('linkedin'))?.url || '';
      const webLink = lead.links?.find(lnk => lnk.label.toLowerCase().includes('website') || lnk.label.toLowerCase().includes('company'))?.url || '';
      
      setFormState(prev => ({
        ...prev,
        name: lead.name || '',
        company: lead.company || '',
        designation: lead.role || lead.designation || '',
        pocLinkedIn: liLink,
        companyLink: webLink,
        region: lead.country || '',
        // Keep other SDR specific inputs
      }));
      showToast(`Prefilled details for ${lead.name}`);
    }
  }, [selectedLeadId, leads]);

  // Handle simple form changes
  const handleInputChange = (field, value) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Star rating handler
  const handleStarClick = (rate) => {
    setFormState(prev => ({
      ...prev,
      rating: rate
    }));
  };

  // Format the output exactly as plain text requested by user
  const formattedSlackText = useMemo(() => {
    return `Time : ${formState.time || ''}
Name : ${formState.name || ''}
Company : ${formState.company || ''}
Designation : ${formState.designation || ''}
No of Employees : ${formState.noOfEmployees || ''}
Any existing HR solution : ${formState.existingSolution || ''}
Pain points: ${formState.painPoints || ''}
POC li : ${formState.pocLinkedIn || ''}
company link : ${formState.companyLink || ''}
Lead source: ${formState.leadSource || ''}
Region: ${formState.region || ''}
Responsible: ${formState.responsibleAe || ''}
Attendee- ${formState.attendeeSdr || ''}
Questions: ${formState.questions || ''}
Timeline: ${formState.timeline || ''}
Feedback: ${formState.feedback || ''}
Rating: ${formState.rating || ''}
Intent: ${formState.intent || ''}
GC: ${formState.gc || ''}`;
  }, [formState]);

  // One-click copy handler
  const handleCopySlack = () => {
    navigator.clipboard.writeText(formattedSlackText).then(() => {
      showToast('Slack block copied to clipboard!');
      
      // Log lead action if associated
      if (selectedLeadId && selectedLeadId !== 'manual') {
        logAction({
          leadId: selectedLeadId,
          type: 'Sent Email', // generic outbound communications logger
          notes: `Generated and copied Pre-Demo Notes for Slack. AE: ${formState.responsibleAe || 'N/A'}`
        });
      }
    }).catch(err => {
      console.error('Copy failed', err);
    });
  };

  // Save to CRM notes handler
  const handleSaveToCRM = () => {
    if (selectedLeadId === 'manual') {
      alert('Please associate this form with an existing lead in the CRM to save it to their profile notes.');
      return;
    }

    const notePayload = {
      leadId: selectedLeadId,
      content: `[Pre-Demo Qualifying Notes Summary]\n\nTime: ${formState.time}\nAE: ${formState.responsibleAe}\nSDR Attendee: ${formState.attendeeSdr}\nNo. of Employees: ${formState.noOfEmployees}\nExisting HR Solution: ${formState.existingSolution}\nPain Points: ${formState.painPoints}\nRating: ${formState.rating}/5\nIntent: ${formState.intent}\nGC Fit: ${formState.gc}\nQuestions/Timeline: ${formState.questions} | ${formState.timeline}`
    };

    saveNote(notePayload);
    showToast('Saved pre-demo summary to prospect notes history.');
  };

  const handleResetForm = () => {
    if (window.confirm('Reset the form to default values?')) {
      setSelectedLeadId('manual');
      setFormState({
        time: '4:00 pm',
        name: '',
        company: '',
        designation: '',
        noOfEmployees: '',
        existingSolution: '',
        painPoints: '',
        pocLinkedIn: '',
        companyLink: '',
        leadSource: 'SF',
        region: '',
        responsibleAe: 'Charchit',
        attendeeSdr: 'Yojna',
        questions: '',
        timeline: '',
        feedback: '',
        rating: '',
        intent: '',
        gc: ''
      });
      setAeSelectionMode('select');
      showToast('Form cleared.');
    }
  };

  return (
    <div className="predemo-notes-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="playbook-toast animate-fade-in">
          <Sparkles size={16} className="toast-icon" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="view-header">
        <div className="header-title-group">
          <ClipboardList className="sidebar-title-icon" size={28} />
          <div>
            <h2 className="view-title">Pre-Demo Briefing</h2>
            <p className="view-description text-muted">Qualify prospects, format details, and copy a Slack summary to share instantly with Account Executives.</p>
          </div>
        </div>
      </div>

      <div className="predemo-grid">
        {/* Left Column: Form Editor */}
        <div className="predemo-form-card">
          <div className="card-top-bar">
            <h3 className="section-card-title">Qualification Form</h3>
            
            <div className="form-item association-selector">
              <label htmlFor="associate-lead" className="input-label-sm inline-label">Associate CRM Lead:</label>
              <select
                id="associate-lead"
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="lead-hud-select font-mono"
              >
                <option value="manual">-- Manual Entry / Custom --</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
                ))}
              </select>
            </div>
          </div>

          <form className="predemo-main-form" onSubmit={(e) => e.preventDefault()}>
            {/* Row 1: Time, Attendee, Responsible */}
            <div className="form-row-three">
              <div className="form-item">
                <label className="input-label">Meeting Time</label>
                <input 
                  type="text" 
                  value={formState.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  placeholder="e.g. 4:00 pm"
                  className="name-input"
                />
              </div>

              <div className="form-item">
                <label className="input-label">Attendee (AE)</label>
                <input 
                  type="text" 
                  value={formState.attendeeSdr}
                  onChange={(e) => handleInputChange('attendeeSdr', e.target.value)}
                  placeholder="e.g. Yojna"
                  className="name-input"
                />
              </div>

              <div className="form-item">
                <div className="ae-label-row">
                  <label className="input-label">Responsible (SDR)</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setAeSelectionMode(aeSelectionMode === 'select' ? 'manual' : 'select');
                      handleInputChange('responsibleAe', '');
                    }}
                    className="ae-toggle-mode-btn"
                  >
                    {aeSelectionMode === 'select' ? 'Type Manual' : 'Choose Select'}
                  </button>
                </div>

                {aeSelectionMode === 'select' ? (
                  <select
                    value={formState.responsibleAe}
                    onChange={(e) => handleInputChange('responsibleAe', e.target.value)}
                    className="name-input"
                  >
                    <option value="">-- Choose SDR --</option>
                    <option value="Charchit">Charchit</option>
                    {accountExecutives.map(ae => (
                      <option key={ae.id} value={ae.name}>{ae.name}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={formState.responsibleAe}
                    onChange={(e) => handleInputChange('responsibleAe', e.target.value)}
                    placeholder="e.g. Charchit"
                    className="name-input"
                  />
                )}
              </div>
            </div>

            <div className="form-divider">Prospect Profile</div>

            {/* Row 2: Name, Company, Designation */}
            <div className="form-row-three">
              <div className="form-item">
                <label className="input-label">Prospect Name</label>
                <input 
                  type="text" 
                  value={formState.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Selorm Badger"
                  className="name-input"
                />
              </div>

              <div className="form-item">
                <label className="input-label">Company Name</label>
                <input 
                  type="text" 
                  value={formState.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="e.g. Add Pharma Ghana Limited"
                  className="name-input"
                />
              </div>

              <div className="form-item">
                <label className="input-label">Designation</label>
                <input 
                  type="text" 
                  value={formState.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  placeholder="e.g. HR & Administrative Manager"
                  className="name-input"
                />
              </div>
            </div>

            {/* Row 3: No. of Employees, Source, Region */}
            <div className="form-row-three">
              <div className="form-item">
                <label className="input-label">No. of Employees</label>
                <input 
                  type="number" 
                  value={formState.noOfEmployees}
                  onChange={(e) => handleInputChange('noOfEmployees', e.target.value)}
                  placeholder="e.g. 230"
                  className="name-input"
                />
              </div>

              <div className="form-item">
                <label className="input-label">Lead Source</label>
                <input 
                  type="text" 
                  value={formState.leadSource}
                  onChange={(e) => handleInputChange('leadSource', e.target.value)}
                  placeholder="e.g. SF, LinkedIn"
                  className="name-input"
                />
              </div>

              <div className="form-item">
                <label className="input-label">Region / Country</label>
                <input 
                  type="text" 
                  value={formState.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  placeholder="e.g. Ghana"
                  className="name-input"
                />
              </div>
            </div>

            {/* Row 4: Links */}
            <div className="form-row-two">
              <div className="form-item">
                <label className="input-label">POC LinkedIn URL</label>
                <input 
                  type="url" 
                  value={formState.pocLinkedIn}
                  onChange={(e) => handleInputChange('pocLinkedIn', e.target.value)}
                  placeholder="e.g. https://www.linkedin.com/..."
                  className="name-input"
                />
              </div>

              <div className="form-item">
                <label className="input-label">Company Website</label>
                <input 
                  type="url" 
                  value={formState.companyLink}
                  onChange={(e) => handleInputChange('companyLink', e.target.value)}
                  placeholder="e.g. https://addpharma4u.com/"
                  className="name-input"
                />
              </div>
            </div>

            <div className="form-divider">Technical & BANT Qualification</div>

            {/* Textarea 1: Existing Solutions */}
            <div className="form-item">
              <label className="input-label">Any Existing HR Solution?</label>
              <textarea
                value={formState.existingSolution}
                onChange={(e) => handleInputChange('existingSolution', e.target.value)}
                placeholder="e.g. Used to have an HRMS, but management decided to stop using it..."
                className="note-textarea"
                rows={2}
              ></textarea>
            </div>

            {/* Textarea 2: Pain points */}
            <div className="form-item">
              <label className="input-label">Primary Pain Points</label>
              <textarea
                value={formState.painPoints}
                onChange={(e) => handleInputChange('painPoints', e.target.value)}
                placeholder="List major challenges..."
                className="note-textarea"
                rows={2}
              ></textarea>
            </div>

            {/* Row 5: Questions & Timeline */}
            <div className="form-row-two">
              <div className="form-item">
                <label className="input-label">Key Questions Asked</label>
                <textarea
                  value={formState.questions}
                  onChange={(e) => handleInputChange('questions', e.target.value)}
                  placeholder="What details did they request?"
                  className="note-textarea"
                  rows={2}
                ></textarea>
              </div>

              <div className="form-item">
                <label className="input-label">Timeline to Buy</label>
                <textarea
                  value={formState.timeline}
                  onChange={(e) => handleInputChange('timeline', e.target.value)}
                  placeholder="e.g. Immediate, Q3 start, etc."
                  className="note-textarea"
                  rows={2}
                ></textarea>
              </div>
            </div>

            {/* Textarea 3: General Feedback */}
            <div className="form-item">
              <label className="input-label">Feedback / Call Context</label>
              <textarea
                value={formState.feedback}
                onChange={(e) => handleInputChange('feedback', e.target.value)}
                placeholder="General notes about call vibes or AE guidance..."
                className="note-textarea"
                rows={2}
              ></textarea>
            </div>

            <div className="form-divider">AE Scorecard</div>

            {/* Star Rating, Intent, GC Fit */}
            <div className="form-row-three items-center pb-2">
              <div className="form-item">
                <label className="input-label">Call Score / Rating</label>
                <div className="star-rating-row">
                  {[1, 2, 3, 4, 5].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleStarClick(rate)}
                      className={`star-select-btn ${formState.rating >= rate ? 'active' : ''}`}
                    >
                      <Star size={18} fill={formState.rating >= rate ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-item">
                <label className="input-label">Prospect Intent</label>
                <select
                  value={formState.intent}
                  onChange={(e) => handleInputChange('intent', e.target.value)}
                  className="name-input"
                >
                  <option value="">-- Choose --</option>
                  <option value="High">🔥 High</option>
                  <option value="Medium">⚡ Medium</option>
                  <option value="Low">💤 Low</option>
                </select>
              </div>

              <div className="form-item">
                <label className="input-label">GC (Clean Lead / Good Fit)?</label>
                <select
                  value={formState.gc}
                  onChange={(e) => handleInputChange('gc', e.target.value)}
                  className="name-input"
                >
                  <option value="">-- Choose --</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Yes/No">Yes/No</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Slack Live Preview */}
        <div className="predemo-preview-card">
          <div className="preview-card-header">
            <h3 className="section-card-title">Slack Markdown Format</h3>
            <span className="slack-header-badge">AE Briefing Channels</span>
          </div>

          <div className="preview-card-body">
            <div className="slack-preview-code">
              <pre className="pre-wrap font-mono select-text">{formattedSlackText}</pre>
            </div>
            
            <div className="preview-disclaimer">
              <Info size={14} className="info-icon" />
              <span>Copying exports as plain text spacing, formatted for Slack AE briefings.</span>
            </div>
          </div>

          <div className="preview-card-footer">
            <button 
              onClick={handleResetForm}
              className="theme-button reset-form-btn"
              title="Reset Qualifying Fields"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>

            <button 
              onClick={handleSaveToCRM}
              disabled={selectedLeadId === 'manual'}
              className={`action-btn-secondary crm-save-btn ${selectedLeadId === 'manual' ? 'disabled' : ''}`}
              title="Save formatted brief to CRM lead history notes"
            >
              <Save size={16} />
              <span>Save to CRM</span>
            </button>

            <button 
              onClick={handleCopySlack}
              className="action-btn-primary slack-copy-btn"
              title="Copy formatted block to paste in Slack AE channels"
            >
              <Copy size={16} />
              <span>Copy for Slack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
