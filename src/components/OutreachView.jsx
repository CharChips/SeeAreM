import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Globe, 
  Clock, 
  Plus, 
  Trash2, 
  Copy, 
  Archive, 
  Edit2, 
  Save, 
  Phone, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders,
  FolderOpen,
  Info,
  Calendar,
  X,
  Sparkles,
  Settings,
  Search
} from 'lucide-react';

const SUPPORTED_COUNTRIES = [
  { id: 'US', name: 'United States', timezone: 'America/New_York', emoji: '🇺🇸', defaultWorkStart: 9, defaultWorkEnd: 18, defaultLunchStart: 12, defaultLunchEnd: 13.5 },
  { id: 'CA', name: 'Canada', timezone: 'America/Toronto', emoji: '🇨🇦', defaultWorkStart: 9, defaultWorkEnd: 18, defaultLunchStart: 12, defaultLunchEnd: 13.5 },
  { id: 'GB', name: 'United Kingdom', timezone: 'Europe/London', emoji: '🇬🇧', defaultWorkStart: 9, defaultWorkEnd: 17.5, defaultLunchStart: 12, defaultLunchEnd: 13.5 },
  { id: 'DE', name: 'Germany', timezone: 'Europe/Berlin', emoji: '🇩🇪', defaultWorkStart: 8.5, defaultWorkEnd: 17.5, defaultLunchStart: 12.5, defaultLunchEnd: 13.5 },
  { id: 'FR', name: 'France', timezone: 'Europe/Paris', emoji: '🇫🇷', defaultWorkStart: 9, defaultWorkEnd: 18, defaultLunchStart: 12, defaultLunchEnd: 14 },
  { id: 'SG', name: 'Singapore', timezone: 'Asia/Singapore', emoji: '🇸🇬', defaultWorkStart: 9, defaultWorkEnd: 18, defaultLunchStart: 12, defaultLunchEnd: 13.5 },
  { id: 'JP', name: 'Japan', timezone: 'Asia/Tokyo', emoji: '🇯🇵', defaultWorkStart: 9, defaultWorkEnd: 18, defaultLunchStart: 12, defaultLunchEnd: 13 },
  { id: 'KR', name: 'South Korea', timezone: 'Asia/Seoul', emoji: '🇰🇷', defaultWorkStart: 9, defaultWorkEnd: 18, defaultLunchStart: 12, defaultLunchEnd: 13 },
  { id: 'IN', name: 'India', timezone: 'Asia/Kolkata', emoji: '🇮🇳', defaultWorkStart: 9.5, defaultWorkEnd: 18.5, defaultLunchStart: 13, defaultLunchEnd: 14 },
  { id: 'ID', name: 'Indonesia', timezone: 'Asia/Jakarta', emoji: '🇮🇩', defaultWorkStart: 8.5, defaultWorkEnd: 17.5, defaultLunchStart: 12, defaultLunchEnd: 13 },
  { id: 'AU', name: 'Australia', timezone: 'Australia/Sydney', emoji: '🇦🇺', defaultWorkStart: 9, defaultWorkEnd: 17, defaultLunchStart: 12.5, defaultLunchEnd: 13.5 },
  { id: 'BR', name: 'Brazil', timezone: 'America/Sao_Paulo', emoji: '🇧🇷', defaultWorkStart: 9, defaultWorkEnd: 18, defaultLunchStart: 12, defaultLunchEnd: 13.5 },
  { id: 'ZA', name: 'South Africa', timezone: 'Africa/Johannesburg', emoji: '🇿🇦', defaultWorkStart: 8.5, defaultWorkEnd: 17, defaultLunchStart: 13, defaultLunchEnd: 14 },
  { id: 'AE', name: 'United Arab Emirates', timezone: 'Asia/Dubai', emoji: '🇦🇪', defaultWorkStart: 8, defaultWorkEnd: 17, defaultLunchStart: 13, defaultLunchEnd: 14 },
  { id: 'NG', name: 'Nigeria', timezone: 'Africa/Lagos', emoji: '🇳🇬', defaultWorkStart: 8.5, defaultWorkEnd: 17.5, defaultLunchStart: 12, defaultLunchEnd: 13 },
  { id: 'MX', name: 'Mexico', timezone: 'America/Mexico_City', emoji: '🇲🇽', defaultWorkStart: 9, defaultWorkEnd: 18, defaultLunchStart: 13, defaultLunchEnd: 14.5 }
];

const PUBLIC_HOLIDAYS_2026 = {
  'United States': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
    { date: '2026-02-16', name: "Washington's Birthday" },
    { date: '2026-05-25', name: 'Memorial Day' },
    { date: '2026-06-19', name: 'Juneteenth Day' },
    { date: '2026-07-04', name: 'Independence Day' },
    { date: '2026-09-07', name: 'Labor Day' },
    { date: '2026-10-12', name: 'Columbus Day' },
    { date: '2026-11-11', name: 'Veterans Day' },
    { date: '2026-11-26', name: 'Thanksgiving Day' },
    { date: '2026-12-25', name: 'Christmas Day' }
  ],
  'Canada': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-04-06', name: 'Easter Monday' },
    { date: '2026-05-18', name: 'Victoria Day' },
    { date: '2026-07-01', name: 'Canada Day' },
    { date: '2026-09-07', name: 'Labour Day' },
    { date: '2026-10-12', name: 'Thanksgiving' },
    { date: '2026-11-11', name: 'Remembrance Day' },
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-12-26', name: 'Boxing Day' }
  ],
  'United Kingdom': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-04-06', name: 'Easter Monday' },
    { date: '2026-05-04', name: 'Early May Bank Holiday' },
    { date: '2026-05-25', name: 'Spring Bank Holiday' },
    { date: '2026-08-31', name: 'Summer Bank Holiday' },
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-12-26', name: 'Boxing Day' }
  ],
  'Germany': [
    { date: '2026-01-01', name: 'Neujahr' },
    { date: '2026-04-03', name: 'Karfreitag' },
    { date: '2026-04-06', name: 'Ostermontag' },
    { date: '2026-05-01', name: 'Tag der Arbeit' },
    { date: '2026-05-14', name: 'Christi Himmelfahrt' },
    { date: '2026-05-25', name: 'Pfingstmontag' },
    { date: '2026-10-03', name: 'Tag der Deutschen Einheit' },
    { date: '2026-12-25', name: 'Weihnachten' },
    { date: '2026-12-26', name: 'Stephanstag' }
  ],
  'France': [
    { date: '2026-01-01', name: "Jour de l'An" },
    { date: '2026-04-06', name: 'Lundi de Pâques' },
    { date: '2026-05-01', name: 'Fête du Travail' },
    { date: '2026-05-08', name: 'Victoire 1945' },
    { date: '2026-05-14', name: 'Ascension' },
    { date: '2026-05-25', name: 'Lundi de Pentecôte' },
    { date: '2026-07-14', name: 'Fête Nationale' },
    { date: '2026-08-15', name: 'Assomption' },
    { date: '2026-11-01', name: 'Toussaint' },
    { date: '2026-11-11', name: 'Armistice 1918' },
    { date: '2026-12-25', name: 'Noël' }
  ],
  'Singapore': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-02-17', name: 'Chinese New Year' },
    { date: '2026-02-18', name: 'Chinese New Year (Day 2)' },
    { date: '2026-03-20', name: 'Hari Raya Puasa' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-05-01', name: 'Labour Day' },
    { date: '2026-05-27', name: 'Hari Raya Haji' },
    { date: '2026-05-31', name: 'Vesak Day' },
    { date: '2026-08-09', name: 'National Day' },
    { date: '2026-11-08', name: 'Deepavali' },
    { date: '2026-12-25', name: 'Christmas Day' }
  ],
  'Japan': [
    { date: '2026-01-01', name: 'Ganjitsu' },
    { date: '2026-01-12', name: 'Seijin no Hi' },
    { date: '2026-02-11', name: 'Kenkoku Kinen no Hi' },
    { date: '2026-02-23', name: 'Tenno Tanjobi' },
    { date: '2026-03-20', name: 'Shunbun no Hi' },
    { date: '2026-04-29', name: 'Showa no Hi (Golden Week)' },
    { date: '2026-05-03', name: 'Kenpo Kinenbi (Golden Week)' },
    { date: '2026-05-04', name: 'Midori no Hi (Golden Week)' },
    { date: '2026-05-05', name: 'Kodomo no Hi (Golden Week)' },
    { date: '2026-08-11', name: 'Yama no Hi' },
    { date: '2026-09-21', name: 'Keiro no Hi' },
    { date: '2026-09-23', name: 'Shubun no Hi' },
    { date: '2026-10-12', name: 'Sports no Hi' },
    { date: '2026-11-03', name: 'Bunka no Hi' },
    { date: '2026-11-23', name: 'Kinro Kansha no Hi' }
  ],
  'South Korea': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-02-16', name: 'Seollal' },
    { date: '2026-02-17', name: 'Seollal Holiday' },
    { date: '2026-02-18', name: 'Seollal Holiday' },
    { date: '2026-03-01', name: 'Samiljeol' },
    { date: '2026-05-05', name: 'Children\'s Day' },
    { date: '2026-05-24', name: 'Buddha\'s Birthday' },
    { date: '2026-06-06', name: 'Memorial Day' },
    { date: '2026-07-17', name: 'Constitution Day' },
    { date: '2026-08-15', name: 'Liberation Day' },
    { date: '2026-09-24', name: 'Chuseok' },
    { date: '2026-09-25', name: 'Chuseok Holiday' },
    { date: '2026-09-26', name: 'Chuseok Holiday' },
    { date: '2026-10-03', name: 'National Foundation Day' },
    { date: '2026-10-09', name: 'Hangeul Day' },
    { date: '2026-12-25', name: 'Christmas' }
  ],
  'India': [
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-02-15', name: 'Maha Shivratri' },
    { date: '2026-03-04', name: 'Holi' },
    { date: '2026-03-20', name: 'Eid al-Fitr' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-10-02', name: 'Gandhi Jayanti' },
    { date: '2026-10-19', name: 'Dussehra' },
    { date: '2026-11-08', name: 'Diwali' },
    { date: '2026-12-25', name: 'Christmas Day' }
  ],
  'Indonesia': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-02-15', name: 'Isra Mi\'raj' },
    { date: '2026-02-17', name: 'Chinese New Year' },
    { date: '2026-03-19', name: 'Hari Nyepi' },
    { date: '2026-03-20', name: 'Eid al-Fitr' },
    { date: '2026-03-21', name: 'Eid al-Fitr Holiday' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-05-01', name: 'Labour Day' },
    { date: '2026-05-14', name: 'Ascension Day of Jesus' },
    { date: '2026-05-27', name: 'Eid al-Adha' },
    { date: '2026-05-31', name: 'Waisak Day' },
    { date: '2026-06-01', name: 'Pancasila Day' },
    { date: '2026-06-16', name: 'Islamic New Year' },
    { date: '2026-08-17', name: 'Independence Day' },
    { date: '2026-09-15', name: 'Prophet\'s Birthday' },
    { date: '2026-12-25', name: 'Christmas Day' }
  ],
  'Australia': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-26', name: 'Australia Day' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-04-06', name: 'Easter Monday' },
    { date: '2026-04-25', name: 'Anzac Day' },
    { date: '2026-06-08', name: 'King\'s Birthday' },
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-12-26', name: 'Boxing Day' }
  ],
  'Brazil': [
    { date: '2026-01-01', name: 'Confraternização Universal' },
    { date: '2026-02-16', name: 'Carnaval' },
    { date: '2026-02-17', name: 'Carnaval' },
    { date: '2026-04-21', name: 'Tiradentes' },
    { date: '2026-05-01', name: 'Dia do Trabalhador' },
    { date: '2026-06-04', name: 'Corpus Christi' },
    { date: '2026-09-07', name: 'Dia da Independência' },
    { date: '2026-10-12', name: 'Nossa Senhora Aparecida' },
    { date: '2026-11-02', name: 'Finados' },
    { date: '2026-11-15', name: 'Proclamação da República' },
    { date: '2026-11-20', name: 'Consciência Negra' },
    { date: '2026-12-25', name: 'Natal' }
  ],
  'South Africa': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-03-21', name: 'Human Rights Day' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-04-06', name: 'Family Day' },
    { date: '2026-04-27', name: 'Freedom Day' },
    { date: '2026-05-01', name: 'Workers\' Day' },
    { date: '2026-06-16', name: 'Youth Day' },
    { date: '2026-08-09', name: 'National Women\'s Day' },
    { date: '2026-09-24', name: 'Heritage Day' },
    { date: '2026-12-16', name: 'Day of Reconciliation' },
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-12-26', name: 'Day of Goodwill' }
  ],
  'United Arab Emirates': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-03-20', name: 'Eid al-Fitr' },
    { date: '2026-05-26', name: 'Arafat Day' },
    { date: '2026-05-27', name: 'Eid al-Adha' },
    { date: '2026-05-28', name: 'Eid al-Adha Holiday' },
    { date: '2026-05-29', name: 'Eid al-Adha Holiday' },
    { date: '2026-06-16', name: 'Islamic New Year' },
    { date: '2026-12-02', name: 'National Day' }
  ],
  'Nigeria': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-03-20', name: 'Eid al-Fitr' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-04-06', name: 'Easter Monday' },
    { date: '2026-05-01', name: 'Workers\' Day' },
    { date: '2026-05-27', name: 'Eid al-Adha' },
    { date: '2026-06-12', name: 'Democracy Day' },
    { date: '2026-09-15', name: 'Eid al-Maulud' },
    { date: '2026-10-01', name: 'National Day' },
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-12-26', name: 'Boxing Day' }
  ],
  'Mexico': [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-02-02', name: 'Constitution Day' },
    { date: '2026-03-16', name: 'Benito Juárez\'s Birthday' },
    { date: '2026-05-01', name: 'Labor Day' },
    { date: '2026-09-16', name: 'Independence Day' },
    { date: '2026-11-16', name: 'Revolution Day' },
    { date: '2026-12-25', name: 'Christmas Day' }
  ]
};

// Convert Date to target timezone offset parts
const getTimezoneInfo = (timezone, date = new Date()) => {
  try {
    const options = {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'long',
      hour12: false
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });

    const year = parseInt(map.year);
    const month = parseInt(map.month); 
    const day = parseInt(map.day);
    const hour = parseInt(map.hour);
    const minute = parseInt(map.minute);
    const weekday = map.weekday; 
    
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    return {
      year,
      month,
      day,
      hour,
      minute,
      weekday,
      formattedTime,
      dateString
    };
  } catch (e) {
    console.error("Error formatting timezone:", timezone, e);
    // Fallback to local
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

const formatHours = (h) => {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (hours === 0) return `${minutes} Min`;
  if (minutes === 0) return `${hours} Hr${hours > 1 ? 's' : ''}`;
  return `${hours} Hr${hours > 1 ? 's' : ''} ${minutes} Min`;
};

export const OutreachView = () => {
  const {
    leads,
    outreachBuckets,
    countryConfigs,
    outreachHistory,
    saveOutreachBucket,
    deleteOutreachBucket,
    duplicateOutreachBucket,
    archiveOutreachBucket,
    saveCountryConfig,
    logOutreachCall,
    navigateTo
  } = useCRM();

  // Current Base simulated date
  const [baseDate, setBaseDate] = useState(new Date('2026-06-15T12:10:00+05:30')); // Lock to user baseline or sync
  const [timeOffsetHours, setTimeOffsetHours] = useState(0);
  const [syncWithSystem, setSyncWithSystem] = useState(false);
  const [sortBy, setSortBy] = useState('score'); // 'score' or 'performance'
  const [activeBucketIds, setActiveBucketIds] = useState([]);
  
  // Expanded country list in Inspector
  const [expandedCountry, setExpandedCountry] = useState(null);

  // Modals / Editors
  const [editingBucket, setEditingBucket] = useState(null); // { id, name, countries, archived } or null
  const [newBucketOpen, setNewBucketOpen] = useState(false);
  const [customizeCountry, setCustomizeCountry] = useState(null); // countryObj or null
  const [countryForm, setCountryForm] = useState({ workStart: 9, workEnd: 18, lunchStart: 12, lunchEnd: 13.5 });
  const [loggingCallLead, setLoggingCallLead] = useState(null); // { country, lead }
  const [callForm, setCallForm] = useState({ outcome: 'Connected', notes: '' });

  // Search states
  const [bucketCountrySearch, setBucketCountrySearch] = useState(''); // filters buckets by country
  const [modalCountrySearch, setModalCountrySearch] = useState(''); // filters country list in bucket editor

  // Sync to system clock effect
  useEffect(() => {
    if (!syncWithSystem) return;
    
    // Set initially
    setBaseDate(new Date());
    
    const interval = setInterval(() => {
      setBaseDate(new Date());
    }, 10000); // update every 10s
    return () => clearInterval(interval);
  }, [syncWithSystem]);

  // Set default bucket selection once loaded
  useEffect(() => {
    if (outreachBuckets.length > 0 && activeBucketIds.length === 0) {
      const active = outreachBuckets.find(b => !b.archived);
      if (active) {
        setActiveBucketIds([active.id]);
      }
    }
  }, [outreachBuckets, activeBucketIds]);

  // Derived simulated date
  const simulatedDate = new Date(baseDate.getTime() + timeOffsetHours * 60 * 60 * 1000);

  // Master helper: evaluates full availability metrics for a country at simulatedDate
  const evaluateCountry = (country, date) => {
    const tzInfo = getTimezoneInfo(country.timezone, date);
    
    // Config values
    const config = countryConfigs[country.name] || {};
    const workStart = config.workStart !== undefined ? config.workStart : country.defaultWorkStart;
    const workEnd = config.workEnd !== undefined ? config.workEnd : country.defaultWorkEnd;
    const lunchStart = config.lunchStart !== undefined ? config.lunchStart : country.defaultLunchStart;
    const lunchEnd = config.lunchEnd !== undefined ? config.lunchEnd : country.defaultLunchEnd;

    const isWeekend = tzInfo.weekday === 'Saturday' || tzInfo.weekday === 'Sunday';
    
    // Check holiday
    const countryHolidays = PUBLIC_HOLIDAYS_2026[country.name] || [];
    const holiday = countryHolidays.find(h => h.date === tzInfo.dateString);
    
    const hourFraction = tzInfo.hour + tzInfo.minute / 60;
    
    let score = 0;
    let status = 'Outside Working Hours';
    let statusColor = 'status-outside'; // css class
    let statusIcon = '⚫';
    const warnings = [];

    if (isWeekend) {
      score = 5;
      status = 'Outside Working Hours';
      statusColor = 'status-outside';
      statusIcon = '⚫';
      warnings.push('Weekend');
    } else if (holiday) {
      score = 15;
      status = 'Avoid Calling (Holiday)';
      statusColor = 'status-avoid';
      statusIcon = '🔴';
      warnings.push(`Holiday: ${holiday.name}`);
    } else {
      // Inside work hours
      if (hourFraction >= workStart && hourFraction < workEnd) {
        // Check lunch
        if (hourFraction >= lunchStart && hourFraction < lunchEnd) {
          score = 45;
          status = 'Reachable (Lunch)';
          statusColor = 'status-reachable';
          statusIcon = '🟡';
          warnings.push('Lunch Period');
        } else {
          // Working hours
          score = 100;
          
          // Early morning penalty: 9:00 - 10:00
          if (hourFraction >= workStart && hourFraction < workStart + 1) {
            const ratio = hourFraction - workStart;
            score = Math.round(75 + 20 * ratio); // starts at 75, rises to 95
            status = 'Reachable';
            statusColor = 'status-reachable';
            statusIcon = '🟡';
            warnings.push('Early Morning');
          } 
          // End of day penalty
          else if (hourFraction >= workEnd - 1 && hourFraction < workEnd) {
            const ratio = hourFraction - (workEnd - 1);
            score = Math.round(75 - 20 * ratio); // drops from 75 to 55
            status = 'Reachable';
            statusColor = 'status-reachable';
            statusIcon = '🟡';
            warnings.push('End of Day');
          } 
          // Late afternoon penalty
          else if (hourFraction >= workEnd - 2 && hourFraction < workEnd - 1) {
            const ratio = hourFraction - (workEnd - 2);
            score = Math.round(90 - 15 * ratio); // drops from 90 to 75
            status = 'Excellent Time To Call';
            statusColor = 'status-excellent';
            statusIcon = '🟢';
            warnings.push('Late Afternoon');
          }
          // Normal business
          else {
            score = 95;
            status = 'Excellent Time To Call';
            statusColor = 'status-excellent';
            statusIcon = '🟢';
          }
        }
      } else {
        // Outside working hours
        // Evening warning (up to 2 hours after close)
        if (hourFraction >= workEnd && hourFraction < workEnd + 2) {
          score = 25;
          status = 'Outside Working Hours (Evening)';
          statusColor = 'status-outside';
          statusIcon = '⚫';
          warnings.push('Late Evening');
        } 
        // Before hours warning (up to 1.5 hours before open)
        else if (hourFraction >= workStart - 1.5 && hourFraction < workStart) {
          score = 20;
          status = 'Outside Working Hours (Morning)';
          statusColor = 'status-outside';
          statusIcon = '⚫';
          warnings.push('Before Hours');
        }
        else {
          score = 0;
          status = 'Outside Working Hours';
          statusColor = 'status-outside';
          statusIcon = '⚫';
        }
      }
    }

    // Workday Progress
    let progress = 0;
    if (!isWeekend && !holiday) {
      if (hourFraction >= workStart && hourFraction < workEnd) {
        progress = Math.round(((hourFraction - workStart) / (workEnd - workStart)) * 100);
      } else if (hourFraction >= workEnd) {
        progress = 100;
      }
    }

    // Time remaining / status text
    let remainingText = 'Non-Business Day';
    if (!isWeekend && !holiday) {
      if (hourFraction < workStart) {
        remainingText = `Starts in ${formatHours(workStart - hourFraction)}`;
      } else if (hourFraction >= workStart && hourFraction < workEnd) {
        remainingText = `${formatHours(workEnd - hourFraction)} remaining`;
      } else {
        remainingText = 'Business Day Ended';
      }
    }

    // Fetch Performance Metrics
    const logs = outreachHistory.filter(h => h.country === country.name);
    let pickup = 0;
    let booked = 0;
    if (logs.length > 0) {
      const connected = logs.filter(l => l.outcome === 'Connected' || l.outcome === 'Meeting Booked').length;
      const bookedCount = logs.filter(l => l.outcome === 'Meeting Booked').length;
      pickup = Math.round((connected / logs.length) * 100);
      booked = Math.round((bookedCount / logs.length) * 100);
    } else {
      // Profiles fallbacks
      const fallbackPickup = { 'Singapore': 65, 'South Korea': 60, 'Japan': 55, 'United States': 35, 'Canada': 40, 'Germany': 45 }[country.name] || 48;
      const fallbackBooked = { 'Singapore': 20, 'South Korea': 15, 'Japan': 18, 'United States': 8, 'Canada': 10, 'Germany': 12 }[country.name] || 11;
      pickup = fallbackPickup;
      booked = fallbackBooked;
    }
    const response = Math.min(pickup + 12, 95);

    return {
      score,
      status,
      statusColor,
      statusIcon,
      warnings,
      progress,
      remainingText,
      localTime: tzInfo.formattedTime,
      weekday: tzInfo.weekday,
      dateString: tzInfo.dateString,
      isWeekend,
      holiday: holiday ? holiday.name : null,
      performance: { pickup, booked, response, total: logs.length }
    };
  };

  // Compile active countries from selected buckets
  const activeCountriesList = (() => {
    const selectedBucketsList = outreachBuckets.filter(b => activeBucketIds.includes(b.id));
    const countryNames = new Set();
    selectedBucketsList.forEach(b => {
      b.countries.forEach(c => countryNames.add(c));
    });
    
    return SUPPORTED_COUNTRIES.filter(c => countryNames.has(c.name)).map(c => {
      const info = evaluateCountry(c, simulatedDate);
      
      // Calculate hybrid score for performance sorting
      // Formula: 40% timezone calling score + 60% historical pickup probability
      const hybridScore = Math.round(info.score * 0.4 + info.performance.pickup * 0.6);
      
      return {
        ...c,
        info,
        hybridScore
      };
    });
  })();

  // Sort countries based on selection
  const sortedCountries = [...activeCountriesList].sort((a, b) => {
    if (sortBy === 'performance') {
      return b.hybridScore - a.hybridScore;
    }
    return b.info.score - a.info.score;
  });

  // Category Buckets for recommendations
  const callRightNow = sortedCountries.filter(c => c.info.score >= 75);
  const waitToCall = sortedCountries.filter(c => c.info.score >= 20 && c.info.score < 75);
  const avoidToday = sortedCountries.filter(c => c.info.score < 20);

  // Generate suggestions
  const suggestions = (() => {
    const list = [];
    
    // 1. Holiday warnings
    activeCountriesList.forEach(c => {
      if (c.info.holiday) {
        list.push({
          type: 'warning',
          text: `📅 ${c.emoji} **${c.name}** is observing **${c.info.holiday}** today. Outreach may yield very low response.`
        });
      }
    });

    // 2. Best connection rate recommendation
    if (callRightNow.length > 0) {
      const best = [...callRightNow].sort((a, b) => b.info.performance.pickup - a.info.performance.pickup)[0];
      list.push({
        type: 'success',
        text: `⚡ **${best.name}** (${best.emoji}) is highly recommended. Historical connection rate is **${best.info.performance.pickup}%** during this window.`
      });
    }

    // 3. Opening soon
    activeCountriesList.forEach(c => {
      if (c.info.score < 40 && !c.info.isWeekend && !c.info.holiday) {
        const tzInfo = getTimezoneInfo(c.timezone, simulatedDate);
        const config = countryConfigs[c.name] || {};
        const workStart = config.workStart !== undefined ? config.workStart : c.defaultWorkStart;
        const hourFraction = tzInfo.hour + tzInfo.minute / 60;
        
        if (hourFraction < workStart && workStart - hourFraction <= 3) {
          const diffHours = workStart - hourFraction;
          list.push({
            type: 'info',
            text: `⏳ **${c.name}** starts local working hours in **${formatHours(diffHours)}**.`
          });
        }
      }
    });

    // 4. Lunch hour reminder
    activeCountriesList.forEach(c => {
      if (c.info.warnings.includes('Lunch Period')) {
        list.push({
          type: 'info',
          text: `🍽️ **${c.name}** prospects are currently at lunch (**12:00 PM - 1:30 PM** local). Expect high voicemail rates.`
        });
      }
    });

    if (list.length === 0) {
      list.push({
        type: 'info',
        text: '💡 All systems checked. Select countries below to view custom office hours and lead pipelines.'
      });
    }

    return list.slice(0, 3);
  })();

  // Duplicate / Archive handlers
  const handleDuplicateBucket = (id) => {
    duplicateOutreachBucket(id);
  };

  const handleArchiveBucket = (id, archive) => {
    archiveOutreachBucket(id, archive);
    // Unselect if archived
    if (archive) {
      setActiveBucketIds(prev => prev.filter(x => x !== id));
    }
  };

  // Custom Country Settings Handlers
  const handleOpenCustomize = (country) => {
    const config = countryConfigs[country.name] || {};
    setCustomizeCountry(country);
    setCountryForm({
      workStart: config.workStart !== undefined ? config.workStart : country.defaultWorkStart,
      workEnd: config.workEnd !== undefined ? config.workEnd : country.defaultWorkEnd,
      lunchStart: config.lunchStart !== undefined ? config.lunchStart : country.defaultLunchStart,
      lunchEnd: config.lunchEnd !== undefined ? config.lunchEnd : country.defaultLunchEnd
    });
  };

  const handleSaveCountrySettings = (e) => {
    e.preventDefault();
    if (!customizeCountry) return;
    saveCountryConfig(customizeCountry.name, {
      workStart: parseFloat(countryForm.workStart),
      workEnd: parseFloat(countryForm.workEnd),
      lunchStart: parseFloat(countryForm.lunchStart),
      lunchEnd: parseFloat(countryForm.lunchEnd)
    });
    setCustomizeCountry(null);
  };

  // Create / Edit Bucket Modal Handlers
  const handleOpenEditBucket = (bucket) => {
    setEditingBucket({
      id: bucket.id,
      name: bucket.name,
      countries: [...bucket.countries],
      archived: bucket.archived
    });
  };

  const handleOpenNewBucket = () => {
    setEditingBucket({
      id: null,
      name: '',
      countries: [],
      archived: false
    });
  };

  const handleSaveBucket = (e) => {
    e.preventDefault();
    if (!editingBucket.name.trim()) return;
    saveOutreachBucket(editingBucket);
    setEditingBucket(null);
  };

  const handleDeleteBucket = (id) => {
    if (confirm('Are you sure you want to permanently delete this bucket?')) {
      deleteOutreachBucket(id);
      setActiveBucketIds(prev => prev.filter(x => x !== id));
      setEditingBucket(null);
    }
  };

  const toggleCountryInBucket = (countryName) => {
    setEditingBucket(prev => {
      const countries = prev.countries.includes(countryName)
        ? prev.countries.filter(c => c !== countryName)
        : [...prev.countries, countryName];
      return { ...prev, countries };
    });
  };

  // Call logging
  const handleOpenLogCall = (countryName, lead) => {
    setLoggingCallLead({ countryName, lead });
    setCallForm({ outcome: 'Connected', notes: '' });
  };

  const handleSaveCallLog = (e) => {
    e.preventDefault();
    if (!loggingCallLead) return;
    
    logOutreachCall({
      country: loggingCallLead.countryName,
      leadId: loggingCallLead.lead.id,
      outcome: callForm.outcome,
      notes: callForm.notes
    });

    setLoggingCallLead(null);
  };

  // Helper: check bucket selection
  const handleToggleBucketSelect = (id) => {
    setActiveBucketIds(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) 
        : [...prev, id]
    );
  };

  // Timeline render helper
  const renderTimelineSlots = (country) => {
    const slots = [];
    const baseHour = simulatedDate.getHours();
    
    // Evaluate 24 local hours of the rep's day
    for (let i = 0; i < 24; i++) {
      const dateCopy = new Date(simulatedDate);
      dateCopy.setHours(i, 0, 0, 0);
      
      const evaluation = evaluateCountry(country, dateCopy);
      
      let slotClass = 'slot-outside';
      if (evaluation.score >= 75) {
        slotClass = 'slot-excellent';
      } else if (evaluation.score >= 20) {
        slotClass = 'slot-reachable';
      } else if (evaluation.holiday) {
        slotClass = 'slot-holiday';
      }

      slots.push(
        <div 
          key={i} 
          className={`timeline-slot ${slotClass} ${i === baseHour ? 'slot-current' : ''}`}
          title={`${evaluation.weekday} at ${i.toString().padStart(2, '0')}:00 local rep time:
Local Country Time: ${evaluation.localTime}
Score: ${evaluation.score}/100 - ${evaluation.status}
${evaluation.warnings.join(', ')}`}
        >
          {i === baseHour && <div className="current-marker-dot" />}
        </div>
      );
    }
    return slots;
  };

  return (
    <div className="view-content outreach-view-root">
      
      {/* Header */}
      <header className="view-header outreach-header">
        <div>
          <h1 className="view-title flex-items-center">
            <Globe className="header-icon text-accent mr-2" size={32} />
            Global Outreach Intelligence
          </h1>
          <p className="view-description">Smart timezone scheduling, local workday trackers, and historical calling pick-up analysis.</p>
        </div>
        
        {/* Right side live simulated clock */}
        <div className="time-travel-control-card">
          <div className="simulated-time-display">
            <Clock size={16} className="text-accent-secondary" />
            <span className="simulated-time-text">
              {simulatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="simulated-date-text">
              {simulatedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Daily Planner & Multi Bucket Selector */}
      <section className="dashboard-section-card planner-card">
        <div className="planner-header">
          <div className="header-group">
            <FolderOpen size={20} className="text-accent" />
            <h2 className="section-card-title">Select Outbound Buckets</h2>
          </div>
          <div className="bucket-actions">
            <button className="action-btn-secondary flex-items-center" onClick={handleOpenNewBucket}>
              <Plus size={14} />
              <span>Create Bucket</span>
            </button>
          </div>
        </div>

        {/* Country search to filter which buckets contain that country */}
        <div className="bucket-country-search-row">
          <div className="search-wrapper bucket-search-field">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              value={bucketCountrySearch}
              onChange={(e) => setBucketCountrySearch(e.target.value)}
              placeholder="Search by country to find matching buckets..."
              className="search-input"
              id="bucket-country-search-input"
              aria-label="Search buckets by country name"
            />
            {bucketCountrySearch && (
              <button
                className="search-clear-btn"
                onClick={() => setBucketCountrySearch('')}
                aria-label="Clear country search"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {bucketCountrySearch.trim() && (() => {
            const q = bucketCountrySearch.trim().toLowerCase();
            const matchCount = outreachBuckets.filter(b =>
              b.countries.some(c => c.toLowerCase().includes(q))
            ).length;
            return (
              <span className="bucket-search-result-badge">
                {matchCount === 0
                  ? 'No buckets match'
                  : `${matchCount} bucket${matchCount !== 1 ? 's' : ''} contain this country`}
              </span>
            );
          })()}
        </div>

        <div className="buckets-grid">
          {outreachBuckets
            .filter(b => {
              if (!bucketCountrySearch.trim()) return true;
              const q = bucketCountrySearch.trim().toLowerCase();
              return b.countries.some(c => c.toLowerCase().includes(q));
            })
            .map(b => (
            <div 
              key={b.id} 
              className={`bucket-pill ${activeBucketIds.includes(b.id) ? 'selected' : ''} ${b.archived ? 'archived' : ''}`}
              onClick={() => handleToggleBucketSelect(b.id)}
            >
              <div className="bucket-pill-body">
                <span className="bucket-pill-name">{b.name}</span>
                <span className="bucket-pill-count">{b.countries.length} countries</span>
                {/* Highlight matching countries when searching */}
                {bucketCountrySearch.trim() && (() => {
                  const q = bucketCountrySearch.trim().toLowerCase();
                  const matched = b.countries.filter(c => c.toLowerCase().includes(q));
                  return matched.length > 0 ? (
                    <span className="bucket-match-hint">
                      Includes: {matched.join(', ')}
                    </span>
                  ) : null;
                })()}
              </div>
              <div className="bucket-pill-actions" onClick={e => e.stopPropagation()}>
                <button 
                  className="icon-btn-tiny" 
                  onClick={() => handleOpenEditBucket(b)} 
                  title="Edit countries"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  className="icon-btn-tiny" 
                  onClick={() => handleDuplicateBucket(b.id)} 
                  title="Duplicate bucket"
                >
                  <Copy size={12} />
                </button>
                <button 
                  className={`icon-btn-tiny ${b.archived ? 'text-warning' : ''}`}
                  onClick={() => handleArchiveBucket(b.id, !b.archived)} 
                  title={b.archived ? 'Restore bucket' : 'Archive bucket'}
                >
                  <Archive size={12} />
                </button>
              </div>
            </div>
          ))}
          {bucketCountrySearch.trim() && outreachBuckets.filter(b => {
            const q = bucketCountrySearch.trim().toLowerCase();
            return b.countries.some(c => c.toLowerCase().includes(q));
          }).length === 0 && (
            <div className="bucket-no-match-state">
              <Globe size={20} className="text-muted opacity-40" />
              <span>No buckets contain "<strong>{bucketCountrySearch}</strong>"</span>
              <button
                className="action-btn-secondary ml-auto"
                onClick={() => { handleOpenNewBucket(); }}
              >
                <Plus size={13} /> Create bucket with this country
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Time Travel Simulator Control */}
      <section className="dashboard-section-card simulator-slider-card">
        <div className="slider-header">
          <div className="header-title-group">
            <Sliders size={18} className="text-accent-secondary" />
            <h3 className="section-card-title">Time Travel Simulator</h3>
          </div>
          <div className="sync-checkbox-container">
            <input 
              id="sync-toggle"
              type="checkbox" 
              className="sync-checkbox"
              checked={syncWithSystem}
              onChange={(e) => setSyncWithSystem(e.target.checked)}
            />
            <label htmlFor="sync-toggle" className="sync-label">Sync with local clock</label>
          </div>
        </div>

        <div className="slider-body">
          <div className="slider-offset-info">
            <span>Offset: {timeOffsetHours === 0 ? 'Current Time' : `${timeOffsetHours > 0 ? '+' : ''}${timeOffsetHours} Hours`}</span>
            <button className="reset-offset-btn" onClick={() => { setTimeOffsetHours(0); setSyncWithSystem(false); }}>Reset</button>
          </div>
          <input 
            type="range"
            min="-12"
            max="12"
            value={timeOffsetHours}
            onChange={(e) => { setTimeOffsetHours(parseInt(e.target.value)); setSyncWithSystem(false); }}
            className="time-slider"
          />
          <div className="slider-ticks">
            <span>-12h</span>
            <span>-9h</span>
            <span>-6h</span>
            <span>-3h</span>
            <span>Now</span>
            <span>+3h</span>
            <span>+6h</span>
            <span>+9h</span>
            <span>+12h</span>
          </div>
        </div>
      </section>

      {/* AI Suggestions Widget */}
      {suggestions.length > 0 && (
        <section className="ai-suggestions-panel">
          <div className="ai-header">
            <Sparkles size={16} className="text-accent animate-pulse" />
            <span className="ai-title">AI Outreach Suggestions</span>
          </div>
          <div className="ai-tips-container">
            {suggestions.map((tip, idx) => (
              <div key={idx} className={`ai-tip-alert tip-${tip.type}`}>
                <Info size={14} className="tip-alert-icon" />
                <span className="tip-alert-text" dangerouslySetInnerHTML={{ __html: tip.text }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toggle Sort and Stats Bar */}
      <section className="results-toolbar">
        <div className="results-count">
          Analyzing <strong>{sortedCountries.length}</strong> Countries
        </div>
        <div className="sort-buttons-group">
          <span className="toolbar-label">Sort recommendation by:</span>
          <button 
            className={`sort-tab-btn ${sortBy === 'score' ? 'active' : ''}`}
            onClick={() => setSortBy('score')}
          >
            Calling Score (Timezone)
          </button>
          <button 
            className={`sort-tab-btn ${sortBy === 'performance' ? 'active' : ''}`}
            onClick={() => setSortBy('performance')}
            title="Sort combining timezone availability and historical pickup connection rate"
          >
            Connection Rate (Historical)
          </button>
        </div>
      </section>

      {/* Best Country Recommendations Panels */}
      <section className="recommendation-cards-grid">
        {/* Panel 1: Call Right Now */}
        <div className="recommendation-column column-success">
          <div className="column-header">
            <span className="column-dot dot-green" />
            <h3 className="column-title">Call Right Now</h3>
            <span className="count-badge bg-green">{callRightNow.length}</span>
          </div>
          <div className="recommendation-list">
            {callRightNow.length === 0 ? (
              <div className="empty-column-state">No countries currently in peak calling windows.</div>
            ) : (
              callRightNow.map(c => (
                <div key={c.id} className="rec-item-card glow-green" onClick={() => setExpandedCountry(expandedCountry === c.id ? null : c.id)}>
                  <div className="rec-card-body">
                    <span className="rec-flag">{c.emoji}</span>
                    <div className="rec-details">
                      <h4 className="rec-country-name">{c.name}</h4>
                      <span className="rec-local-time">{c.info.localTime} • {c.info.weekday.slice(0,3)}</span>
                    </div>
                    <div className="rec-score-badge text-green">
                      <span className="score-val">{sortBy === 'performance' ? c.hybridScore : c.info.score}</span>
                      <span className="score-lbl">{sortBy === 'performance' ? 'Conv' : 'Score'}</span>
                    </div>
                  </div>
                  <div className="rec-card-footer">
                    <span className="footer-status text-green">{c.info.statusIcon} {c.info.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel 2: Wait to Call */}
        <div className="recommendation-column column-warning">
          <div className="column-header">
            <span className="column-dot dot-yellow" />
            <h3 className="column-title">Wait / Reachable</h3>
            <span className="count-badge bg-yellow">{waitToCall.length}</span>
          </div>
          <div className="recommendation-list">
            {waitToCall.length === 0 ? (
              <div className="empty-column-state">No countries in warning/waiting status.</div>
            ) : (
              waitToCall.map(c => (
                <div key={c.id} className="rec-item-card" onClick={() => setExpandedCountry(expandedCountry === c.id ? null : c.id)}>
                  <div className="rec-card-body">
                    <span className="rec-flag">{c.emoji}</span>
                    <div className="rec-details">
                      <h4 className="rec-country-name">{c.name}</h4>
                      <span className="rec-local-time">{c.info.localTime} • {c.info.weekday.slice(0,3)}</span>
                    </div>
                    <div className="rec-score-badge text-yellow">
                      <span className="score-val">{sortBy === 'performance' ? c.hybridScore : c.info.score}</span>
                      <span className="score-lbl">{sortBy === 'performance' ? 'Conv' : 'Score'}</span>
                    </div>
                  </div>
                  <div className="rec-card-footer">
                    <span className="footer-status text-yellow">
                      {c.info.warnings.includes('Lunch Period') ? '🍽️ Lunch Period' : `${c.info.statusIcon} ${c.info.status}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel 3: Avoid Today */}
        <div className="recommendation-column column-danger">
          <div className="column-header">
            <span className="column-dot dot-grey" />
            <h3 className="column-title">Avoid Today</h3>
            <span className="count-badge bg-grey">{avoidToday.length}</span>
          </div>
          <div className="recommendation-list">
            {avoidToday.length === 0 ? (
              <div className="empty-column-state">All checked countries are currently reachable.</div>
            ) : (
              avoidToday.map(c => (
                <div key={c.id} className="rec-item-card opacity-muted" onClick={() => setExpandedCountry(expandedCountry === c.id ? null : c.id)}>
                  <div className="rec-card-body">
                    <span className="rec-flag">{c.emoji}</span>
                    <div className="rec-details">
                      <h4 className="rec-country-name">{c.name}</h4>
                      <span className="rec-local-time">{c.info.localTime} • {c.info.weekday.slice(0,3)}</span>
                    </div>
                    <div className="rec-score-badge text-muted">
                      <span className="score-val">{sortBy === 'performance' ? c.hybridScore : c.info.score}</span>
                      <span className="score-lbl">{sortBy === 'performance' ? 'Conv' : 'Score'}</span>
                    </div>
                  </div>
                  <div className="rec-card-footer">
                    <span className="footer-status text-danger">
                      {c.info.holiday ? `📅 Holiday: ${c.info.holiday}` : c.info.isWeekend ? '💤 Weekend' : '💤 Outside Hours'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Smart Timeline View */}
      <section className="dashboard-section-card timeline-card-wrapper">
        <div className="section-card-header">
          <h2 className="section-card-title flex-items-center">
            <Sliders className="mr-2 text-accent" size={20} />
            Smart Timeline View (User Local Clock)
          </h2>
          <span className="timeline-legend-pills">
            <span className="legend-item"><span className="legend-color bg-green" /> Peak Outreach</span>
            <span className="legend-item"><span className="legend-color bg-yellow" /> Reachable</span>
            <span className="legend-item"><span className="legend-color bg-grey" /> Avoid</span>
          </span>
        </div>

        {sortedCountries.length === 0 ? (
          <div className="empty-section-state">Select a bucket above to load the timeline preview.</div>
        ) : (
          <div className="timeline-grid-container">
            <div className="timeline-labels-header">
              <div className="country-label-col">Country</div>
              <div className="timeline-slots-row-header">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className={`hour-tick ${i === simulatedDate.getHours() ? 'hour-tick-current' : ''}`}>
                    {i === 0 ? '12a' : i === 12 ? '12p' : i > 12 ? `${i - 12}p` : `${i}a`}
                  </div>
                ))}
              </div>
            </div>

            <div className="timeline-rows-list">
              {sortedCountries.map(c => (
                <div key={c.id} className="timeline-row-item">
                  <div className="timeline-country-info-col" onClick={() => setExpandedCountry(expandedCountry === c.id ? null : c.id)}>
                    <span className="country-flag mr-1">{c.emoji}</span>
                    <span className="country-name truncate">{c.name}</span>
                    <span className="country-time-sub">{c.info.localTime}</span>
                  </div>
                  <div className="timeline-slots-row">
                    {renderTimelineSlots(c)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Interactive Country Grid / Inspector */}
      <section className="dashboard-section-card country-grid-card">
        <div className="section-card-header">
          <h2 className="section-card-title">Country Availability Details</h2>
          <p className="section-subtitle-help">Click any country to customize hours, view leads, or check call statistics.</p>
        </div>

        <div className="countries-detailed-list">
          {sortedCountries.map(c => {
            const isExpanded = expandedCountry === c.id;
            const countryLeads = leads.filter(l => l.country && l.country.toLowerCase() === c.name.toLowerCase());
            
            return (
              <div key={c.id} className={`country-collapsible-item ${isExpanded ? 'expanded' : ''}`}>
                
                {/* Header Summary Row */}
                <div 
                  className="collapsible-summary-row" 
                  onClick={() => setExpandedCountry(isExpanded ? null : c.id)}
                >
                  <div className="summary-left-group">
                    <span className="country-flag-large">{c.emoji}</span>
                    <div className="country-details-group">
                      <h4 className="country-title-text">{c.name}</h4>
                      <div className="country-meta-pills">
                        <span className="meta-pill"><Clock size={12} /> Local: {c.info.localTime}</span>
                        {c.info.warnings.map((w, idx) => (
                          <span key={idx} className="meta-pill pill-warning">{w}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="summary-right-group">
                    {/* Workday progress bar */}
                    <div className="workday-progress-container">
                      <div className="progress-label">
                        <span>Workday Progress</span>
                        <span>{c.info.progress}%</span>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${c.info.progress}%` }} />
                      </div>
                      <span className="remaining-text-info">{c.info.remainingText}</span>
                    </div>

                    <div className="score-summary-badge">
                      <div className={`score-badge-circle border-${c.info.statusColor}`}>
                        <span className="score-num">{sortBy === 'performance' ? c.hybridScore : c.info.score}</span>
                      </div>
                      <span className="score-lbl-sub">{c.info.status}</span>
                    </div>

                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="collapsible-details-body">
                    <div className="details-grid-columns">
                      
                      {/* Left Block: Lead Pipeline */}
                      <div className="details-col col-leads">
                        <h5 className="column-sub-title">Prospect Leads in {c.name} ({countryLeads.length})</h5>
                        {countryLeads.length === 0 ? (
                          <div className="empty-panel-state">
                            <Info size={24} className="text-muted mb-2" />
                            <p>No leads currently registered in {c.name}.</p>
                          </div>
                        ) : (
                          <div className="leads-mini-list">
                            {countryLeads.map(lead => (
                              <div key={lead.id} className="lead-mini-item">
                                <div className="lead-info">
                                  <span className="lead-name" onClick={() => navigateTo('leads', lead.id)}>{lead.name}</span>
                                  <span className="lead-company">{lead.company} • {lead.role}</span>
                                </div>
                                <div className="lead-outreach-actions">
                                  <span className={`status-pill pill-tiny status-${(lead.status || 'New Lead').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                                    {lead.status}
                                  </span>
                                  <button 
                                    className="action-btn-call-mini"
                                    onClick={() => handleOpenLogCall(c.name, lead)}
                                    title="Log call outreach"
                                  >
                                    <Phone size={12} />
                                    <span>Log Call</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Middle Block: Working Hours Settings */}
                      <div className="details-col col-settings">
                        <div className="settings-header-group">
                          <h5 className="column-sub-title">Business Hours Config</h5>
                          <button 
                            className="btn-link-action"
                            onClick={() => handleOpenCustomize(c)}
                          >
                            <Settings size={12} />
                            <span>Customize</span>
                          </button>
                        </div>
                        
                        <div className="custom-hours-summary-card">
                          <div className="hours-row">
                            <span className="hours-lbl">Working Hours:</span>
                            <span className="hours-val">
                              {formatHours(c.info.workStart || c.defaultWorkStart).replace('Hr', ':00').replace('Min', '')} AM - {formatHours((c.info.workEnd || c.defaultWorkEnd) - 12).replace('Hr', ':00').replace('Min', '')} PM 
                              ({(c.info.workStart || c.defaultWorkStart).toFixed(1)} - {(c.info.workEnd || c.defaultWorkEnd).toFixed(1)})
                            </span>
                          </div>
                          <div className="hours-row">
                            <span className="hours-lbl">Lunch Break:</span>
                            <span className="hours-val">
                              {formatHours(c.info.lunchStart || c.defaultLunchStart).replace('Hr', ':00').replace('Min', '')} PM - {formatHours((c.info.lunchEnd || c.defaultLunchEnd) - 12).replace('Hr', ':00').replace('Min', '')} PM 
                              ({(c.info.lunchStart || c.defaultLunchStart).toFixed(1)} - {(c.info.lunchEnd || c.defaultLunchEnd).toFixed(1)})
                            </span>
                          </div>
                          <div className="hours-row">
                            <span className="hours-lbl">Timezone Ref:</span>
                            <span className="hours-val text-mono truncate">{c.timezone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Historical Performance */}
                      <div className="details-col col-metrics">
                        <h5 className="column-sub-title">Historical Outreach Metrics</h5>
                        <div className="metrics-summary-grid">
                          <div className="metric-box bg-purple-glow">
                            <span className="metric-box-val">{c.info.performance.pickup}%</span>
                            <span className="metric-box-lbl">Connection Rate</span>
                          </div>
                          <div className="metric-box bg-blue-glow">
                            <span className="metric-box-val">{c.info.performance.booked}%</span>
                            <span className="metric-box-lbl">Meetings Booked</span>
                          </div>
                          <div className="metric-box bg-dark-glow">
                            <span className="metric-box-val">{c.info.performance.response}%</span>
                            <span className="metric-box-lbl">Response Rate</span>
                          </div>
                        </div>
                        <div className="metrics-footer-calls">
                          Based on <strong>{c.info.performance.total}</strong> simulated client interactions.
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </section>

      {/* Bucket Editor Modal */}
      {editingBucket && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingBucket.id ? 'Edit Outbound Bucket' : 'Create New Outbound Bucket'}
              </h3>
              <button onClick={() => setEditingBucket(null)} className="modal-close-btn" aria-label="Close bucket modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBucket} className="modal-form">
              <div className="form-item">
                <label className="input-label" htmlFor="bucket-name-input">Bucket Name *</label>
                <input 
                  id="bucket-name-input"
                  type="text"
                  required
                  className="name-input"
                  value={editingBucket.name}
                  onChange={(e) => setEditingBucket({ ...editingBucket, name: e.target.value })}
                  placeholder="e.g. APAC Prospects, LatAm Outbound"
                />
              </div>

              <div className="form-item">
                <label className="input-label">Select Countries to Include</label>

                {/* Country search inside the bucket editor */}
                <div className="search-wrapper bucket-modal-country-search mb-1">
                  <Search size={13} className="search-icon" />
                  <input
                    type="text"
                    value={modalCountrySearch}
                    onChange={(e) => setModalCountrySearch(e.target.value)}
                    placeholder="Search countries..."
                    className="search-input font-size-sm"
                    id="modal-country-search-input"
                    aria-label="Search countries in bucket editor"
                  />
                  {modalCountrySearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setModalCountrySearch('')}
                      aria-label="Clear country search"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>

                <div className="country-selector-checklist">
                  {SUPPORTED_COUNTRIES
                    .filter(country =>
                      !modalCountrySearch.trim() ||
                      country.name.toLowerCase().includes(modalCountrySearch.trim().toLowerCase())
                    )
                    .map(country => {
                    const isChecked = editingBucket.countries.includes(country.name);
                    return (
                      <div 
                        key={country.id} 
                        className={`checklist-item ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleCountryInBucket(country.name)}
                      >
                        <span className="checklist-emoji">{country.emoji}</span>
                        <span className="checklist-name">{country.name}</span>
                        <input 
                          type="checkbox" 
                          className="checklist-checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by div click
                          aria-label={`Include ${country.name} in bucket`}
                        />
                      </div>
                    );
                  })}
                  {modalCountrySearch.trim() && !SUPPORTED_COUNTRIES.some(c =>
                    c.name.toLowerCase().includes(modalCountrySearch.trim().toLowerCase())
                  ) && (
                    <div className="modal-country-no-results">
                      No countries matching "<strong>{modalCountrySearch}</strong>"
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer-actions">
                <div className="left-actions">
                  {editingBucket.id && (
                    <button 
                      type="button" 
                      onClick={() => handleDeleteBucket(editingBucket.id)} 
                      className="delete-button-secondary"
                    >
                      <Trash2 size={14} className="mr-1" /> Delete
                    </button>
                  )}
                </div>
                <div className="right-actions">
                  <button type="button" onClick={() => setEditingBucket(null)} className="theme-button">
                    Cancel
                  </button>
                  <button type="submit" className="action-btn-primary">
                    {editingBucket.id ? 'Save Changes' : 'Create Bucket'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customize Country Hours Modal */}
      {customizeCountry && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Customize Hours: {customizeCountry.emoji} {customizeCountry.name}</h3>
              <button onClick={() => setCustomizeCountry(null)} className="modal-close-btn" aria-label="Close customize hours modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCountrySettings} className="modal-form">
              <div className="form-group-row">
                <div className="form-item">
                  <label className="input-label" htmlFor="work-start-select">Workday Start (Hour)</label>
                  <select 
                    id="work-start-select"
                    className="name-input"
                    value={countryForm.workStart}
                    onChange={(e) => setCountryForm({ ...countryForm, workStart: parseFloat(e.target.value) })}
                  >
                    <option value="7">7:00 AM</option>
                    <option value="8">8:00 AM</option>
                    <option value="8.5">8:30 AM</option>
                    <option value="9">9:00 AM</option>
                    <option value="9.5">9:30 AM</option>
                    <option value="10">10:00 AM</option>
                  </select>
                </div>
                
                <div className="form-item">
                  <label className="input-label" htmlFor="work-end-select">Workday End (Hour)</label>
                  <select 
                    id="work-end-select"
                    className="name-input"
                    value={countryForm.workEnd}
                    onChange={(e) => setCountryForm({ ...countryForm, workEnd: parseFloat(e.target.value) })}
                  >
                    <option value="16">4:00 PM</option>
                    <option value="17">5:00 PM</option>
                    <option value="17.5">5:30 PM</option>
                    <option value="18">6:00 PM</option>
                    <option value="18.5">6:30 PM</option>
                    <option value="19">7:00 PM</option>
                    <option value="20">8:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-item">
                  <label className="input-label" htmlFor="lunch-start-select">Lunch Start (Hour)</label>
                  <select 
                    id="lunch-start-select"
                    className="name-input"
                    value={countryForm.lunchStart}
                    onChange={(e) => setCountryForm({ ...countryForm, lunchStart: parseFloat(e.target.value) })}
                  >
                    <option value="11.5">11:30 AM</option>
                    <option value="12">12:00 PM</option>
                    <option value="12.5">12:30 PM</option>
                    <option value="13">1:00 PM</option>
                  </select>
                </div>
                
                <div className="form-item">
                  <label className="input-label" htmlFor="lunch-end-select">Lunch End (Hour)</label>
                  <select 
                    id="lunch-end-select"
                    className="name-input"
                    value={countryForm.lunchEnd}
                    onChange={(e) => setCountryForm({ ...countryForm, lunchEnd: parseFloat(e.target.value) })}
                  >
                    <option value="12.5">12:30 PM</option>
                    <option value="13">1:00 PM</option>
                    <option value="13.5">1:30 PM</option>
                    <option value="14">2:00 PM</option>
                    <option value="14.5">2:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" onClick={() => setCustomizeCountry(null)} className="theme-button">
                  Cancel
                </button>
                <button type="submit" className="action-btn-primary">
                  Apply Custom Hours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Call Modal */}
      {loggingCallLead && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Log Call: {loggingCallLead.lead.name}</h3>
              <button onClick={() => setLoggingCallLead(null)} className="modal-close-btn" aria-label="Close log call modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCallLog} className="modal-form">
              <div className="form-item">
                <label className="input-label" htmlFor="call-outcome-select">Call Outcome *</label>
                <select 
                  id="call-outcome-select"
                  className="name-input"
                  value={callForm.outcome}
                  onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                >
                  <option value="Connected">Connected (Reachable)</option>
                  <option value="Meeting Booked">Meeting Booked (Conversion)</option>
                  <option value="Busy/No Answer">Busy / No Answer</option>
                </select>
              </div>

              <div className="form-item">
                <label className="input-label" htmlFor="call-notes-textarea">Notes & Conversation Summary</label>
                <textarea 
                  id="call-notes-textarea"
                  rows={4}
                  className="note-textarea"
                  placeholder="e.g. Left a voicemail; interested in product demo; discussed pricing deck..."
                  value={callForm.notes}
                  onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-footer-actions">
                <button type="button" onClick={() => setLoggingCallLead(null)} className="theme-button">
                  Cancel
                </button>
                <button type="submit" className="action-btn-primary">
                  Log Call & Update Rates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
