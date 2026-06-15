// LocalStorage Database Service for Lightweight Sales CRM
import { supabase } from './supabaseClient';

const KEYS = {
  LEADS: 'crm_leads',
  TASKS: 'crm_tasks',
  ACTIONS: 'crm_actions',
  NOTES: 'crm_notes',
  SETTINGS: 'crm_settings',
  OUTREACH_BUCKETS: 'crm_outreach_buckets',
  OUTREACH_COUNTRY_CONFIGS: 'crm_outreach_country_configs',
  OUTREACH_HISTORY: 'crm_outreach_history',
  ACCOUNT_EXECUTIVES: 'crm_account_executives',
  AE_DEMOS: 'crm_ae_demos',
  PLAYBOOK_CATEGORIES: 'crm_playbook_categories',
  PLAYBOOK_TEMPLATES: 'crm_playbook_templates'
};

const DEFAULT_SETTINGS = {
  notificationTiming: 'at_time', // 'at_time', '15m_before', '1h_before', '1d_before'
  browserNotificationsEnabled: false
};

// Generates UUID
const uuid = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

// Helper functions for storage read/write
const read = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const write = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Supabase Sync Helpers ---

// Snake case to camel case converters for top-level keys
const snakeToCamel = (str) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const camelToSnake = (str) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const mapRowToPostgres = (row) => {
  if (!row) return row;
  const result = {};
  for (const key of Object.keys(row)) {
    result[camelToSnake(key)] = row[key];
  }
  return result;
};

const mapRowFromPostgres = (row) => {
  if (!row) return row;
  const result = {};
  for (const key of Object.keys(row)) {
    result[snakeToCamel(key)] = row[key];
  }
  return result;
};

const asyncUpsert = async (tableName, rowData) => {
  if (!supabase) return;
  try {
    const postgresRow = mapRowToPostgres(rowData);
    const { error } = await supabase.from(tableName).upsert([postgresRow]);
    if (error) {
      console.error(`Supabase Upsert Error on ${tableName}:`, error);
    }
  } catch (err) {
    console.error(`Failed to upsert to Supabase table ${tableName}:`, err);
  }
};

const asyncDelete = async (tableName, id) => {
  if (!supabase) return;
  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      console.error(`Supabase Delete Error on ${tableName}:`, error);
    }
  } catch (err) {
    console.error(`Failed to delete from Supabase table ${tableName}:`, err);
  }
};

const pushLocalToSupabase = async () => {
  if (!supabase) return;
  try {
    const tableMappings = [
      { name: 'leads', key: KEYS.LEADS },
      { name: 'tasks', key: KEYS.TASKS },
      { name: 'actions', key: KEYS.ACTIONS },
      { name: 'notes', key: KEYS.NOTES },
      { name: 'outreach_buckets', key: KEYS.OUTREACH_BUCKETS },
      { name: 'outreach_history', key: KEYS.OUTREACH_HISTORY },
      { name: 'account_executives', key: KEYS.ACCOUNT_EXECUTIVES },
      { name: 'ae_demos', key: KEYS.AE_DEMOS },
      { name: 'playbook_categories', key: KEYS.PLAYBOOK_CATEGORIES },
      { name: 'playbook_templates', key: KEYS.PLAYBOOK_TEMPLATES }
    ];

    for (const mapping of tableMappings) {
      const localData = read(mapping.key) || [];
      if (localData.length > 0) {
        const rows = localData.map(mapRowToPostgres);
        const { error } = await supabase.from(mapping.name).upsert(rows);
        if (error) {
          console.error(`Error pushing local ${mapping.name} to Supabase:`, error);
        }
      }
    }

    // Push settings
    const localSettings = read(KEYS.SETTINGS);
    if (localSettings) {
      const settingsRow = { id: 'default', ...mapRowToPostgres(localSettings) };
      const { error } = await supabase.from('settings').upsert([settingsRow]);
      if (error) {
        console.error("Error pushing settings to Supabase:", error);
      }
    }
  } catch (err) {
    console.error("Failed to push local database to Supabase:", err);
  }
};

const pullSupabaseToLocal = async () => {
  if (!supabase) return;
  try {
    const tableMappings = [
      { name: 'leads', key: KEYS.LEADS },
      { name: 'tasks', key: KEYS.TASKS },
      { name: 'actions', key: KEYS.ACTIONS },
      { name: 'notes', key: KEYS.NOTES },
      { name: 'outreach_buckets', key: KEYS.OUTREACH_BUCKETS },
      { name: 'outreach_history', key: KEYS.OUTREACH_HISTORY },
      { name: 'account_executives', key: KEYS.ACCOUNT_EXECUTIVES },
      { name: 'ae_demos', key: KEYS.AE_DEMOS },
      { name: 'playbook_categories', key: KEYS.PLAYBOOK_CATEGORIES },
      { name: 'playbook_templates', key: KEYS.PLAYBOOK_TEMPLATES }
    ];

    for (const mapping of tableMappings) {
      const { data, error } = await supabase.from(mapping.name).select('*');
      if (error) {
        console.error(`Error pulling remote ${mapping.name} from Supabase:`, error);
        continue;
      }
      if (data) {
        const localRows = data.map(mapRowFromPostgres);
        write(mapping.key, localRows);
      }
    }

    // Pull settings
    const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*').limit(1);
    if (!settingsError && settingsData && settingsData.length > 0) {
      const localSettings = mapRowFromPostgres(settingsData[0]);
      delete localSettings.id; // remove PK
      write(KEYS.SETTINGS, localSettings);
    }

    // Dispatch reload event
    window.dispatchEvent(new Event('db-synced'));
  } catch (err) {
    console.error("Failed to pull remote database from Supabase:", err);
  }
};

export const syncDB = async () => {
  if (!supabase) return;
  try {
    // Check count of leads in Supabase
    const { count, error } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    if (error) {
      console.warn("Could not query Supabase leads count (check if SQL migrations were run):", error);
      return;
    }

    if (count === 0) {
      console.log("Supabase is empty. Syncing local storage to Supabase...");
      await pushLocalToSupabase();
    } else {
      console.log("Supabase has data. Pulling remote data to local storage...");
      await pullSupabaseToLocal();
    }
  } catch (err) {
    console.error("Sync error:", err);
  }
};

const clearSupabase = async () => {
  if (!supabase) return;
  try {
    const tables = ['leads', 'tasks', 'actions', 'notes', 'outreach_buckets', 'outreach_history', 'account_executives', 'ae_demos', 'playbook_categories', 'playbook_templates', 'settings'];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', 'placeholder-none-id');
      if (error) {
        console.error(`Error clearing Supabase table ${table}:`, error);
      }
    }
  } catch (err) {
    console.error("Failed to clear Supabase:", err);
  }
};

// High-fidelity Mock Seed Data
const seedData = () => {
  const baseTime = new Date();
  
  // Date helpers relative to today
  const hoursAgo = (h) => new Date(baseTime.getTime() - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d) => new Date(baseTime.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
  const daysAhead = (d, hour = 10) => {
    const date = new Date(baseTime.getTime() + d * 24 * 60 * 60 * 1000);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  };

  const leads = [
    {
      id: 'lead-1',
      name: 'Sarah Jenkins',
      company: 'TechCorp Solutions',
      role: 'VP of Sales',
      email: 'sarah.j@techcorp.io',
      phone: '+1 (555) 019-2834',
      country: 'United States',
      industry: 'Software',
      status: 'Contacted',
      createdAt: daysAgo(10),
      links: [
        { id: 'l1', label: 'LinkedIn', url: 'https://linkedin.com/in/sarah-jenkins-demo' },
        { id: 'l2', label: 'Company Website', url: 'https://techcorp.io' }
      ]
    },
    {
      id: 'lead-2',
      name: 'Michael Chen',
      company: 'Innovate FinTech',
      role: 'CTO',
      email: 'm.chen@innovatefin.com',
      phone: '+1 (555) 043-9821',
      country: 'Canada',
      industry: 'Finance',
      status: 'Interested',
      createdAt: daysAgo(7),
      links: [
        { id: 'l3', label: 'LinkedIn', url: 'https://linkedin.com/in/michael-chen-demo' },
        { id: 'l4', label: 'Salesforce Link', url: 'https://salesforce.com/leads/innovate-chen' }
      ]
    },
    {
      id: 'lead-3',
      name: 'Elena Rostova',
      company: 'Global Retail Corp',
      role: 'HR Director',
      email: 'elena.rostova@gretail.de',
      phone: '+49 89 241932',
      country: 'Germany',
      industry: 'Retail',
      status: 'Busy - Call Later',
      createdAt: daysAgo(5),
      links: [
        { id: 'l5', label: 'LinkedIn', url: 'https://linkedin.com/in/elena-rostova-demo' }
      ]
    },
    {
      id: 'lead-4',
      name: 'David Kalu',
      company: 'AgriGrow Systems',
      role: 'Founder & CEO',
      email: 'david@agrigrow.org',
      phone: '+234 803 123 4567',
      country: 'Nigeria',
      industry: 'Agriculture',
      status: 'Meeting Scheduled',
      createdAt: daysAgo(3),
      links: [
        { id: 'l6', label: 'Company Website', url: 'https://agrigrow.org' },
        { id: 'l7', label: 'Meeting Notes', url: 'https://docs.google.com/document/d/agri-meeting' }
      ]
    },
    {
      id: 'lead-5',
      name: 'Jessica Miller',
      company: 'LogiTrans Worldwide',
      role: 'Operations Manager',
      email: 'j.miller@logitrans.net',
      phone: '+44 20 7946 0958',
      country: 'United Kingdom',
      industry: 'Logistics',
      status: 'New Lead',
      createdAt: daysAgo(1),
      links: []
    }
  ];

  const notes = [
    {
      id: 'note-1',
      leadId: 'lead-1',
      content: 'Sarah is interested in scaling their outbound workflow. They currently use a team of 12 reps. Budget discussions start in July.',
      timestamp: daysAgo(8)
    },
    {
      id: 'note-2',
      leadId: 'lead-2',
      content: 'Decision maker is the CTO. Primary concern is data integration and API capabilities with their current banking ledger.',
      timestamp: daysAgo(6)
    },
    {
      id: 'note-3',
      leadId: 'lead-3',
      content: 'Requested demo after quarter end (end of June). Currently rewriting internal policy guidelines, too busy to jump on a call now.',
      timestamp: daysAgo(4)
    },
    {
      id: 'note-4',
      leadId: 'lead-4',
      content: 'Met via direct LinkedIn outreach. Discussed pricing structures. Showed strong interest in the enterprise dashboard features.',
      timestamp: daysAgo(2)
    }
  ];

  const actions = [
    {
      id: 'act-1',
      leadId: 'lead-1',
      type: 'Sent LinkedIn Message',
      dateTime: daysAgo(9),
      notes: 'Initial outreach message sent outlining the value proposition.',
      nextFollowUpDate: daysAgo(7)
    },
    {
      id: 'act-2',
      leadId: 'lead-1',
      type: 'Called',
      dateTime: daysAgo(7),
      notes: 'Connected directly. Had a brief 5-min talk. She is open to reviewing a pitch deck next week.',
      nextFollowUpDate: daysAhead(2, 14) // Today or tomorrow depending on run time
    },
    {
      id: 'act-3',
      leadId: 'lead-2',
      type: 'Sent Email',
      dateTime: daysAgo(6),
      notes: 'Sent technical whitepaper and integration guide requested by Michael.',
      nextFollowUpDate: daysAgo(3)
    },
    {
      id: 'act-4',
      leadId: 'lead-3',
      type: 'Called',
      dateTime: daysAgo(4),
      notes: 'Picked up but said she was heading into a board meeting. Asked to reschedule or call back in a few days.',
      nextFollowUpDate: daysAhead(0, 16) // Due today at 4:00 PM
    }
  ];

  const tasks = [
    {
      id: 'task-1',
      title: 'Send Pitch Deck to Sarah',
      description: 'Prepare customized proposal slides addressing tech scaling needs and email to Sarah Jenkins.',
      leadId: 'lead-1',
      dueDate: daysAhead(1).split('T')[0], // Tomorrow
      dueTime: '10:00',
      priority: 'High',
      status: 'Pending'
    },
    {
      id: 'task-2',
      title: 'Callback: Elena Rostova',
      description: 'Elena asked to be called back when she is out of meetings. Check if she has 10 minutes to schedule a demo.',
      leadId: 'lead-3',
      dueDate: daysAhead(0).split('T')[0], // Today
      dueTime: '16:00',
      priority: 'Medium',
      status: 'Pending'
    },
    {
      id: 'task-3',
      title: 'Follow-up Email: Michael Chen',
      description: 'Check if Michael had time to review the technical integration API whitepaper sent last week.',
      leadId: 'lead-2',
      dueDate: daysAgo(2).split('T')[0], // Overdue (2 days ago)
      dueTime: '11:00',
      priority: 'High',
      status: 'Pending'
    },
    {
      id: 'task-4',
      title: 'Demo Preparation: David Kalu',
      description: 'Set up test sandbox dashboard environments and mock database pipelines for the scheduled demo call.',
      leadId: 'lead-4',
      dueDate: daysAhead(2).split('T')[0], // 2 days ahead
      dueTime: '14:00',
      priority: 'High',
      status: 'Pending'
    },
    {
      id: 'task-5',
      title: 'Initial Outbound Call: Jessica Miller',
      description: 'Introduce ourselves, outline logistics efficiencies, and find out who owns their shipping software stack.',
      leadId: 'lead-5',
      dueDate: daysAhead(0).split('T')[0], // Today
      dueTime: '10:30',
      priority: 'Low',
      status: 'Pending'
    },
    {
      id: 'task-6',
      title: 'Add Sarah Jenkins on LinkedIn',
      description: 'Completed outreach link on LinkedIn.',
      leadId: 'lead-1',
      dueDate: daysAgo(9).split('T')[0],
      dueTime: '14:00',
      priority: 'Low',
      status: 'Completed'
    }
  ];

  const seedOutreachHistory = () => {
    const history = [];
    const countryProfiles = {
      'Singapore': { pickup: 0.65, booked: 0.20 },
      'South Korea': { pickup: 0.60, booked: 0.15 },
      'Japan': { pickup: 0.55, booked: 0.18 },
      'United States': { pickup: 0.35, booked: 0.08 },
      'Canada': { pickup: 0.40, booked: 0.10 },
      'Germany': { pickup: 0.45, booked: 0.12 },
      'France': { pickup: 0.42, booked: 0.11 },
      'United Kingdom': { pickup: 0.48, booked: 0.14 },
      'India': { pickup: 0.52, booked: 0.13 },
      'Indonesia': { pickup: 0.50, booked: 0.10 },
      'Australia': { pickup: 0.58, booked: 0.15 },
      'Brazil': { pickup: 0.46, booked: 0.09 },
      'South Africa': { pickup: 0.49, booked: 0.11 },
      'United Arab Emirates': { pickup: 0.54, booked: 0.16 },
      'Nigeria': { pickup: 0.48, booked: 0.12 },
      'Mexico': { pickup: 0.43, booked: 0.08 }
    };

    const countries = Object.keys(countryProfiles);
    let idCounter = 1;

    countries.forEach(country => {
      const profile = countryProfiles[country];
      const numCalls = 15 + Math.floor(Math.random() * 15); // 15 to 30 calls
      for (let i = 0; i < numCalls; i++) {
        const rand = Math.random();
        let outcome = 'Busy/No Answer';
        if (rand < profile.booked) {
          outcome = 'Meeting Booked';
        } else if (rand < profile.pickup) {
          outcome = 'Connected';
        }
        
        history.push({
          id: `outreach-call-${idCounter++}`,
          country,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          outcome
        });
      }
    });
    
    return history;
  };

  const defaultBuckets = [
    {
      id: 'bucket-apac',
      name: 'APAC Prospects',
      countries: ['Japan', 'South Korea', 'Singapore', 'Indonesia'],
      archived: false
    },
    {
      id: 'bucket-na',
      name: 'North America',
      countries: ['United States', 'Canada'],
      archived: false
    },
    {
      id: 'bucket-europe',
      name: 'Europe',
      countries: ['Germany', 'France', 'United Kingdom'],
      archived: false
    }
  ];

  const defaultAEs = [
    {
      id: 'ae-1',
      name: 'John Smith',
      email: 'john.smith@techcorp.io',
      department: 'Mid-Market Sales',
      timezone: 'America/New_York',
      workStart: 9,
      workEnd: 17,
      calendarConnected: true,
      calendarProvider: 'google',
      meetingPreference: 'meet'
    },
    {
      id: 'ae-2',
      name: 'Sarah Connor',
      email: 'sarah.c@techcorp.io',
      department: 'Enterprise Sales',
      timezone: 'Europe/London',
      workStart: 9,
      workEnd: 18,
      calendarConnected: true,
      calendarProvider: 'outlook',
      meetingPreference: 'teams'
    },
    {
      id: 'ae-3',
      name: 'David Miller',
      email: 'd.miller@techcorp.io',
      department: 'APAC Sales',
      timezone: 'Asia/Singapore',
      workStart: 8,
      workEnd: 17,
      calendarConnected: false,
      calendarProvider: 'office365',
      meetingPreference: 'zoom'
    }
  ];

  const defaultDemos = [
    {
      id: 'demo-1',
      leadId: 'lead-1', // Sarah Jenkins
      aeId: 'ae-1', // John Smith
      dateTime: daysAhead(1, 14), // Tomorrow at 2:00 PM local
      duration: 30,
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      platform: 'meet',
      status: 'Scheduled'
    },
    {
      id: 'demo-2',
      leadId: 'lead-3', // Elena Rostova
      aeId: 'ae-2', // Sarah Connor
      dateTime: daysAhead(2, 11), // In 2 days at 11:00 AM local
      duration: 30,
      meetingLink: 'https://teams.microsoft.com/l/meetup-join/1234',
      platform: 'teams',
      status: 'Scheduled'
    }
  ];

  const defaultPlaybookCategories = [
    { id: 'cat-outreach', name: 'Cold Outreach', icon: 'Globe', archived: false },
    { id: 'cat-followup', name: 'Follow-Ups', icon: 'Clock', archived: false },
    { id: 'cat-scheduling', name: 'Demo Scheduling', icon: 'CalendarClock', archived: false },
    { id: 'cat-objections', name: 'Objection Handling', icon: 'AlertTriangle', archived: false },
    { id: 'cat-postdemo', name: 'Post Demo', icon: 'CheckCircle2', archived: false }
  ];

  const defaultTemplates = [
    {
      id: 'temp-1',
      name: 'First Cold Email',
      categoryId: 'cat-outreach',
      type: 'email',
      tags: ['ColdEmail', 'SDR', 'Intro'],
      persona: 'Sales Director',
      country: '',
      industry: '',
      isPinned: true,
      lastUsed: daysAgo(1),
      usageCount: 42,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Focus on timezone offsets',
          subject: 'Scaling {{company_name}} sales outbound',
          body: "Hi {{first_name}},\n\nI noticed you are leading sales growth at {{company_name}} in the {{industry}} industry. We help reps in {{country}} optimize outbound pickup rates.\n\nDo you have 10 minutes for a quick chat next week?\n\nBest,\n{{sender_name}}",
          usageCount: 25,
          replyRate: 16
        },
        {
          id: 'v2',
          name: 'V2 - Focus on connection probability',
          subject: 'Outbound connection rate at {{company_name}}',
          body: "Hi {{first_name}},\n\nQuick question: How do your reps currently plan outreach into different timezones? Most teams dial blind, losing 40% of their day.\n\nWe show reps exactly who is reachable right now. Let me know if you are open to a brief chat?\n\nBest,\n{{sender_name}}",
          usageCount: 17,
          replyRate: 24
        }
      ]
    },
    {
      id: 'temp-2',
      name: 'First LinkedIn Message',
      categoryId: 'cat-outreach',
      type: 'linkedin',
      tags: ['LinkedIn', 'ColdOutreach', 'Short'],
      persona: 'All Roles',
      country: '',
      industry: '',
      isPinned: false,
      lastUsed: daysAgo(2),
      usageCount: 18,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Standard connection note',
          subject: '',
          body: "Hi {{first_name}} - noticed you own sales cycles at {{company_name}}. Let's connect!",
          usageCount: 18,
          replyRate: 35
        }
      ]
    },
    {
      id: 'temp-3',
      name: 'Introductory WhatsApp Message',
      categoryId: 'cat-outreach',
      type: 'whatsapp',
      tags: ['WhatsApp', 'Informal', 'Video'],
      persona: 'Founder / CEO',
      country: 'Indonesia',
      industry: 'Software',
      isPinned: false,
      lastUsed: null,
      usageCount: 0,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Conversational video link',
          subject: '',
          body: "Hi {{first_name}}! Reaching out from TechCorp. I saw {{company_name}} is expanding sales outbound in {{country}}. Would love to send a quick 2-min sync video over?",
          usageCount: 0,
          replyRate: 0
        }
      ]
    },
    {
      id: 'temp-4',
      name: 'Follow Up #1',
      categoryId: 'cat-followup',
      type: 'email',
      tags: ['FollowUp', 'Friendly'],
      persona: 'Sales Director',
      country: '',
      industry: '',
      isPinned: true,
      lastUsed: daysAgo(1),
      usageCount: 29,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Thoughts check',
          subject: 'Re: Scaling {{company_name}} sales outbound',
          body: "Hi {{first_name}},\n\nJust following up on my previous email. I know you're busy running Sales at {{company_name}}. Wanted to see if we could connect briefly next Tuesday?\n\nBest,\n{{sender_name}}",
          usageCount: 29,
          replyRate: 12
        }
      ]
    },
    {
      id: 'temp-5',
      name: 'No Response Follow Up',
      categoryId: 'cat-followup',
      type: 'linkedin',
      tags: ['FollowUp', 'LinkedIn', 'NoReply'],
      persona: 'All Roles',
      country: '',
      industry: '',
      isPinned: false,
      lastUsed: daysAgo(5),
      usageCount: 12,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Value share',
          subject: '',
          body: "Hi {{first_name}}, following up on my connection note. Would love to share some insights on outbound pick-up rates in {{country}}.",
          usageCount: 12,
          replyRate: 8
        }
      ]
    },
    {
      id: 'temp-6',
      name: 'Demo Invitation',
      categoryId: 'cat-scheduling',
      type: 'email',
      tags: ['Scheduling', 'DemoInvite'],
      persona: 'C-Level',
      country: '',
      industry: '',
      isPinned: true,
      lastUsed: daysAgo(1),
      usageCount: 25,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Suggested slots proposal',
          subject: 'Invitation: Product Demo for {{company_name}}',
          body: "Hi {{first_name}},\n\nGlad we connected! I'd love to schedule a 30-minute sandbox demo for you and the {{company_name}} team to look at the custom outbound workflow.\n\nLet me know if {{meeting_date}} at {{meeting_time}} works for you?\n\nBest,\n{{sender_name}}",
          usageCount: 25,
          replyRate: 48
        }
      ]
    },
    {
      id: 'temp-7',
      name: 'Demo Confirmation Message',
      categoryId: 'cat-scheduling',
      type: 'whatsapp',
      tags: ['Scheduling', 'WhatsApp', 'Confirmation'],
      persona: 'All Roles',
      country: '',
      industry: '',
      isPinned: false,
      lastUsed: daysAgo(1),
      usageCount: 15,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Short confirmation details',
          subject: '',
          body: "Hi {{first_name}}! Just booked your product demo with our Account Executive for {{meeting_date}} at {{meeting_time}}. Look forward to speaking then!",
          usageCount: 15,
          replyRate: 90
        }
      ]
    },
    {
      id: 'temp-8',
      name: 'Not Interested (Objection)',
      categoryId: 'cat-objections',
      type: 'call_script',
      tags: ['Objection', 'NotInterested', 'SDRScript'],
      persona: 'All Roles',
      country: '',
      industry: '',
      isPinned: true,
      lastUsed: daysAgo(2),
      usageCount: 22,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Pivot to ROI case',
          subject: '',
          body: "Objection: 'I understand, {{first_name}}. Many sales leaders we talk to at {{company_name}} felt the same way initially. However, we're not looking to sell you anything today—just wanted to share how we helped competitors in {{industry}} improve contact rate by 30%. Can I send a 1-page summary to {{email}}?'",
          usageCount: 22,
          replyRate: 15
        }
      ]
    },
    {
      id: 'temp-9',
      name: 'Too Busy (Objection)',
      categoryId: 'cat-objections',
      type: 'call_script',
      tags: ['Objection', 'TooBusy', 'SDRScript'],
      persona: 'All Roles',
      country: '',
      industry: '',
      isPinned: false,
      lastUsed: daysAgo(3),
      usageCount: 19,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - 30-second pitch shortcut',
          subject: '',
          body: "Objection: 'Totally get it, {{first_name}}. Time is valuable. I'll make this a 30-second summary: we automate timezone routing so your reps don't dial dead numbers. I will drop a calendar link in your email so you can check it out when you have a free moment. Sounds fair?'",
          usageCount: 19,
          replyRate: 20
        }
      ]
    },
    {
      id: 'temp-10',
      name: 'No Budget (Objection)',
      categoryId: 'cat-objections',
      type: 'email',
      tags: ['Objection', 'NoBudget', 'ValueEmail'],
      persona: 'C-Level',
      country: '',
      industry: '',
      isPinned: false,
      lastUsed: null,
      usageCount: 0,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Consolidate savings pitch',
          subject: 'Quick resource: ROI calculator for {{company_name}}',
          body: "Hi {{first_name}},\n\nUnderstood on budget constraints. We often help teams at {{company_name}} cut down software overhead by consolidating outreach planners. Here is a 1-page ROI breakdown.\n\nWhenever budget opens up later, we'd love to re-connect.\n\nBest,\n{{sender_name}}",
          usageCount: 0,
          replyRate: 0
        }
      ]
    },
    {
      id: 'temp-11',
      name: 'Thank You Email (Post Demo)',
      categoryId: 'cat-postdemo',
      type: 'email',
      tags: ['PostDemo', 'FollowUp', 'ThankYou'],
      persona: 'All Roles',
      country: 'Japan',
      industry: '',
      isPinned: false,
      lastUsed: daysAgo(4),
      usageCount: 8,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Demo recap and materials attachment',
          subject: 'Thank you for your time / Demo follow-up - {{company_name}}',
          body: "Hi {{first_name}},\n\nThank you for checking out our Demo today! It was great learning about {{company_name}}'s scaling priorities in {{country}}.\n\nI've attached our proposal outline. Let me know if you have any questions.\n\nBest,\n{{sender_name}}",
          usageCount: 8,
          replyRate: 50
        }
      ]
    },
    {
      id: 'temp-12',
      name: 'Call Summary Structure',
      categoryId: 'cat-postdemo',
      type: 'notes',
      tags: ['Notes', 'Internal', 'CallSummary'],
      persona: 'All Roles',
      country: '',
      industry: '',
      isPinned: false,
      lastUsed: daysAgo(1),
      usageCount: 30,
      activeVersionIdx: 0,
      versions: [
        {
          id: 'v1',
          name: 'V1 - Standard internal briefing format',
          subject: '',
          body: "Meeting Notes: {{company_name}}\nDate: {{meeting_date}}\nAttendees: {{first_name}} {{last_name}}\nRole: {{designation}}\n\nPain Points:\n- \n- \n\nNext Steps:\n- AE to share proposal by Friday",
          usageCount: 30,
          replyRate: 0
        }
      ]
    }
  ];

  write(KEYS.LEADS, leads);
  write(KEYS.NOTES, notes);
  write(KEYS.ACTIONS, actions);
  write(KEYS.TASKS, tasks);
  write(KEYS.SETTINGS, DEFAULT_SETTINGS);
  write(KEYS.OUTREACH_BUCKETS, defaultBuckets);
  write(KEYS.OUTREACH_COUNTRY_CONFIGS, {});
  write(KEYS.OUTREACH_HISTORY, seedOutreachHistory());
  write(KEYS.ACCOUNT_EXECUTIVES, defaultAEs);
  write(KEYS.AE_DEMOS, defaultDemos);
  write(KEYS.PLAYBOOK_CATEGORIES, defaultPlaybookCategories);
  write(KEYS.PLAYBOOK_TEMPLATES, defaultTemplates);
};

// Initialize DB if empty
export const initDB = (force = false) => {
  if (force || !localStorage.getItem(KEYS.LEADS)) {
    seedData();
    if (supabase) {
      pushLocalToSupabase();
    }
  } else {
    if (supabase) {
      syncDB();
    }
  }
};

// --- DATABASE API ---

export const db = {
  // Leads
  getLeads: () => {
    initDB();
    return read(KEYS.LEADS) || [];
  },
  saveLead: (lead) => {
    const leads = db.getLeads();
    if (lead.id) {
      // Edit
      const index = leads.findIndex(l => l.id === lead.id);
      if (index !== -1) {
        leads[index] = { ...leads[index], ...lead };
      }
    } else {
      // Create
      lead.id = 'lead-' + uuid();
      lead.createdAt = new Date().toISOString();
      if (!lead.links) lead.links = [];
      leads.push(lead);
    }
    write(KEYS.LEADS, leads);
    asyncUpsert('leads', lead);
    return lead;
  },
  deleteLead: (id) => {
    const leads = db.getLeads().filter(l => l.id !== id);
    write(KEYS.LEADS, leads);
    asyncDelete('leads', id);
    
    // Cascading delete tasks, actions, notes for this lead
    const tasks = db.getTasks().filter(t => t.leadId !== id);
    write(KEYS.TASKS, tasks);

    const actions = db.getActions().filter(a => a.leadId !== id);
    write(KEYS.ACTIONS, actions);

    const notes = db.getNotes().filter(n => n.leadId !== id);
    write(KEYS.NOTES, notes);
  },

  // Tasks
  getTasks: () => {
    initDB();
    return read(KEYS.TASKS) || [];
  },
  saveTask: (task) => {
    const tasks = db.getTasks();
    if (task.id) {
      const index = tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...task };
      }
    } else {
      task.id = 'task-' + uuid();
      if (!task.status) task.status = 'Pending';
      tasks.push(task);
    }
    write(KEYS.TASKS, tasks);
    asyncUpsert('tasks', task);
    return task;
  },
  deleteTask: (id) => {
    const tasks = db.getTasks().filter(t => t.id !== id);
    write(KEYS.TASKS, tasks);
    asyncDelete('tasks', id);
  },

  // Actions
  getActions: () => {
    initDB();
    return read(KEYS.ACTIONS) || [];
  },
  saveAction: (action) => {
    const actions = db.getActions();
    action.id = 'act-' + uuid();
    if (!action.dateTime) action.dateTime = new Date().toISOString();
    actions.push(action);
    write(KEYS.ACTIONS, actions);
    asyncUpsert('actions', action);

    // Update lead contacted status automatically if logged action implies contacted
    if (action.leadId) {
      const leads = db.getLeads();
      const leadIndex = leads.findIndex(l => l.id === action.leadId);
      if (leadIndex !== -1) {
        const lead = leads[leadIndex];
        // If status was "New Lead", automatically update to "Contacted"
        if (lead.status === 'New Lead') {
          lead.status = 'Contacted';
          write(KEYS.LEADS, leads);
          asyncUpsert('leads', lead);
        }
      }
    }

    return action;
  },

  // Notes
  getNotes: () => {
    initDB();
    return read(KEYS.NOTES) || [];
  },
  saveNote: (note) => {
    const notes = db.getNotes();
    if (!note.id) {
      note.id = 'note-' + uuid();
    }
    note.timestamp = new Date().toISOString();
    notes.push(note);
    write(KEYS.NOTES, notes);
    asyncUpsert('notes', note);
    return note;
  },
  deleteNote: (id) => {
    const notes = db.getNotes().filter(n => n.id !== id);
    write(KEYS.NOTES, notes);
    asyncDelete('notes', id);
  },

  // Settings
  getSettings: () => {
    initDB();
    return read(KEYS.SETTINGS) || DEFAULT_SETTINGS;
  },
  saveSettings: (settings) => {
    write(KEYS.SETTINGS, settings);
    asyncUpsert('settings', { id: 'default', ...settings });
    return settings;
  },

  // --- OUTREACH APIs ---
  getOutreachBuckets: () => {
    initDB();
    return read(KEYS.OUTREACH_BUCKETS) || [];
  },
  saveOutreachBucket: (bucket) => {
    const buckets = db.getOutreachBuckets();
    if (bucket.id) {
      const index = buckets.findIndex(b => b.id === bucket.id);
      if (index !== -1) {
        buckets[index] = { ...buckets[index], ...bucket };
      }
    } else {
      bucket.id = 'bucket-' + uuid();
      bucket.archived = false;
      buckets.push(bucket);
    }
    write(KEYS.OUTREACH_BUCKETS, buckets);
    asyncUpsert('outreach_buckets', bucket);
    return bucket;
  },
  deleteOutreachBucket: (id) => {
    const buckets = db.getOutreachBuckets().filter(b => b.id !== id);
    write(KEYS.OUTREACH_BUCKETS, buckets);
    asyncDelete('outreach_buckets', id);
  },

  getCountryConfigs: () => {
    initDB();
    return read(KEYS.OUTREACH_COUNTRY_CONFIGS) || {};
  },
  saveCountryConfig: (countryName, config) => {
    const configs = db.getCountryConfigs();
    configs[countryName] = { ...configs[countryName], ...config };
    write(KEYS.OUTREACH_COUNTRY_CONFIGS, configs);
    return configs[countryName];
  },

  getOutreachHistory: () => {
    initDB();
    return read(KEYS.OUTREACH_HISTORY) || [];
  },
  logOutreachCall: (callRecord) => {
    const history = db.getOutreachHistory();
    const newRecord = {
      id: 'outreach-call-' + uuid(),
      timestamp: new Date().toISOString(),
      ...callRecord
    };
    history.push(newRecord);
    write(KEYS.OUTREACH_HISTORY, history);
    asyncUpsert('outreach_history', newRecord);
    return newRecord;
  },

  // --- AE AND DEMOS APIs ---
  getAccountExecutives: () => {
    initDB();
    return read(KEYS.ACCOUNT_EXECUTIVES) || [];
  },
  saveAccountExecutive: (ae) => {
    const aes = db.getAccountExecutives();
    if (ae.id) {
      const index = aes.findIndex(a => a.id === ae.id);
      if (index !== -1) {
        aes[index] = { ...aes[index], ...ae };
      }
    } else {
      ae.id = 'ae-' + uuid();
      aes.push(ae);
    }
    write(KEYS.ACCOUNT_EXECUTIVES, aes);
    asyncUpsert('account_executives', ae);
    return ae;
  },
  deleteAccountExecutive: (id) => {
    const aes = db.getAccountExecutives().filter(a => a.id !== id);
    write(KEYS.ACCOUNT_EXECUTIVES, aes);
    asyncDelete('account_executives', id);
    
    // cascade delete demos booked with this AE
    const demos = db.getAEDemos().filter(d => d.aeId !== id);
    write(KEYS.AE_DEMOS, demos);
  },

  getAEDemos: () => {
    initDB();
    return read(KEYS.AE_DEMOS) || [];
  },
  saveAEDemo: (demo) => {
    const demos = db.getAEDemos();
    if (demo.id) {
      const index = demos.findIndex(d => d.id === demo.id);
      if (index !== -1) {
        demos[index] = { ...demos[index], ...demo };
      }
    } else {
      demo.id = 'demo-' + uuid();
      demos.push(demo);
    }
    write(KEYS.AE_DEMOS, demos);
    asyncUpsert('ae_demos', demo);
    return demo;
  },
  deleteAEDemo: (id) => {
    const demos = db.getAEDemos().filter(d => d.id !== id);
    write(KEYS.AE_DEMOS, demos);
    asyncDelete('ae_demos', id);
  },

  // --- PLAYBOOK APIs ---
  getPlaybookCategories: () => {
    initDB();
    return read(KEYS.PLAYBOOK_CATEGORIES) || [];
  },
  savePlaybookCategory: (cat) => {
    const categories = db.getPlaybookCategories();
    if (cat.id) {
      const index = categories.findIndex(c => c.id === cat.id);
      if (index !== -1) {
        categories[index] = { ...categories[index], ...cat };
      }
    } else {
      cat.id = 'cat-' + uuid();
      cat.archived = false;
      categories.push(cat);
    }
    write(KEYS.PLAYBOOK_CATEGORIES, categories);
    asyncUpsert('playbook_categories', cat);
    return cat;
  },
  deletePlaybookCategory: (id) => {
    const categories = db.getPlaybookCategories().filter(c => c.id !== id);
    write(KEYS.PLAYBOOK_CATEGORIES, categories);
    asyncDelete('playbook_categories', id);
  },

  getPlaybookTemplates: () => {
    initDB();
    return read(KEYS.PLAYBOOK_TEMPLATES) || [];
  },
  savePlaybookTemplate: (temp) => {
    const templates = db.getPlaybookTemplates();
    if (temp.id) {
      const index = templates.findIndex(t => t.id === temp.id);
      if (index !== -1) {
        templates[index] = { ...templates[index], ...temp };
      }
    } else {
      temp.id = 'temp-' + uuid();
      temp.usageCount = 0;
      temp.isPinned = false;
      temp.lastUsed = null;
      if (!temp.versions) {
        temp.versions = [{ id: 'v1', name: 'V1 - Draft', subject: temp.subject || '', body: temp.body || '', usageCount: 0, replyRate: 0 }];
      }
      temp.activeVersionIdx = 0;
      templates.push(temp);
    }
    write(KEYS.PLAYBOOK_TEMPLATES, templates);
    asyncUpsert('playbook_templates', temp);
    return temp;
  },
  deletePlaybookTemplate: (id) => {
    const templates = db.getPlaybookTemplates().filter(t => t.id !== id);
    write(KEYS.PLAYBOOK_TEMPLATES, templates);
    asyncDelete('playbook_templates', id);
  },

  // Reset / Clear Data
  resetDB: () => {
    seedData();
    if (supabase) {
      pushLocalToSupabase();
    }
  },
  clearDB: () => {
    write(KEYS.LEADS, []);
    write(KEYS.TASKS, []);
    write(KEYS.ACTIONS, []);
    write(KEYS.NOTES, []);
    write(KEYS.SETTINGS, DEFAULT_SETTINGS);
    write(KEYS.OUTREACH_BUCKETS, []);
    write(KEYS.OUTREACH_COUNTRY_CONFIGS, {});
    write(KEYS.OUTREACH_HISTORY, []);
    write(KEYS.ACCOUNT_EXECUTIVES, []);
    write(KEYS.AE_DEMOS, []);
    write(KEYS.PLAYBOOK_CATEGORIES, []);
    write(KEYS.PLAYBOOK_TEMPLATES, []);
    if (supabase) {
      clearSupabase();
    }
  },
  importData: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.leads) write(KEYS.LEADS, data.leads);
      if (data.tasks) write(KEYS.TASKS, data.tasks);
      if (data.actions) write(KEYS.ACTIONS, data.actions);
      if (data.notes) write(KEYS.NOTES, data.notes);
      if (data.settings) write(KEYS.SETTINGS, data.settings);
      if (data.outreachBuckets) write(KEYS.OUTREACH_BUCKETS, data.outreachBuckets);
      if (data.countryConfigs) write(KEYS.OUTREACH_COUNTRY_CONFIGS, data.countryConfigs);
      if (data.outreachHistory) write(KEYS.OUTREACH_HISTORY, data.outreachHistory);
      if (data.accountExecutives) write(KEYS.ACCOUNT_EXECUTIVES, data.accountExecutives);
      if (data.aeDemos) write(KEYS.AE_DEMOS, data.aeDemos);
      if (data.playbookCategories) write(KEYS.PLAYBOOK_CATEGORIES, data.playbookCategories);
      if (data.playbookTemplates) write(KEYS.PLAYBOOK_TEMPLATES, data.playbookTemplates);
      if (supabase) {
        pushLocalToSupabase();
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  exportData: () => {
    return JSON.stringify({
      leads: read(KEYS.LEADS) || [],
      tasks: read(KEYS.TASKS) || [],
      actions: read(KEYS.ACTIONS) || [],
      notes: read(KEYS.NOTES) || [],
      settings: read(KEYS.SETTINGS) || DEFAULT_SETTINGS,
      outreachBuckets: read(KEYS.OUTREACH_BUCKETS) || [],
      countryConfigs: read(KEYS.OUTREACH_COUNTRY_CONFIGS) || {},
      outreachHistory: read(KEYS.OUTREACH_HISTORY) || [],
      accountExecutives: read(KEYS.ACCOUNT_EXECUTIVES) || [],
      aeDemos: read(KEYS.AE_DEMOS) || [],
      playbookCategories: read(KEYS.PLAYBOOK_CATEGORIES) || [],
      playbookTemplates: read(KEYS.PLAYBOOK_TEMPLATES) || []
    }, null, 2);
  }
};
