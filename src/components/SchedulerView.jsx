import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Calendar, 
  Clock, 
  Search, 
  User, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Filter, 
  Sparkles, 
  Check, 
  Link, 
  UserCheck, 
  Plus, 
  Trash2, 
  Settings,
  Mail,
  Copy,
  CalendarCheck,
  X
} from 'lucide-react';

const TIMEZONE_BY_COUNTRY = {
  'United States': 'America/New_York',
  'Canada': 'America/Toronto',
  'United Kingdom': 'Europe/London',
  'Germany': 'Europe/Berlin',
  'France': 'Europe/Paris',
  'Singapore': 'Asia/Singapore',
  'Japan': 'Asia/Tokyo',
  'South Korea': 'Asia/Seoul',
  'India': 'Asia/Kolkata',
  'Indonesia': 'Asia/Jakarta',
  'Australia': 'Australia/Sydney',
  'Brazil': 'America/Sao_Paulo',
  'South Africa': 'Africa/Johannesburg',
  'United Arab Emirates': 'Asia/Dubai',
  'Nigeria': 'Africa/Lagos',
  'Mexico': 'America/Mexico_City'
};

const TIMEZONE_BY_PHONE_PREFIX = [
  { prefix: '+1', timezone: 'America/New_York' },
  { prefix: '+44', timezone: 'Europe/London' },
  { prefix: '+49', timezone: 'Europe/Berlin' },
  { prefix: '+33', timezone: 'Europe/Paris' },
  { prefix: '+65', timezone: 'Asia/Singapore' },
  { prefix: '+81', timezone: 'Asia/Tokyo' },
  { prefix: '+82', timezone: 'Asia/Seoul' },
  { prefix: '+91', timezone: 'Asia/Kolkata' },
  { prefix: '+62', timezone: 'Asia/Jakarta' },
  { prefix: '+61', timezone: 'Australia/Sydney' },
  { prefix: '+55', timezone: 'America/Sao_Paulo' },
  { prefix: '+27', timezone: 'Africa/Johannesburg' },
  { prefix: '+971', timezone: 'Asia/Dubai' },
  { prefix: '+234', timezone: 'Africa/Lagos' },
  { prefix: '+52', timezone: 'America/Mexico_City' }
];

// Helper: Format timezone offset text
const formatTimezoneAbbr = (timezone, date = new Date()) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || 'GMT';
  } catch (e) {
    return 'GMT';
  }
};

// Helper: get converted Date parts
const getTimezoneParts = (timezone, date = new Date()) => {
  try {
    const options = {
      timeZone: timezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', weekday: 'long',
      hour12: false
    };
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });
    return {
      year: parseInt(map.year),
      month: parseInt(map.month),
      day: parseInt(map.day),
      hour: parseInt(map.hour),
      minute: parseInt(map.minute),
      weekday: map.weekday,
      formattedTime: `${map.hour.padStart(2, '0')}:${map.minute.padStart(2, '0')}`,
      dateString: `${map.year}-${map.month.toString().padStart(2, '0')}-${map.day.toString().padStart(2, '0')}`
    };
  } catch (e) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
      formattedTime: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      dateString: date.toISOString().split('T')[0]
    };
  }
};

export const SchedulerView = () => {
  const {
    leads,
    accountExecutives,
    aeDemos,
    saveAccountExecutive,
    deleteAccountExecutive,
    saveAEDemo,
    deleteAEDemo,
    navigateTo
  } = useCRM();

  const [activeTab, setActiveTab] = useState('scheduler'); // 'scheduler' | 'aes'
  
  // Live Call Scheduler HUD State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedAEId, setSelectedAEId] = useState('');
  const [prospectTimezone, setProspectTimezone] = useState('America/New_York');
  const [selectedDateStr, setSelectedDateStr] = useState(''); // YYYY-MM-DD
  const [filterSlotPeriod, setFilterSlotPeriod] = useState('all'); // 'all' | 'morning' | 'afternoon'
  
  // Dynamic slot details hover
  const [hoveredSlot, setHoveredSlot] = useState(null);

  // Modals & Confirmation States
  const [bookingConfirmation, setBookingConfirmation] = useState(null); // demo object just booked
  const [mockOAuthAE, setMockOAuthAE] = useState(null);
  const [oauthConnecting, setOauthConnecting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState('google');
  
  // AE Editor Modal
  const [editingAE, setEditingAE] = useState(null);
  const [aeForm, setAeForm] = useState({ name: '', email: '', department: '', timezone: 'America/New_York', workStart: 9, workEnd: 17, meetingPreference: 'meet' });

  // Refs for keyboard dropdown selections
  const [searchFocused, setSearchFocused] = useState(false);
  const [keyboardSelectIdx, setKeyboardSelectIdx] = useState(-1);
  const searchInputRef = useRef(null);

  // Default dates initially
  useEffect(() => {
    if (!selectedDateStr) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDateStr(tomorrow.toISOString().split('T')[0]);
    }
  }, [selectedDateStr]);

  // Set default AE once loaded
  useEffect(() => {
    if (accountExecutives.length > 0 && !selectedAEId) {
      const connectedAE = accountExecutives.find(a => a.calendarConnected);
      if (connectedAE) {
        setSelectedAEId(connectedAE.id);
      } else {
        setSelectedAEId(accountExecutives[0].id);
      }
    }
  }, [accountExecutives, selectedAEId]);

  // Automatically resolve prospect timezone when selectedLead changes
  useEffect(() => {
    if (!selectedLead) return;

    let detectedTz = 'America/New_York';
    
    // 1. Check phone code prefix
    if (selectedLead.phone) {
      const cleanPhone = selectedLead.phone.trim();
      const matchedPrefix = TIMEZONE_BY_PHONE_PREFIX.find(p => cleanPhone.startsWith(p.prefix));
      if (matchedPrefix) {
        detectedTz = matchedPrefix.timezone;
      } else if (selectedLead.country && TIMEZONE_BY_COUNTRY[selectedLead.country]) {
        // 2. Check country lookup
        detectedTz = TIMEZONE_BY_COUNTRY[selectedLead.country];
      }
    } else if (selectedLead.country && TIMEZONE_BY_COUNTRY[selectedLead.country]) {
      detectedTz = TIMEZONE_BY_COUNTRY[selectedLead.country];
    }
    
    setProspectTimezone(detectedTz);
  }, [selectedLead]);

  // Filter leads based on Search Query
  const filteredLeads = searchQuery.trim() === '' ? [] : leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard navigation for HUD Lead search list
  const handleSearchKeyDown = (e) => {
    if (filteredLeads.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setKeyboardSelectIdx(prev => Math.min(prev + 1, filteredLeads.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setKeyboardSelectIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (keyboardSelectIdx >= 0 && keyboardSelectIdx < filteredLeads.length) {
        handleSelectLead(filteredLeads[keyboardSelectIdx]);
      }
    } else if (e.key === 'Escape') {
      setSearchFocused(false);
    }
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setSearchQuery(lead.name);
    setSearchFocused(false);
    setKeyboardSelectIdx(-1);
    setBookingConfirmation(null);
  };

  // Simulated calendar busy blocks for Account Executives
  const checkConflictBusyBlocks = (aeId, utcDate) => {
    // John Smith (ae-1) standup block: 10:00 AM - 11:00 AM daily in Eastern Time (America/New_York)
    // Sarah Connor (ae-2) focus block: Wednesday (2026-06-17) 1:00 PM - 3:00 PM GMT (Europe/London)
    // David Miller (ae-3) block: APAC team sync: 8:00 AM - 9:00 AM daily local Singapore Time
    
    const JohnSmithTzParts = getTimezoneParts('America/New_York', utcDate);
    const SarahConnorTzParts = getTimezoneParts('Europe/London', utcDate);
    const DavidMillerTzParts = getTimezoneParts('Asia/Singapore', utcDate);
    
    const JohnSmithHourFraction = JohnSmithTzParts.hour + JohnSmithTzParts.minute / 60;
    const SarahConnorHourFraction = SarahConnorTzParts.hour + SarahConnorTzParts.minute / 60;
    const DavidMillerHourFraction = DavidMillerTzParts.hour + DavidMillerTzParts.minute / 60;

    if (aeId === 'ae-1') {
      // daily sync 10:00 - 11:00 EST
      if (JohnSmithHourFraction >= 10 && JohnSmithHourFraction < 11) {
        return { reason: 'Standup Sync (AE Calendar Block)', type: 'standup' };
      }
    } else if (aeId === 'ae-2') {
      // Wednesday Focus block 13:00 - 15:00 local Europe/London
      if (SarahConnorTzParts.weekday === 'Wednesday' && SarahConnorHourFraction >= 13 && SarahConnorHourFraction < 15) {
        return { reason: 'Focus Block (Outlook Focus Time)', type: 'focus' };
      }
    } else if (aeId === 'ae-3') {
      // daily sync 8:00 - 9:00 SGT
      if (DavidMillerHourFraction >= 8 && DavidMillerHourFraction < 9) {
        return { reason: 'APAC Alignment (AE Calendar Block)', type: 'alignment' };
      }
    }

    // Next check for booked demos in aeDemos
    const overlappingDemo = aeDemos.find(d => {
      if (d.aeId !== aeId || d.status !== 'Scheduled') return false;
      const demoStart = new Date(d.dateTime);
      const demoEnd = new Date(demoStart.getTime() + d.duration * 60 * 1000);
      const testStart = utcDate;
      const testEnd = new Date(utcDate.getTime() + 30 * 60 * 1000); // slot length is 30 mins
      
      // overlap checks
      return testStart < demoEnd && testEnd > demoStart;
    });

    if (overlappingDemo) {
      return { reason: 'Double Booking Conflict (Already scheduled demo)', type: 'booked' };
    }

    return null; // free slot!
  };

  // Availability slots calculation for selected date
  const generateDailySlots = (ae, dateStr) => {
    if (!ae || !dateStr) return [];
    
    const slots = [];
    
    // We construct 30-min intervals starting at 8:00 AM to 6:00 PM local AE timezone to cover all working hours
    const rangeStart = Math.min(ae.workStart, 9);
    const rangeEnd = Math.max(ae.workEnd, 17);
    
    // Let's create slots relative to the user's selected date in AE timezone
    for (let h = rangeStart; h < rangeEnd; h += 0.5) {
      const hourVal = Math.floor(h);
      const minVal = (h - hourVal) * 60;
      
      // Build a local Date in target AE timezone
      // We will parse it and construct the corresponding UTC date
      const localAEDate = new Date(`${dateStr}T${hourVal.toString().padStart(2, '0')}:${minVal.toString().padStart(2, '0')}:00`);
      
      // To adjust for timezone discrepancy, calculate timezone offset
      // Since localAEDate is constructed in SDR's timezone, let's map it accurately:
      const tzOptions = { timeZone: ae.timezone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false };
      const formattedParts = new Intl.DateTimeFormat('en-US', tzOptions).formatToParts(localAEDate);
      const tzMap = {};
      formattedParts.forEach(p => { tzMap[p.type] = p.value; });
      
      // Calculate delta offset difference
      const sdrDateStr = `${localAEDate.getFullYear()}-${(localAEDate.getMonth() + 1).toString().padStart(2, '0')}-${localAEDate.getDate().toString().padStart(2, '0')} ${localAEDate.getHours().toString().padStart(2, '0')}:${localAEDate.getMinutes().toString().padStart(2, '0')}`;
      const targetDateStr = `${tzMap.year}-${tzMap.month.toString().padStart(2, '0')}-${tzMap.day.toString().padStart(2, '0')} ${tzMap.hour.toString().padStart(2, '0')}:${tzMap.minute.toString().padStart(2, '0')}`;
      
      const sdrTime = new Date(localAEDate);
      const diffMs = sdrTime.getTime() - new Date(localAEDate.toLocaleString('en-US', { timeZone: ae.timezone })).getTime();
      
      const actualUTCDate = new Date(localAEDate.getTime() + diffMs);
      
      // Retrieve timezone conversion slots
      const sdrParts = getTimezoneParts(Intl.DateTimeFormat().resolvedOptions().timeZone, actualUTCDate);
      const aeParts = getTimezoneParts(ae.timezone, actualUTCDate);
      const prospectParts = getTimezoneParts(prospectTimezone, actualUTCDate);
      
      // Check if slot falls in weekends or AE working hours
      const isWeekend = aeParts.weekday === 'Saturday' || aeParts.weekday === 'Sunday';
      const insideAEWorkHours = h >= ae.workStart && h < ae.workEnd;
      
      // Evaluate conflicts
      const conflict = checkConflictBusyBlocks(ae.id, actualUTCDate);
      
      // Evaluate prospect hours status
      const prospectHourFraction = prospectParts.hour + prospectParts.minute / 60;
      const insideProspectWorkHours = prospectHourFraction >= 9 && prospectHourFraction < 18;
      
      // Determine overall availability status
      let status = 'Available'; // 'Available', 'Conflict', 'Outside Hours'
      let reasonText = '';
      
      if (!ae.calendarConnected) {
        status = 'Conflict';
        reasonText = 'AE Calendar Disconnected';
      } else if (isWeekend) {
        status = 'Outside Hours';
        reasonText = 'Weekend Slot';
      } else if (!insideAEWorkHours) {
        status = 'Outside Hours';
        reasonText = 'Outside AE Working Hours';
      } else if (conflict) {
        status = 'Conflict';
        reasonText = conflict.reason;
      }
      
      slots.push({
        timeVal: h,
        utcDate: actualUTCDate,
        formattedTime: aeParts.formattedTime,
        sdrTime: sdrParts.formattedTime,
        aeTime: aeParts.formattedTime,
        prospectTime: prospectParts.formattedTime,
        prospectWeekday: prospectParts.weekday,
        sdrWeekday: sdrParts.weekday,
        aeWeekday: aeParts.weekday,
        status,
        reasonText,
        insideProspectWorkHours
      });
    }
    
    return slots;
  };

  const activeAE = accountExecutives.find(a => a.id === selectedAEId);
  const rawSlots = generateDailySlots(activeAE, selectedDateStr);

  // Apply filters from Booking Assistant quick tabs
  const filteredSlots = rawSlots.filter(slot => {
    if (slot.status === 'Outside Hours') return false; // hide outside working hours by default
    
    const prospectHour = parseInt(slot.prospectTime.split(':')[0]);
    
    if (filterSlotPeriod === 'morning') {
      return prospectHour < 12;
    } else if (filterSlotPeriod === 'afternoon') {
      return prospectHour >= 12;
    }
    return true; // 'all'
  });

  // Calculate Suggested Slots: top 3 optimal slots (weekday, overlap prospect business hours, free)
  const suggestedSlots = (() => {
    if (!activeAE) return [];
    
    const list = [];
    const datesToEvaluate = [];
    
    // Evaluate next 4 days (starting tomorrow)
    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      datesToEvaluate.push(d.toISOString().split('T')[0]);
    }
    
    datesToEvaluate.forEach(dateStr => {
      const daySlots = generateDailySlots(activeAE, dateStr);
      daySlots.forEach(s => {
        // filter out busy
        if (s.status !== 'Available') return;
        
        // Calculate scoring for sorting
        let suggestionScore = 0;
        const aeHour = s.timeVal;
        const prospectHour = parseInt(s.prospectTime.split(':')[0]);
        
        // 1. Prefer mutual business hour overlaps
        if (s.insideProspectWorkHours) suggestionScore += 50;
        
        // 2. Prefer peak client hours (10 AM - 12 PM, 2 PM - 4 PM client timezone)
        if ((prospectHour >= 10 && prospectHour < 12) || (prospectHour >= 14 && prospectHour < 16)) {
          suggestionScore += 30;
        }
        
        // 3. Avoid shifts overlapping late evenings for either side
        if (aeHour >= activeAE.workEnd - 1 || prospectHour >= 17) {
          suggestionScore -= 15;
        }

        // 4. Prefer earlier days (tomorrow has higher score than 3 days later)
        const daysDiff = (new Date(dateStr) - new Date()) / (24 * 60 * 60 * 1000);
        suggestionScore += (5 - daysDiff) * 3; 

        list.push({
          ...s,
          dateStr,
          suggestionScore
        });
      });
    });
    
    // Sort and return top 3
    return list.sort((a, b) => b.suggestionScore - a.suggestionScore).slice(0, 3);
  })();

  // Instant Booking triggers
  const handleBookDemo = (slotVal) => {
    if (!selectedLead || !activeAE) return;
    
    // Generate simulated platform credentials
    let meetingLink = 'https://meet.google.com/xyz-pdqk-wvs';
    if (activeAE.meetingPreference === 'teams') {
      meetingLink = 'https://teams.microsoft.com/l/meetup-join/ae-teams-call';
    } else if (activeAE.meetingPreference === 'zoom') {
      meetingLink = 'https://zoom.us/j/9876543210';
    }

    const newDemo = {
      leadId: selectedLead.id,
      aeId: activeAE.id,
      dateTime: slotVal.utcDate.toISOString(),
      duration: 30,
      meetingLink,
      platform: activeAE.meetingPreference,
      notes: `SDR Scheduled live demo call. Client Local Time: ${slotVal.prospectWeekday} ${slotVal.prospectTime}.`,
      status: 'Scheduled'
    };

    const saved = saveAEDemo(newDemo);
    setBookingConfirmation(saved);
  };

  // Mock Calendar connections Authorization flow
  const handleOpenOAuthConnect = (ae, provider) => {
    setMockOAuthAE(ae);
    setOauthProvider(provider);
    setOauthConnecting(false);
    setSearchFocused(false);
  };

  const handleAuthorizeOAuth = () => {
    setOauthConnecting(true);
    
    // Simulate OAuth consent loading spinner
    setTimeout(() => {
      const updatedAE = {
        ...mockOAuthAE,
        calendarConnected: true,
        calendarProvider: oauthProvider
      };
      saveAccountExecutive(updatedAE);
      setOauthConnecting(false);
      setMockOAuthAE(null);
    }, 2000); // 2 second mock load
  };

  // AE profile CRUD handlers
  const handleOpenNewAE = () => {
    setEditingAE({ id: null });
    setAeForm({
      name: '',
      email: '',
      department: 'Mid-Market Sales',
      timezone: 'America/New_York',
      workStart: 9,
      workEnd: 17,
      meetingPreference: 'meet'
    });
  };

  const handleOpenEditAE = (ae) => {
    setEditingAE(ae);
    setAeForm({
      name: ae.name,
      email: ae.email,
      department: ae.department,
      timezone: ae.timezone,
      workStart: ae.workStart,
      workEnd: ae.workEnd,
      meetingPreference: ae.meetingPreference
    });
  };

  const handleSaveAE = (e) => {
    e.preventDefault();
    if (!aeForm.name.trim() || !aeForm.email.trim()) return;

    const aePayload = {
      id: editingAE.id,
      name: aeForm.name,
      email: aeForm.email,
      department: aeForm.department,
      timezone: aeForm.timezone,
      workStart: parseFloat(aeForm.workStart),
      workEnd: parseFloat(aeForm.workEnd),
      meetingPreference: aeForm.meetingPreference,
      calendarConnected: editingAE.id ? editingAE.calendarConnected : false,
      calendarProvider: editingAE.id ? editingAE.calendarProvider : 'google'
    };

    saveAccountExecutive(aePayload);
    setEditingAE(null);
  };

  const handleDeleteAE = (id) => {
    if (confirm('Are you sure you want to delete this AE profile? This will cancel all their scheduled demos.')) {
      deleteAccountExecutive(id);
      if (selectedAEId === id) {
        setSelectedAEId('');
      }
      setEditingAE(null);
    }
  };

  // Copy meeting details template to clipboard
  const handleCopyMeetingTemplate = (demo) => {
    const associatedLeadName = leads.find(l => l.id === demo.leadId)?.name || 'Lead';
    const associatedAeName = accountExecutives.find(a => a.id === demo.aeId)?.name || 'AE';
    const dateText = new Date(demo.dateTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    const timeText = new Date(demo.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const emailBody = `Hi ${associatedLeadName},

Thanks for jumping on a call with me today!

I have scheduled a product demo for you with our Account Executive, ${associatedAeName}. Here are the event details:

📅 Date: ${dateText}
🕒 Time: ${timeText} (local standard time)
🔗 Meeting Link: ${demo.meetingLink}

You will receive a calendar invite shortly. We look forward to speaking with you!

Best regards,
Sales Companion Team`;

    navigator.clipboard.writeText(emailBody);
    alert('Meeting confirmation email template copied to clipboard!');
  };

  // Preset quick filter helper phrases
  const handleApplyQuickFilterPhrase = (dateDaysAhead, filterPeriod) => {
    const d = new Date();
    d.setDate(d.getDate() + dateDaysAhead);
    setSelectedDateStr(d.toISOString().split('T')[0]);
    setFilterSlotPeriod(filterPeriod);
  };

  return (
    <div className="view-content scheduler-view-root">
      
      {/* Header */}
      <header className="view-header">
        <div>
          <h1 className="view-title flex-items-center">
            <CalendarCheck className="header-icon text-accent mr-2" size={32} />
            Demo Scheduling Assistant
          </h1>
          <p className="view-description">One-click scheduling assistant optimized for live prospect calls. Synced AE calendars, smart time-zone converters, and meeting link triggers.</p>
        </div>

        {/* View Tabs Selector */}
        <div className="sort-buttons-group bg-dark-glow p-1 rounded-8">
          <button 
            className={`sort-tab-btn ${activeTab === 'scheduler' ? 'active' : ''}`}
            onClick={() => { setActiveTab('scheduler'); setBookingConfirmation(null); }}
          >
            Live Call HUD
          </button>
          <button 
            className={`sort-tab-btn ${activeTab === 'aes' ? 'active' : ''}`}
            onClick={() => setActiveTab('aes')}
          >
            AE Profiles & Integrations
          </button>
        </div>
      </header>

      {activeTab === 'scheduler' ? (
        <div className="scheduler-hud-layout">
          
          {/* Left Column: Input Panel */}
          <div className="scheduler-left-panel">
            
            {/* Lead Search HUD */}
            <div className="dashboard-section-card relative">
              <label className="input-label" htmlFor="lead-hud-search">1. Search & Select Lead *</label>
              <div className="search-wrapper w-100 max-w-100">
                <Search size={16} className="search-icon" />
                <input
                  id="lead-hud-search"
                  ref={searchInputRef}
                  type="text"
                  className="search-input w-100"
                  placeholder="Type lead name or company... (Arrow Keys + Enter)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                    setSelectedLead(null);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleSearchKeyDown}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className="icon-btn-tiny search-clear-btn" 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedLead(null);
                      setBookingConfirmation(null);
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Lead Autocomplete Dropdown list */}
              {searchFocused && filteredLeads.length > 0 && (
                <div className="leads-hud-autocomplete-dropdown">
                  {filteredLeads.map((l, idx) => (
                    <div 
                      key={l.id} 
                      className={`dropdown-row-item ${keyboardSelectIdx === idx ? 'keyboard-selected' : ''}`}
                      onClick={() => handleSelectLead(l)}
                    >
                      <User size={14} className="text-muted mr-1" />
                      <span className="lead-name-bold">{l.name}</span>
                      <span className="lead-company-sub">({l.company})</span>
                      <span className="lead-location-tag ml-auto">{l.country || 'No Country'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Lead Info Summary Card */}
              {selectedLead && (
                <div className="selected-lead-hud-summary animated-slide-up">
                  <div className="lead-header-row">
                    <UserCheck className="text-accent" size={18} />
                    <span className="lead-name-title">{selectedLead.name}</span>
                    <span className="lead-role-sub">{selectedLead.company} • {selectedLead.role}</span>
                  </div>
                  <div className="lead-meta-details-grid">
                    <div className="meta-cell">
                      <span className="meta-lbl">Country:</span>
                      <span className="meta-val">{selectedLead.country || 'N/A'}</span>
                    </div>
                    <div className="meta-cell">
                      <span className="meta-lbl">Phone:</span>
                      <span className="meta-val">{selectedLead.phone || 'N/A'}</span>
                    </div>
                    <div className="meta-cell">
                      <span className="meta-lbl">Detected Timezone:</span>
                      <span className="meta-val flex-items-center">
                        <Globe size={10} className="mr-1 text-accent-secondary" />
                        {prospectTimezone} ({formatTimezoneAbbr(prospectTimezone)})
                      </span>
                    </div>
                  </div>

                  {/* Manual Timezone override dropdown */}
                  <div className="timezone-override-block">
                    <label className="override-lbl" htmlFor="timezone-manual-override">Manual timezone fallback:</label>
                    <select 
                      id="timezone-manual-override"
                      className="timezone-override-select"
                      value={prospectTimezone}
                      onChange={(e) => setProspectTimezone(e.target.value)}
                    >
                      {Object.keys(TIMEZONE_BY_COUNTRY).map(c => (
                        <option key={c} value={TIMEZONE_BY_COUNTRY[c]}>{c} ({TIMEZONE_BY_COUNTRY[c]})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Select AE Card */}
            <div className="dashboard-section-card mt-2">
              <label className="input-label" htmlFor="ae-selection-select">2. Select Account Executive *</label>
              <select
                id="ae-selection-select"
                className="name-input w-100"
                value={selectedAEId}
                onChange={(e) => { setSelectedAEId(e.target.value); setBookingConfirmation(null); }}
              >
                <option value="">-- Select AE --</option>
                {accountExecutives.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.department}) {a.calendarConnected ? '🟢 Connected' : '🔴 Disconnected'}
                  </option>
                ))}
              </select>

              {activeAE && (
                <div className="ae-summary-hud">
                  <div className="ae-detail-line">
                    <span className="lbl">AE Timezone:</span>
                    <span className="val">{activeAE.timezone} ({formatTimezoneAbbr(activeAE.timezone)})</span>
                  </div>
                  <div className="ae-detail-line">
                    <span className="lbl">Shifts:</span>
                    <span className="val">{activeAE.workStart}:00 - {activeAE.workEnd}:00 local</span>
                  </div>
                  <div className="ae-detail-line">
                    <span className="lbl">Calendar provider:</span>
                    <span className="val capitalize text-accent-secondary">{activeAE.calendarProvider} ({activeAE.calendarConnected ? 'Connected' : 'Disconnected'})</span>
                  </div>
                </div>
              )}
            </div>

            {/* suggested slots selector */}
            {selectedLead && activeAE && activeAE.calendarConnected && (
              <div className="dashboard-section-card mt-2 suggester-slots-hud">
                <div className="suggester-header">
                  <Sparkles size={16} className="text-accent animate-pulse" />
                  <span className="suggester-title">AE Available Slots Recommended</span>
                </div>
                <div className="suggester-description">Click one to schedule the demo instantly.</div>
                
                <div className="suggested-buttons-list">
                  {suggestedSlots.length === 0 ? (
                    <div className="empty-suggested-state">No overlap slots found in the next 3 days.</div>
                  ) : (
                    suggestedSlots.map((s, idx) => {
                      const formattedDate = new Date(s.dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                      return (
                        <button 
                          key={idx}
                          type="button"
                          className="suggested-slot-action-btn"
                          onClick={() => handleBookDemo(s)}
                        >
                          <div className="btn-time-group">
                            <span className="date-badge">{formattedDate}</span>
                            <span className="time-badge">{s.prospectTime} (Client)</span>
                          </div>
                          <div className="btn-ae-group">
                            <span>{s.aeTime} (AE Local)</span>
                            <ArrowRight size={12} />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Calendar Grid & Booking */}
          <div className="scheduler-right-panel">
            
            {/* Filters Bar & Booking Assistant Phrase Helper */}
            <div className="dashboard-section-card p-3 flex-items-center justify-between gap-1 flex-wrap">
              <div className="booking-phrase-prompts">
                <span className="assistant-lbl">Booking Assistant Phrases:</span>
                <button 
                  className="phrase-pill-btn"
                  onClick={() => handleApplyQuickFilterPhrase(1, 'afternoon')}
                >
                  "Tomorrow afternoon"
                </button>
                <button 
                  className="phrase-pill-btn"
                  onClick={() => handleApplyQuickFilterPhrase(3, 'morning')}
                >
                  "Thursday morning"
                </button>
                <button 
                  className="phrase-pill-btn"
                  onClick={() => handleApplyQuickFilterPhrase(2, 'all')}
                >
                  "Wednesday"
                </button>
              </div>

              <div className="slot-filter-period-group">
                <button 
                  className={`filter-period-btn ${filterSlotPeriod === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterSlotPeriod('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-period-btn ${filterSlotPeriod === 'morning' ? 'active' : ''}`}
                  onClick={() => setFilterSlotPeriod('morning')}
                >
                  Morning
                </button>
                <button 
                  className={`filter-period-btn ${filterSlotPeriod === 'afternoon' ? 'active' : ''}`}
                  onClick={() => setFilterSlotPeriod('afternoon')}
                >
                  Afternoon
                </button>
              </div>
            </div>

            {/* Availability Engine Card & Date Selector */}
            <div className="dashboard-section-card mt-2 select-date-and-time-card">
              <div className="calendar-card-header">
                <h3 className="section-card-title flex-items-center">
                  <Calendar size={18} className="text-accent mr-2" />
                  AE Availability Engine Schedule
                </h3>
                <div className="date-input-wrapper">
                  <input 
                    type="date"
                    className="name-input m-0 pt-1 pb-1"
                    value={selectedDateStr}
                    onChange={(e) => { setSelectedDateStr(e.target.value); setBookingConfirmation(null); }}
                  />
                </div>
              </div>

              {/* Slots Grid */}
              {!selectedLead ? (
                <div className="empty-section-state p-5">
                  <User size={36} className="empty-state-icon text-accent" />
                  <h4>No Lead Selected</h4>
                  <p>Please select a lead on the left pane to initialize availability schedules.</p>
                </div>
              ) : !activeAE ? (
                <div className="empty-section-state p-5">
                  <AlertCircle size={36} className="empty-state-icon text-warning" />
                  <h4>No AE Selected</h4>
                  <p>Please select an Account Executive to check calendar blocks.</p>
                </div>
              ) : !activeAE.calendarConnected ? (
                <div className="empty-section-state p-5 flex-items-center flex-direction-column justify-center text-center">
                  <AlertCircle size={40} className="text-warning mb-2" />
                  <h4>AE Calendar Disconnected</h4>
                  <p className="mb-2">Calendar connectivity is required to load busy time blocks for {activeAE.name}.</p>
                  <button 
                    className="action-btn-primary flex-items-center gap-1"
                    onClick={() => handleOpenOAuthConnect(activeAE, activeAE.calendarProvider || 'google')}
                  >
                    <span>Connect Calendar</span>
                  </button>
                </div>
              ) : (
                <div className="ae-slots-selection-panel">
                  <div className="slots-grid-list">
                    {filteredSlots.length === 0 ? (
                      <div className="empty-section-state p-4">No matching available slots found. Try changing dates or filters.</div>
                    ) : (
                      filteredSlots.map((slot, idx) => {
                        const isAvailable = slot.status === 'Available';
                        
                        return (
                          <div 
                            key={idx}
                            className={`slot-row-item slot-${slot.status.toLowerCase().replace(' ', '-')} ${hoveredSlot === slot ? 'hovered' : ''}`}
                            onMouseEnter={() => setHoveredSlot(slot)}
                            onMouseLeave={() => setHoveredSlot(null)}
                          >
                            <div className="slot-ae-local-time">
                              <Clock size={12} className="text-muted mr-1" />
                              <span className="slot-time-text">{slot.aeTime}</span>
                              <span className="slot-zone-tag">AE Local</span>
                            </div>

                            <div className="slot-status-indicator">
                              <span className={`status-dot dot-${slot.status.toLowerCase().replace(' ', '-')}`} />
                              <span className="status-label-text truncate">{slot.reasonText || 'Available'}</span>
                            </div>

                            <div className="slot-prospect-time-indicator">
                              <span className="time-val truncate">Client: {slot.prospectWeekday.slice(0,3)} {slot.prospectTime}</span>
                              <span className={`overlap-tag ${slot.insideProspectWorkHours ? 'preferred-green' : 'outside-grey'}`}>
                                {slot.insideProspectWorkHours ? 'Peak Overlap' : 'Outside Office'}
                              </span>
                            </div>

                            <div className="slot-actions">
                              {isAvailable ? (
                                <button 
                                  className="action-btn-call-mini hover-green"
                                  onClick={() => handleBookDemo(slot)}
                                >
                                  Book Demo
                                </button>
                              ) : (
                                <span className="action-btn-call-mini disabled-btn">Blocked</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Side-by-side Three clock timezone converter */}
                  <div className="three-clock-converter-card">
                    <h4 className="clock-card-title flex-items-center">
                      <Clock size={14} className="text-accent mr-1" />
                      Smart Time Zone Converter (3-Clocks)
                    </h4>
                    
                    <div className="clocks-grid-layout">
                      {/* Clock 1: Prospect */}
                      <div className="clock-cell border-green">
                        <span className="clock-label">Prospect Local</span>
                        <span className="clock-val">
                          {hoveredSlot ? hoveredSlot.prospectTime : getTimezoneParts(prospectTimezone, simulatedDate).formattedTime}
                        </span>
                        <span className="clock-tz-name truncate">{prospectTimezone} ({formatTimezoneAbbr(prospectTimezone)})</span>
                      </div>

                      {/* Clock 2: Account Executive */}
                      <div className="clock-cell border-purple">
                        <span className="clock-label">AE Local</span>
                        <span className="clock-val">
                          {hoveredSlot ? hoveredSlot.aeTime : getTimezoneParts(activeAE.timezone, simulatedDate).formattedTime}
                        </span>
                        <span className="clock-tz-name truncate">{activeAE.timezone} ({formatTimezoneAbbr(activeAE.timezone)})</span>
                      </div>

                      {/* Clock 3: SDR User Local */}
                      <div className="clock-cell border-blue">
                        <span className="clock-label">SDR (You) Local</span>
                        <span className="clock-val">
                          {hoveredSlot ? hoveredSlot.sdrTime : getTimezoneParts(Intl.DateTimeFormat().resolvedOptions().timeZone, simulatedDate).formattedTime}
                        </span>
                        <span className="clock-tz-name truncate">Local ({formatTimezoneAbbr(Intl.DateTimeFormat().resolvedOptions().timeZone)})</span>
                      </div>
                    </div>
                    
                    <div className="clocks-footer-tip">
                      {hoveredSlot ? `Previewing timezone conversions for the ${hoveredSlot.aeTime} slot.` : 'Hover over any slot to preview conversions.'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Booking Confirmation Output Templates */}
            {bookingConfirmation && (
              <div className="dashboard-section-card mt-2 border-success-glow animated-slide-up">
                <div className="confirmation-header flex-items-center">
                  <CheckCircle2 size={24} className="text-success mr-2" />
                  <div>
                    <h3 className="section-card-title text-success m-0">Demo Meeting Scheduled successfully!</h3>
                    <p className="m-0 text-muted fs-small">Invites sent to AE ({activeAE.name}) & Client ({selectedLead.name}).</p>
                  </div>
                </div>

                <div className="confirmation-details-box mt-3">
                  <div className="detail-line">
                    <span className="lbl">AE Assigned:</span>
                    <span className="val font-bold">{activeAE.name}</span>
                  </div>
                  <div className="detail-line">
                    <span className="lbl">Scheduled UTC:</span>
                    <span className="val font-bold">{new Date(bookingConfirmation.dateTime).toLocaleString()}</span>
                  </div>
                  <div className="detail-line">
                    <span className="lbl">Meeting Link:</span>
                    <span className="val font-bold text-accent">
                      <a href={bookingConfirmation.meetingLink} target="_blank" rel="noreferrer" className="flex-items-center gap-1">
                        <Link size={12} />
                        {bookingConfirmation.meetingLink}
                      </a>
                    </span>
                  </div>
                  <div className="detail-line">
                    <span className="lbl">Email Invitation:</span>
                    <span className="val">
                      <button 
                        className="action-btn-call-mini"
                        onClick={() => handleCopyMeetingTemplate(bookingConfirmation)}
                      >
                        <Mail size={12} />
                        <span>Copy Email Template</span>
                      </button>
                    </span>
                  </div>
                </div>

                <div className="confirmation-footer-links mt-3">
                  <span className="link-lbl">Meeting Shortcuts:</span>
                  <a href="#reschedule" onClick={(e) => { e.preventDefault(); alert("Reschedule link copied!"); }} className="shortcut-a">Reschedule Link</a>
                  <a href="#cancel" onClick={(e) => { e.preventDefault(); if (confirm("Cancel this meeting?")) { deleteAEDemo(bookingConfirmation.id); setBookingConfirmation(null); } }} className="shortcut-a text-danger">Cancel Booking</a>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* AE management panel */
        <div className="ae-management-layout dashboard-columns">
          
          {/* Main AE List Column */}
          <div className="dashboard-main-col">
            <div className="dashboard-section-card">
              <div className="section-card-header">
                <h2 className="section-card-title">Active Account Executives</h2>
                <button 
                  className="action-btn-primary flex-items-center gap-1"
                  onClick={handleOpenNewAE}
                >
                  <Plus size={14} />
                  <span>Add AE Profile</span>
                </button>
              </div>

              <div className="ae-profiles-grid">
                {accountExecutives.map(ae => (
                  <div key={ae.id} className="ae-profile-row-card">
                    <div className="ae-avatar-group">
                      <div className="ae-avatar-circle">
                        {ae.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ae-meta-group">
                        <h4 className="ae-name-text">{ae.name}</h4>
                        <span className="ae-dept-text">{ae.department} • {ae.email}</span>
                      </div>
                    </div>

                    <div className="ae-timezone-hours-group">
                      <span className="ae-hours"><Clock size={12} /> {ae.workStart}:00 - {ae.workEnd}:00 local</span>
                      <span className="ae-tz truncate"><Globe size={12} /> {ae.timezone}</span>
                    </div>

                    <div className="ae-calendar-conn-status">
                      {ae.calendarConnected ? (
                        <div className="conn-status-badge conn-green">
                          <Check size={12} />
                          <span>Synced ({ae.calendarProvider})</span>
                        </div>
                      ) : (
                        <div className="conn-status-badge conn-red">
                          <AlertCircle size={12} />
                          <span>Disconnected</span>
                        </div>
                      )}
                    </div>

                    <div className="ae-actions-group">
                      <button 
                        className="phrase-pill-btn m-0"
                        onClick={() => handleOpenEditAE(ae)}
                      >
                        Edit
                      </button>
                      
                      {!ae.calendarConnected ? (
                        <button 
                          className="action-btn-call-mini text-green border-green-light"
                          onClick={() => handleOpenOAuthConnect(ae, ae.calendarProvider || 'google')}
                        >
                          Sync Calendar
                        </button>
                      ) : (
                        <button 
                          className="action-btn-call-mini text-muted"
                          onClick={() => {
                            saveAccountExecutive({ ...ae, calendarConnected: false });
                          }}
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AE editor form / modal */}
          {editingAE && (
            <div className="dashboard-side-col">
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <h3 className="section-card-title">
                    {editingAE.id ? 'Edit Account Executive' : 'New Account Executive'}
                  </h3>
                  <button className="icon-btn-tiny" onClick={() => setEditingAE(null)}>
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveAE} className="modal-form pt-2">
                  <div className="form-item">
                    <label className="input-label" htmlFor="ae-form-name">Name *</label>
                    <input 
                      id="ae-form-name"
                      type="text"
                      className="name-input"
                      required
                      value={aeForm.name}
                      onChange={(e) => setAeForm({ ...aeForm, name: e.target.value })}
                      placeholder="e.g. Sarah Connor"
                    />
                  </div>

                  <div className="form-item">
                    <label className="input-label" htmlFor="ae-form-email">Email *</label>
                    <input 
                      id="ae-form-email"
                      type="email"
                      className="name-input"
                      required
                      value={aeForm.email}
                      onChange={(e) => setAeForm({ ...aeForm, email: e.target.value })}
                      placeholder="e.g. sarah.c@techcorp.io"
                    />
                  </div>

                  <div className="form-item">
                    <label className="input-label" htmlFor="ae-form-dept">Department</label>
                    <input 
                      id="ae-form-dept"
                      type="text"
                      className="name-input"
                      value={aeForm.department}
                      onChange={(e) => setAeForm({ ...aeForm, department: e.target.value })}
                      placeholder="e.g. Enterprise Sales"
                    />
                  </div>

                  <div className="form-item">
                    <label className="input-label" htmlFor="ae-form-tz">Timezone *</label>
                    <select
                      id="ae-form-tz"
                      className="name-input"
                      value={aeForm.timezone}
                      onChange={(e) => setAeForm({ ...aeForm, timezone: e.target.value })}
                    >
                      {Object.keys(TIMEZONE_BY_COUNTRY).map(c => (
                        <option key={c} value={TIMEZONE_BY_COUNTRY[c]}>{c} ({TIMEZONE_BY_COUNTRY[c]})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-row">
                    <div className="form-item">
                      <label className="input-label" htmlFor="ae-form-work-start">Shift Start</label>
                      <select 
                        id="ae-form-work-start"
                        className="name-input"
                        value={aeForm.workStart}
                        onChange={(e) => setAeForm({ ...aeForm, workStart: parseFloat(e.target.value) })}
                      >
                        <option value="8">8:00 AM</option>
                        <option value="9">9:00 AM</option>
                        <option value="10">10:00 AM</option>
                      </select>
                    </div>
                    
                    <div className="form-item">
                      <label className="input-label" htmlFor="ae-form-work-end">Shift End</label>
                      <select 
                        id="ae-form-work-end"
                        className="name-input"
                        value={aeForm.workEnd}
                        onChange={(e) => setAeForm({ ...aeForm, workEnd: parseFloat(e.target.value) })}
                      >
                        <option value="16">4:00 PM</option>
                        <option value="17">5:00 PM</option>
                        <option value="18">6:00 PM</option>
                        <option value="19">7:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-item">
                    <label className="input-label" htmlFor="ae-form-pref">Meeting Link Preference</label>
                    <select
                      id="ae-form-pref"
                      className="name-input"
                      value={aeForm.meetingPreference}
                      onChange={(e) => setAeForm({ ...aeForm, meetingPreference: e.target.value })}
                    >
                      <option value="meet">Google Meet</option>
                      <option value="teams">Microsoft Teams</option>
                      <option value="zoom">Zoom</option>
                    </select>
                  </div>

                  <div className="modal-footer-actions mt-3">
                    <div className="left-actions">
                      {editingAE.id && (
                        <button 
                          type="button" 
                          onClick={() => handleDeleteAE(editingAE.id)}
                          className="delete-button-secondary"
                        >
                          <Trash2 size={12} className="mr-1" /> Delete
                        </button>
                      )}
                    </div>
                    <div className="right-actions">
                      <button type="submit" className="action-btn-primary m-0">
                        {editingAE.id ? 'Save AE' : 'Create AE'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulated OAuth Connect Calendar Consent Modal */}
      {mockOAuthAE && (
        <div className="modal-overlay z-index-huge">
          <div className="modal-container oauth-popup-container">
            <div className="modal-header">
              <h3 className="modal-title">Authorize CRM: Sync AE Calendar</h3>
              <button onClick={() => setMockOAuthAE(null)} className="modal-close-btn" aria-label="Close sync calendar modal">
                <X size={20} />
              </button>
            </div>

            <div className="modal-form pt-2 text-center">
              <div className="oauth-consent-body">
                {oauthConnecting ? (
                  <div className="oauth-connecting-loader flex-items-center flex-direction-column py-4 justify-center">
                    <div className="loader-spinner mb-2" />
                    <h4>Authorizing calendar credentials securely...</h4>
                    <p className="text-muted">Connecting Calendar Provider with Account Executive {mockOAuthAE.name}.</p>
                  </div>
                ) : (
                  <>
                    <div className="oauth-provider-graphic-row my-3 flex-items-center justify-center gap-3">
                      <div className="crm-logo-box">FollowUp</div>
                      <ArrowRight size={24} className="text-muted" />
                      <div className={`provider-logo-box provider-${oauthProvider}`}>
                        <span className="capitalize">{oauthProvider}</span>
                      </div>
                    </div>
                    
                    <h4>Consent & Credentials Request</h4>
                    <p className="text-muted fs-small max-width-380 mx-auto mt-2">
                      SDR is granting FollowUp CRM permission to sync availability, standup conflicts, out-of-office statuses, focus blocks, and automatically write demo invite bookings on behalf of <strong>{mockOAuthAE.name}</strong>.
                    </p>

                    <div className="form-item mt-4 border-top pt-3 flex-items-center justify-end gap-1">
                      <button 
                        type="button" 
                        onClick={() => setMockOAuthAE(null)} 
                        className="theme-button"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={handleAuthorizeOAuth} 
                        className="action-btn-primary"
                      >
                        Authorize & Connect
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
