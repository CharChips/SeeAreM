import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Clock, 
  Globe, 
  Check, 
  Sliders, 
  Info, 
  Sparkles, 
  Users, 
  ChevronRight, 
  Star,
  ExternalLink,
  Search,
  Filter,
  AlertCircle,
  GripVertical,
  Pin,
  X
} from 'lucide-react';

const COUNTRIES_CONFIG = [
  // ── South Asia ──
  { id: 'india', name: 'India', timezone: 'Asia/Kolkata', flag: '🇮🇳', description: 'IST – UTC+5:30 (Mumbai, Delhi, Bengaluru)' },
  { id: 'pakistan', name: 'Pakistan', timezone: 'Asia/Karachi', flag: '🇵🇰', description: 'PKT – UTC+5 (Karachi, Lahore, Islamabad)' },
  { id: 'bangladesh', name: 'Bangladesh', timezone: 'Asia/Dhaka', flag: '🇧🇩', description: 'BST – UTC+6 (Dhaka, Chittagong)' },
  { id: 'sri_lanka', name: 'Sri Lanka', timezone: 'Asia/Colombo', flag: '🇱🇰', description: 'SLST – UTC+5:30 (Colombo)' },
  { id: 'nepal', name: 'Nepal', timezone: 'Asia/Kathmandu', flag: '🇳🇵', description: 'NPT – UTC+5:45 (Kathmandu)' },
  { id: 'afghanistan', name: 'Afghanistan', timezone: 'Asia/Kabul', flag: '🇦🇫', description: 'AFT – UTC+4:30 (Kabul)' },
  { id: 'maldives', name: 'Maldives', timezone: 'Indian/Maldives', flag: '🇲🇻', description: 'MVT – UTC+5 (Malé)' },
  { id: 'bhutan', name: 'Bhutan', timezone: 'Asia/Thimphu', flag: '🇧🇹', description: 'BTT – UTC+6 (Thimphu)' },

  // ── Southeast Asia ──
  { id: 'singapore', name: 'Singapore', timezone: 'Asia/Singapore', flag: '🇸🇬', description: 'SGT – UTC+8 (Singapore)' },
  { id: 'indonesia_wib', name: 'Indonesia (Jakarta)', timezone: 'Asia/Jakarta', flag: '🇮🇩', description: 'WIB – UTC+7 (Jakarta, Surabaya)' },
  { id: 'indonesia_wita', name: 'Indonesia (Bali)', timezone: 'Asia/Makassar', flag: '🇮🇩', description: 'WITA – UTC+8 (Bali, Lombok)' },
  { id: 'indonesia_wit', name: 'Indonesia (Papua)', timezone: 'Asia/Jayapura', flag: '🇮🇩', description: 'WIT – UTC+9 (Papua, Maluku)' },
  { id: 'malaysia', name: 'Malaysia', timezone: 'Asia/Kuala_Lumpur', flag: '🇲🇾', description: 'MYT – UTC+8 (Kuala Lumpur)' },
  { id: 'thailand', name: 'Thailand', timezone: 'Asia/Bangkok', flag: '🇹🇭', description: 'ICT – UTC+7 (Bangkok, Chiang Mai)' },
  { id: 'vietnam', name: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh', flag: '🇻🇳', description: 'ICT – UTC+7 (Ho Chi Minh City, Hanoi)' },
  { id: 'philippines', name: 'Philippines', timezone: 'Asia/Manila', flag: '🇵🇭', description: 'PHT – UTC+8 (Manila, Cebu)' },
  { id: 'cambodia', name: 'Cambodia', timezone: 'Asia/Phnom_Penh', flag: '🇰🇭', description: 'ICT – UTC+7 (Phnom Penh)' },
  { id: 'laos', name: 'Laos', timezone: 'Asia/Vientiane', flag: '🇱🇦', description: 'ICT – UTC+7 (Vientiane)' },
  { id: 'myanmar', name: 'Myanmar', timezone: 'Asia/Rangoon', flag: '🇲🇲', description: 'MMT – UTC+6:30 (Yangon)' },
  { id: 'timor_leste', name: 'Timor-Leste', timezone: 'Asia/Dili', flag: '🇹🇱', description: 'TLT – UTC+9 (Dili)' },
  { id: 'brunei', name: 'Brunei', timezone: 'Asia/Brunei', flag: '🇧🇳', description: 'BNT – UTC+8 (Bandar Seri Begawan)' },

  // ── East Asia ──
  { id: 'japan', name: 'Japan', timezone: 'Asia/Tokyo', flag: '🇯🇵', description: 'JST – UTC+9 (Tokyo, Osaka)' },
  { id: 'south_korea', name: 'South Korea', timezone: 'Asia/Seoul', flag: '🇰🇷', description: 'KST – UTC+9 (Seoul, Busan)' },
  { id: 'china', name: 'China', timezone: 'Asia/Shanghai', flag: '🇨🇳', description: 'CST – UTC+8 (Shanghai, Beijing, Shenzhen)' },
  { id: 'hong_kong', name: 'Hong Kong', timezone: 'Asia/Hong_Kong', flag: '🇭🇰', description: 'HKT – UTC+8 (Hong Kong)' },
  { id: 'taiwan', name: 'Taiwan', timezone: 'Asia/Taipei', flag: '🇹🇼', description: 'CST – UTC+8 (Taipei)' },
  { id: 'macau', name: 'Macau', timezone: 'Asia/Macau', flag: '🇲🇴', description: 'CST – UTC+8 (Macau)' },
  { id: 'mongolia', name: 'Mongolia', timezone: 'Asia/Ulaanbaatar', flag: '🇲🇳', description: 'ULAT – UTC+8 (Ulaanbaatar)' },
  { id: 'north_korea', name: 'North Korea', timezone: 'Asia/Pyongyang', flag: '🇰🇵', description: 'KST – UTC+9 (Pyongyang)' },

  // ── Pacific / Oceania ──
  { id: 'australia_sydney', name: 'Australia (Sydney)', timezone: 'Australia/Sydney', flag: '🇦🇺', description: 'AEST/AEDT – UTC+10/+11 (Sydney, Melbourne)' },
  { id: 'australia_perth', name: 'Australia (Perth)', timezone: 'Australia/Perth', flag: '🇦🇺', description: 'AWST – UTC+8 (Perth)' },
  { id: 'australia_adelaide', name: 'Australia (Adelaide)', timezone: 'Australia/Adelaide', flag: '🇦🇺', description: 'ACST/ACDT – UTC+9:30/+10:30 (Adelaide)' },
  { id: 'australia_brisbane', name: 'Australia (Brisbane)', timezone: 'Australia/Brisbane', flag: '🇦🇺', description: 'AEST – UTC+10 (Brisbane, Queensland)' },
  { id: 'new_zealand', name: 'New Zealand', timezone: 'Pacific/Auckland', flag: '🇳🇿', description: 'NZST/NZDT – UTC+12/+13 (Auckland, Wellington)' },
  { id: 'papua_new_guinea', name: 'Papua New Guinea', timezone: 'Pacific/Port_Moresby', flag: '🇵🇬', description: 'PGT – UTC+10 (Port Moresby)' },
  { id: 'fiji', name: 'Fiji', timezone: 'Pacific/Fiji', flag: '🇫🇯', description: 'FJT – UTC+12 (Suva)' },

  // ── Central Asia ──
  { id: 'kazakhstan', name: 'Kazakhstan', timezone: 'Asia/Almaty', flag: '🇰🇿', description: 'ALMT – UTC+6 (Almaty, Astana)' },
  { id: 'uzbekistan', name: 'Uzbekistan', timezone: 'Asia/Tashkent', flag: '🇺🇿', description: 'UZT – UTC+5 (Tashkent, Samarkand)' },
  { id: 'kyrgyzstan', name: 'Kyrgyzstan', timezone: 'Asia/Bishkek', flag: '🇰🇬', description: 'KGT – UTC+6 (Bishkek)' },
  { id: 'tajikistan', name: 'Tajikistan', timezone: 'Asia/Dushanbe', flag: '🇹🇯', description: 'TJT – UTC+5 (Dushanbe)' },
  { id: 'turkmenistan', name: 'Turkmenistan', timezone: 'Asia/Ashgabat', flag: '🇹🇲', description: 'TMT – UTC+5 (Ashgabat)' },
  { id: 'azerbaijan', name: 'Azerbaijan', timezone: 'Asia/Baku', flag: '🇦🇿', description: 'AZT – UTC+4 (Baku)' },
  { id: 'georgia', name: 'Georgia', timezone: 'Asia/Tbilisi', flag: '🇬🇪', description: 'GET – UTC+4 (Tbilisi)' },
  { id: 'armenia', name: 'Armenia', timezone: 'Asia/Yerevan', flag: '🇦🇲', description: 'AMT – UTC+4 (Yerevan)' },

  // ── Middle East ──
  { id: 'uae', name: 'United Arab Emirates', timezone: 'Asia/Dubai', flag: '🇦🇪', description: 'GST – UTC+4 (Dubai, Abu Dhabi)' },
  { id: 'saudi_arabia', name: 'Saudi Arabia', timezone: 'Asia/Riyadh', flag: '🇸🇦', description: 'AST – UTC+3 (Riyadh, Jeddah)' },
  { id: 'qatar', name: 'Qatar', timezone: 'Asia/Qatar', flag: '🇶🇦', description: 'AST – UTC+3 (Doha)' },
  { id: 'kuwait', name: 'Kuwait', timezone: 'Asia/Kuwait', flag: '🇰🇼', description: 'AST – UTC+3 (Kuwait City)' },
  { id: 'bahrain', name: 'Bahrain', timezone: 'Asia/Bahrain', flag: '🇧🇭', description: 'AST – UTC+3 (Manama)' },
  { id: 'oman', name: 'Oman', timezone: 'Asia/Muscat', flag: '🇴🇲', description: 'GST – UTC+4 (Muscat)' },
  { id: 'jordan', name: 'Jordan', timezone: 'Asia/Amman', flag: '🇯🇴', description: 'EET/EEST – UTC+2/+3 (Amman)' },
  { id: 'israel', name: 'Israel', timezone: 'Asia/Jerusalem', flag: '🇮🇱', description: 'IST/IDT – UTC+2/+3 (Tel Aviv, Jerusalem)' },
  { id: 'lebanon', name: 'Lebanon', timezone: 'Asia/Beirut', flag: '🇱🇧', description: 'EET/EEST – UTC+2/+3 (Beirut)' },
  { id: 'turkey', name: 'Turkey', timezone: 'Europe/Istanbul', flag: '🇹🇷', description: 'TRT – UTC+3 (Istanbul, Ankara)' },
  { id: 'iraq', name: 'Iraq', timezone: 'Asia/Baghdad', flag: '🇮🇶', description: 'AST – UTC+3 (Baghdad, Basra)' },
  { id: 'iran', name: 'Iran', timezone: 'Asia/Tehran', flag: '🇮🇷', description: 'IRST/IRDT – UTC+3:30/+4:30 (Tehran)' },
  { id: 'syria', name: 'Syria', timezone: 'Asia/Damascus', flag: '🇸🇾', description: 'EET/EEST – UTC+2/+3 (Damascus)' },
  { id: 'yemen', name: 'Yemen', timezone: 'Asia/Aden', flag: '🇾🇪', description: 'AST – UTC+3 (Sana\'a)' },
  { id: 'palestine', name: 'Palestine', timezone: 'Asia/Gaza', flag: '🇵🇸', description: 'EET/EEST – UTC+2/+3 (Gaza, West Bank)' },

  // ── Western Europe ──
  { id: 'uk', name: 'United Kingdom', timezone: 'Europe/London', flag: '🇬🇧', description: 'GMT/BST – UTC+0/+1 (London, Manchester)' },
  { id: 'ireland', name: 'Ireland', timezone: 'Europe/Dublin', flag: '🇮🇪', description: 'GMT/IST – UTC+0/+1 (Dublin, Cork)' },
  { id: 'france', name: 'France', timezone: 'Europe/Paris', flag: '🇫🇷', description: 'CET/CEST – UTC+1/+2 (Paris, Lyon)' },
  { id: 'germany', name: 'Germany', timezone: 'Europe/Berlin', flag: '🇩🇪', description: 'CET/CEST – UTC+1/+2 (Berlin, Munich)' },
  { id: 'netherlands', name: 'Netherlands', timezone: 'Europe/Amsterdam', flag: '🇳🇱', description: 'CET/CEST – UTC+1/+2 (Amsterdam)' },
  { id: 'belgium', name: 'Belgium', timezone: 'Europe/Brussels', flag: '🇧🇪', description: 'CET/CEST – UTC+1/+2 (Brussels)' },
  { id: 'switzerland', name: 'Switzerland', timezone: 'Europe/Zurich', flag: '🇨🇭', description: 'CET/CEST – UTC+1/+2 (Zurich, Geneva)' },
  { id: 'austria', name: 'Austria', timezone: 'Europe/Vienna', flag: '🇦🇹', description: 'CET/CEST – UTC+1/+2 (Vienna)' },
  { id: 'spain', name: 'Spain', timezone: 'Europe/Madrid', flag: '🇪🇸', description: 'CET/CEST – UTC+1/+2 (Madrid, Barcelona)' },
  { id: 'portugal', name: 'Portugal', timezone: 'Europe/Lisbon', flag: '🇵🇹', description: 'WET/WEST – UTC+0/+1 (Lisbon, Porto)' },
  { id: 'italy', name: 'Italy', timezone: 'Europe/Rome', flag: '🇮🇹', description: 'CET/CEST – UTC+1/+2 (Rome, Milan)' },
  { id: 'luxembourg', name: 'Luxembourg', timezone: 'Europe/Luxembourg', flag: '🇱🇺', description: 'CET/CEST – UTC+1/+2 (Luxembourg City)' },
  { id: 'monaco', name: 'Monaco', timezone: 'Europe/Monaco', flag: '🇲🇨', description: 'CET/CEST – UTC+1/+2 (Monaco)' },

  // ── Northern Europe ──
  { id: 'sweden', name: 'Sweden', timezone: 'Europe/Stockholm', flag: '🇸🇪', description: 'CET/CEST – UTC+1/+2 (Stockholm)' },
  { id: 'norway', name: 'Norway', timezone: 'Europe/Oslo', flag: '🇳🇴', description: 'CET/CEST – UTC+1/+2 (Oslo)' },
  { id: 'denmark', name: 'Denmark', timezone: 'Europe/Copenhagen', flag: '🇩🇰', description: 'CET/CEST – UTC+1/+2 (Copenhagen)' },
  { id: 'finland', name: 'Finland', timezone: 'Europe/Helsinki', flag: '🇫🇮', description: 'EET/EEST – UTC+2/+3 (Helsinki)' },
  { id: 'iceland', name: 'Iceland', timezone: 'Atlantic/Reykjavik', flag: '🇮🇸', description: 'GMT – UTC+0 (Reykjavik)' },

  // ── Eastern Europe ──
  { id: 'poland', name: 'Poland', timezone: 'Europe/Warsaw', flag: '🇵🇱', description: 'CET/CEST – UTC+1/+2 (Warsaw, Kraków)' },
  { id: 'czech_republic', name: 'Czech Republic', timezone: 'Europe/Prague', flag: '🇨🇿', description: 'CET/CEST – UTC+1/+2 (Prague)' },
  { id: 'hungary', name: 'Hungary', timezone: 'Europe/Budapest', flag: '🇭🇺', description: 'CET/CEST – UTC+1/+2 (Budapest)' },
  { id: 'romania', name: 'Romania', timezone: 'Europe/Bucharest', flag: '🇷🇴', description: 'EET/EEST – UTC+2/+3 (Bucharest)' },
  { id: 'bulgaria', name: 'Bulgaria', timezone: 'Europe/Sofia', flag: '🇧🇬', description: 'EET/EEST – UTC+2/+3 (Sofia)' },
  { id: 'ukraine', name: 'Ukraine', timezone: 'Europe/Kyiv', flag: '🇺🇦', description: 'EET/EEST – UTC+2/+3 (Kyiv, Kharkiv)' },
  { id: 'russia_msk', name: 'Russia (Moscow)', timezone: 'Europe/Moscow', flag: '🇷🇺', description: 'MSK – UTC+3 (Moscow, St. Petersburg)' },
  { id: 'russia_yekt', name: 'Russia (Yekaterinburg)', timezone: 'Asia/Yekaterinburg', flag: '🇷🇺', description: 'YEKT – UTC+5 (Yekaterinburg)' },
  { id: 'russia_irkt', name: 'Russia (Irkutsk)', timezone: 'Asia/Irkutsk', flag: '🇷🇺', description: 'IRKT – UTC+8 (Irkutsk)' },
  { id: 'russia_vlad', name: 'Russia (Vladivostok)', timezone: 'Asia/Vladivostok', flag: '🇷🇺', description: 'VLAT – UTC+10 (Vladivostok)' },
  { id: 'belarus', name: 'Belarus', timezone: 'Europe/Minsk', flag: '🇧🇾', description: 'FET – UTC+3 (Minsk)' },
  { id: 'serbia', name: 'Serbia', timezone: 'Europe/Belgrade', flag: '🇷🇸', description: 'CET/CEST – UTC+1/+2 (Belgrade)' },
  { id: 'croatia', name: 'Croatia', timezone: 'Europe/Zagreb', flag: '🇭🇷', description: 'CET/CEST – UTC+1/+2 (Zagreb)' },
  { id: 'greece', name: 'Greece', timezone: 'Europe/Athens', flag: '🇬🇷', description: 'EET/EEST – UTC+2/+3 (Athens)' },
  { id: 'slovakia', name: 'Slovakia', timezone: 'Europe/Bratislava', flag: '🇸🇰', description: 'CET/CEST – UTC+1/+2 (Bratislava)' },
  { id: 'slovenia', name: 'Slovenia', timezone: 'Europe/Ljubljana', flag: '🇸🇮', description: 'CET/CEST – UTC+1/+2 (Ljubljana)' },
  { id: 'estonia', name: 'Estonia', timezone: 'Europe/Tallinn', flag: '🇪🇪', description: 'EET/EEST – UTC+2/+3 (Tallinn)' },
  { id: 'latvia', name: 'Latvia', timezone: 'Europe/Riga', flag: '🇱🇻', description: 'EET/EEST – UTC+2/+3 (Riga)' },
  { id: 'lithuania', name: 'Lithuania', timezone: 'Europe/Vilnius', flag: '🇱🇹', description: 'EET/EEST – UTC+2/+3 (Vilnius)' },
  { id: 'moldova', name: 'Moldova', timezone: 'Europe/Chisinau', flag: '🇲🇩', description: 'EET/EEST – UTC+2/+3 (Chișinău)' },
  { id: 'cyprus', name: 'Cyprus', timezone: 'Asia/Nicosia', flag: '🇨🇾', description: 'EET/EEST – UTC+2/+3 (Nicosia)' },
  { id: 'malta', name: 'Malta', timezone: 'Europe/Malta', flag: '🇲🇹', description: 'CET/CEST – UTC+1/+2 (Valletta)' },
  { id: 'albania', name: 'Albania', timezone: 'Europe/Tirane', flag: '🇦🇱', description: 'CET/CEST – UTC+1/+2 (Tirana)' },
  { id: 'north_macedonia', name: 'North Macedonia', timezone: 'Europe/Skopje', flag: '🇲🇰', description: 'CET/CEST – UTC+1/+2 (Skopje)' },
  { id: 'bosnia', name: 'Bosnia & Herzegovina', timezone: 'Europe/Sarajevo', flag: '🇧🇦', description: 'CET/CEST – UTC+1/+2 (Sarajevo)' },
  { id: 'montenegro', name: 'Montenegro', timezone: 'Europe/Podgorica', flag: '🇲🇪', description: 'CET/CEST – UTC+1/+2 (Podgorica)' },

  // ── North Africa ──
  { id: 'egypt', name: 'Egypt', timezone: 'Africa/Cairo', flag: '🇪🇬', description: 'EET – UTC+2 (Cairo, Alexandria)' },
  { id: 'morocco', name: 'Morocco', timezone: 'Africa/Casablanca', flag: '🇲🇦', description: 'WET/WEST – UTC+0/+1 (Casablanca, Rabat)' },
  { id: 'algeria', name: 'Algeria', timezone: 'Africa/Algiers', flag: '🇩🇿', description: 'CET – UTC+1 (Algiers)' },
  { id: 'tunisia', name: 'Tunisia', timezone: 'Africa/Tunis', flag: '🇹🇳', description: 'CET – UTC+1 (Tunis)' },
  { id: 'libya', name: 'Libya', timezone: 'Africa/Tripoli', flag: '🇱🇾', description: 'EET – UTC+2 (Tripoli)' },
  { id: 'sudan', name: 'Sudan', timezone: 'Africa/Khartoum', flag: '🇸🇩', description: 'CAT – UTC+3 (Khartoum)' },

  // ── Sub-Saharan Africa ──
  { id: 'nigeria', name: 'Nigeria', timezone: 'Africa/Lagos', flag: '🇳🇬', description: 'WAT – UTC+1 (Lagos, Abuja)' },
  { id: 'south_africa', name: 'South Africa', timezone: 'Africa/Johannesburg', flag: '🇿🇦', description: 'SAST – UTC+2 (Johannesburg, Cape Town)' },
  { id: 'kenya', name: 'Kenya', timezone: 'Africa/Nairobi', flag: '🇰🇪', description: 'EAT – UTC+3 (Nairobi, Mombasa)' },
  { id: 'ghana', name: 'Ghana', timezone: 'Africa/Accra', flag: '🇬🇭', description: 'GMT – UTC+0 (Accra)' },
  { id: 'ethiopia', name: 'Ethiopia', timezone: 'Africa/Addis_Ababa', flag: '🇪🇹', description: 'EAT – UTC+3 (Addis Ababa)' },
  { id: 'tanzania', name: 'Tanzania', timezone: 'Africa/Dar_es_Salaam', flag: '🇹🇿', description: 'EAT – UTC+3 (Dar es Salaam)' },
  { id: 'uganda', name: 'Uganda', timezone: 'Africa/Kampala', flag: '🇺🇬', description: 'EAT – UTC+3 (Kampala)' },
  { id: 'rwanda', name: 'Rwanda', timezone: 'Africa/Kigali', flag: '🇷🇼', description: 'CAT – UTC+2 (Kigali)' },
  { id: 'senegal', name: 'Senegal', timezone: 'Africa/Dakar', flag: '🇸🇳', description: 'GMT – UTC+0 (Dakar)' },
  { id: 'ivory_coast', name: 'Ivory Coast', timezone: 'Africa/Abidjan', flag: '🇨🇮', description: 'GMT – UTC+0 (Abidjan)' },
  { id: 'cameroon', name: 'Cameroon', timezone: 'Africa/Douala', flag: '🇨🇲', description: 'WAT – UTC+1 (Douala, Yaoundé)' },
  { id: 'angola', name: 'Angola', timezone: 'Africa/Luanda', flag: '🇦🇴', description: 'WAT – UTC+1 (Luanda)' },
  { id: 'mozambique', name: 'Mozambique', timezone: 'Africa/Maputo', flag: '🇲🇿', description: 'CAT – UTC+2 (Maputo)' },
  { id: 'zambia', name: 'Zambia', timezone: 'Africa/Lusaka', flag: '🇿🇲', description: 'CAT – UTC+2 (Lusaka)' },
  { id: 'zimbabwe', name: 'Zimbabwe', timezone: 'Africa/Harare', flag: '🇿🇼', description: 'CAT – UTC+2 (Harare)' },
  { id: 'botswana', name: 'Botswana', timezone: 'Africa/Gaborone', flag: '🇧🇼', description: 'CAT – UTC+2 (Gaborone)' },
  { id: 'namibia', name: 'Namibia', timezone: 'Africa/Windhoek', flag: '🇳🇦', description: 'WAT/WAST – UTC+1/+2 (Windhoek)' },
  { id: 'madagascar', name: 'Madagascar', timezone: 'Indian/Antananarivo', flag: '🇲🇬', description: 'EAT – UTC+3 (Antananarivo)' },

  // ── North America ──
  { id: 'us_est', name: 'United States (EST)', timezone: 'America/New_York', flag: '🇺🇸', description: 'EST/EDT – UTC-5/-4 (New York, Boston, Miami)' },
  { id: 'us_cst', name: 'United States (CST)', timezone: 'America/Chicago', flag: '🇺🇸', description: 'CST/CDT – UTC-6/-5 (Chicago, Dallas, Houston)' },
  { id: 'us_mst', name: 'United States (MST)', timezone: 'America/Denver', flag: '🇺🇸', description: 'MST/MDT – UTC-7/-6 (Denver, Phoenix)' },
  { id: 'us_pst', name: 'United States (PST)', timezone: 'America/Los_Angeles', flag: '🇺🇸', description: 'PST/PDT – UTC-8/-7 (Los Angeles, San Francisco)' },
  { id: 'us_alaska', name: 'United States (Alaska)', timezone: 'America/Anchorage', flag: '🇺🇸', description: 'AKST/AKDT – UTC-9/-8 (Anchorage)' },
  { id: 'us_hawaii', name: 'United States (Hawaii)', timezone: 'Pacific/Honolulu', flag: '🇺🇸', description: 'HST – UTC-10 (Honolulu)' },
  { id: 'canada_est', name: 'Canada (Eastern)', timezone: 'America/Toronto', flag: '🇨🇦', description: 'EST/EDT – UTC-5/-4 (Toronto, Ottawa, Montreal)' },
  { id: 'canada_cst', name: 'Canada (Central)', timezone: 'America/Winnipeg', flag: '🇨🇦', description: 'CST/CDT – UTC-6/-5 (Winnipeg, Saskatchewan)' },
  { id: 'canada_mst', name: 'Canada (Mountain)', timezone: 'America/Edmonton', flag: '🇨🇦', description: 'MST/MDT – UTC-7/-6 (Calgary, Edmonton)' },
  { id: 'canada_pst', name: 'Canada (Pacific)', timezone: 'America/Vancouver', flag: '🇨🇦', description: 'PST/PDT – UTC-8/-7 (Vancouver, Victoria)' },
  { id: 'mexico', name: 'Mexico', timezone: 'America/Mexico_City', flag: '🇲🇽', description: 'CST/CDT – UTC-6/-5 (Mexico City, Guadalajara)' },

  // ── Central America & Caribbean ──
  { id: 'guatemala', name: 'Guatemala', timezone: 'America/Guatemala', flag: '🇬🇹', description: 'CST – UTC-6 (Guatemala City)' },
  { id: 'costa_rica', name: 'Costa Rica', timezone: 'America/Costa_Rica', flag: '🇨🇷', description: 'CST – UTC-6 (San José)' },
  { id: 'panama', name: 'Panama', timezone: 'America/Panama', flag: '🇵🇦', description: 'EST – UTC-5 (Panama City)' },
  { id: 'cuba', name: 'Cuba', timezone: 'America/Havana', flag: '🇨🇺', description: 'CST/CDT – UTC-5/-4 (Havana)' },
  { id: 'dominican_republic', name: 'Dominican Republic', timezone: 'America/Santo_Domingo', flag: '🇩🇴', description: 'AST – UTC-4 (Santo Domingo)' },
  { id: 'jamaica', name: 'Jamaica', timezone: 'America/Jamaica', flag: '🇯🇲', description: 'EST – UTC-5 (Kingston)' },

  // ── South America ──
  { id: 'brazil_brt', name: 'Brazil (Brasília)', timezone: 'America/Sao_Paulo', flag: '🇧🇷', description: 'BRT/BRST – UTC-3/-2 (São Paulo, Rio, Brasília)' },
  { id: 'brazil_amazon', name: 'Brazil (Manaus)', timezone: 'America/Manaus', flag: '🇧🇷', description: 'AMT – UTC-4 (Manaus, Cuiabá)' },
  { id: 'argentina', name: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷', description: 'ART – UTC-3 (Buenos Aires, Córdoba)' },
  { id: 'chile', name: 'Chile', timezone: 'America/Santiago', flag: '🇨🇱', description: 'CLT/CLST – UTC-4/-3 (Santiago, Valparaíso)' },
  { id: 'colombia', name: 'Colombia', timezone: 'America/Bogota', flag: '🇨🇴', description: 'COT – UTC-5 (Bogotá, Medellín)' },
  { id: 'peru', name: 'Peru', timezone: 'America/Lima', flag: '🇵🇪', description: 'PET – UTC-5 (Lima, Arequipa)' },
  { id: 'venezuela', name: 'Venezuela', timezone: 'America/Caracas', flag: '🇻🇪', description: 'VET – UTC-4 (Caracas, Maracaibo)' },
  { id: 'ecuador', name: 'Ecuador', timezone: 'America/Guayaquil', flag: '🇪🇨', description: 'ECT – UTC-5 (Quito, Guayaquil)' },
  { id: 'bolivia', name: 'Bolivia', timezone: 'America/La_Paz', flag: '🇧🇴', description: 'BOT – UTC-4 (La Paz, Santa Cruz)' },
  { id: 'paraguay', name: 'Paraguay', timezone: 'America/Asuncion', flag: '🇵🇾', description: 'PYT/PYST – UTC-4/-3 (Asunción)' },
  { id: 'uruguay', name: 'Uruguay', timezone: 'America/Montevideo', flag: '🇺🇾', description: 'UYT – UTC-3 (Montevideo)' },
  { id: 'guyana', name: 'Guyana', timezone: 'America/Guyana', flag: '🇬🇾', description: 'GYT – UTC-4 (Georgetown)' },
];

// SDR shift configuration (IST, GMT+5:30)
const SDR_SHIFT = {
  start: 10, // 10:00 AM IST
  end: 19,   // 7:00 PM IST
  timezone: 'Asia/Kolkata',
  name: 'SDR Team (IST Shift)'
};

// Prospect standard business hours (9:00 AM - 5:00 PM local)
const PROSPECT_WORK_HOURS = {
  start: 9,
  end: 17
};

// Compute timezone conversions dynamically for a specific hour in IST
const getConvertedTimes = (istHourVal, targetTimezone) => {
  try {
    const today = new Date();
    // Start at today at 00:00:00 UTC
    const utcStart = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    // Add the IST hour value (e.g. 10.5 hours) minus the 5.5 hours timezone offset for IST
    const baseDate = new Date(utcStart + (istHourVal - 5.5) * 60 * 60 * 1000);

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      hour12: false,
      hour: 'numeric',
      minute: 'numeric'
    });
    
    const parts = formatter.formatToParts(baseDate);
    const hourStr = parts.find(p => p.type === 'hour')?.value || '0';
    const minStr = parts.find(p => p.type === 'minute')?.value || '0';
    
    const targetHourVal = parseInt(hourStr, 10) % 24;
    const targetMinVal = parseInt(minStr, 10);

    const displayHour = targetHourVal % 12 === 0 ? 12 : targetHourVal % 12;
    const displayAmPm = targetHourVal >= 12 ? 'PM' : 'AM';
    const formatted = `${displayHour}:${minStr.padStart(2, '0')} ${displayAmPm}`;
    
    return {
      hourVal: targetHourVal,
      minuteVal: targetMinVal,
      hourFraction: targetHourVal + (targetMinVal / 60),
      formatted
    };
  } catch (e) {
    // Fallback
    const hourInt = Math.floor(istHourVal);
    const minInt = (istHourVal % 1 === 0) ? 0 : 30;
    const displayHour = hourInt % 12 === 0 ? 12 : hourInt % 12;
    const displayAmPm = hourInt >= 12 ? 'PM' : 'AM';
    return { 
      hourVal: hourInt, 
      minuteVal: minInt, 
      hourFraction: istHourVal, 
      formatted: `${displayHour}:${minInt.toString().padStart(2, '0')} ${displayAmPm}` 
    };
  }
};

export const TimeComparisonView = () => {
  const { leads, navigateTo } = useCRM();

  // Ticking live clock state
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 5000); // update every 5 seconds to be highly responsive and performant
    return () => clearInterval(timer);
  }, []);

  const getCountryCurrentTime = (timezone) => {
    try {
      const options = {
        timeZone: timezone,
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      return new Intl.DateTimeFormat('en-US', options).format(now);
    } catch (e) {
      return 'N/A';
    }
  };

  // Selected countries state — ALL hooks must be at top level, never inside try/catch
  // Only India (SDR reference) is fixed; no extra countries selected by default.
  const [selectedIds, setSelectedIds] = useState([]);
  const [hoveredHour, setHoveredHour] = useState(null); // 0 - 23 (IST Hour)
  const [countrySearch, setCountrySearch] = useState('');
  const [dragOverId, setDragOverId] = useState(null);

  // Drag-to-reorder refs
  const dragItem = useRef(null);   // id being dragged
  const dragOverItem = useRef(null); // id currently hovered over

  // Toggle country selection (India row is always fixed as SDR reference, not in selectedIds)
  const handleToggleCountry = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(cid => cid !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // Drag handlers for reordering
  const handleDragStart = (id) => {
    dragItem.current = id;
  };

  const handleDragEnter = (id) => {
    dragOverItem.current = id;
    setDragOverId(id);
  };

  const handleDragEnd = () => {
    if (!dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      setDragOverId(null);
      return;
    }
    setSelectedIds(prev => {
      const copy = [...prev];
      const fromIdx = copy.indexOf(dragItem.current);
      const toIdx = copy.indexOf(dragOverItem.current);
      if (fromIdx === -1 || toIdx === -1) return copy;
      copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, dragItem.current);
      return copy;
    });
    dragItem.current = null;
    dragOverItem.current = null;
    setDragOverId(null);
  };

  // Retrieve active selected countries — preserves selectedIds ORDER (for drag reorder to work)
  const activeCountries = useMemo(() => {
    return selectedIds
      .map(id => COUNTRIES_CONFIG.find(c => c.id === id))
      .filter(Boolean);
  }, [selectedIds]);

  // Generate 24 columns mapping half-hours from 9:00 AM IST to 9:00 PM IST (excl 9:00 PM slot end, i.e. 8:30 PM start)
  const hoursList = useMemo(() => {
    const list = [];
    const start = 9; // 9:00 AM IST
    const end = 21;  // 9:00 PM IST (exclusive, i.e. last starts at 8:30 PM)
    for (let t = start; t < end; t += 0.5) {
      const hour = Math.floor(t);
      const minute = (t % 1 === 0) ? 0 : 30;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
      const shortLabel = minute === 30 ? `${displayHour}:30${ampm.toLowerCase().charAt(0)}` : `${displayHour}${ampm.toLowerCase().charAt(0)}`;
      list.push({
        value: t,
        label: label,
        shortLabel: shortLabel
      });
    }
    return list;
  }, []);

  // Compute the overlap windows and calculations for all active countries
  const overlapStats = useMemo(() => {
    const stats = {};

    activeCountries.forEach(country => {
      const overlaps = [];
      let overlapStart = null;
      let overlapEnd = null;

      // Scan in half-hour increments from 0 to 24 IST to find precise overlap slots
      for (let h = 0; h < 24; h += 0.5) {
        const isSdrWorking = h >= SDR_SHIFT.start && h < SDR_SHIFT.end;
        const conv = getConvertedTimes(h, country.timezone);
        const isProspectWorking = conv.hourFraction >= PROSPECT_WORK_HOURS.start && conv.hourFraction < PROSPECT_WORK_HOURS.end;
        const isOverlap = isSdrWorking && isProspectWorking;

        if (isOverlap) {
          overlaps.push(h);
        }
      }

      if (overlaps.length > 0) {
        const minHour = Math.min(...overlaps);
        const maxHour = Math.max(...overlaps) + 0.5; // inclusive boundary (end of the 30-min block)

        const formatHourVal = (val) => {
          const hr = Math.floor(val);
          const min = (val % 1 === 0) ? 0 : 30;
          const ampm = hr >= 12 ? 'PM' : 'AM';
          const displayHr = hr % 12 === 0 ? 12 : hr % 12;
          return `${displayHr}:${min.toString().padStart(2, '0')} ${ampm}`;
        };

        const startConv = getConvertedTimes(minHour, country.timezone);
        const endConv = getConvertedTimes(maxHour, country.timezone);

        overlapStart = formatHourVal(minHour);
        overlapEnd = formatHourVal(maxHour);

        stats[country.id] = {
          hasOverlap: true,
          istWindow: `${overlapStart} - ${overlapEnd} IST`,
          localWindow: `${startConv.formatted} - ${endConv.formatted}`,
          overlapHoursCount: overlaps.length * 0.5,
          startHourIST: minHour,
          endHourIST: maxHour
        };
      } else {
        stats[country.id] = {
          hasOverlap: false,
          istWindow: 'No working overlap',
          localWindow: 'N/A',
          overlapHoursCount: 0
        };
      }
    });

    return stats;
  }, [activeCountries]);

  // Filter country checklist search results
  const searchedCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES_CONFIG;
    return COUNTRIES_CONFIG.filter(c => 
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
      c.description.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  // Group leads matching selected countries
  const activeLeads = useMemo(() => {
    try {
      return leads.filter(l => {
        if (!l || !l.country || typeof l.country !== 'string') return false;
        const matchingConfig = activeCountries.find(ac => 
          l.country.toLowerCase().includes(ac.name.split(' ')[0].toLowerCase()) ||
          ac.name.toLowerCase().includes(l.country.toLowerCase())
        );
        return !!matchingConfig;
      });
    } catch (e) {
      console.error("Error in activeLeads filter:", e);
      return [];
    }
  }, [leads, activeCountries]);

  // Render — try/catch only wraps JSX, no hooks inside
  try {
    return (
      <div className="timecomparison-container">
        {/* View Header */}
        <div className="view-header justify-between">
          <div>
            <h2 className="view-title flex-items-center">
              <Clock className="header-icon text-accent mr-2" size={30} />
              Time Overlap Planner
            </h2>
            <p className="view-description text-muted">
              Compare target countries against your working shift (**10:00 AM - 7:00 PM IST**). Find the best windows to call and pitch.
            </p>
          </div>
          <div className="header-date">
            <Globe size={14} className="mr-1 text-accent-secondary" />
            <span>SDR Shift: 10:00 AM - 19:00 PM IST</span>
          </div>
        </div>

        <div className="timecomparison-grid">
          {/* Left Control Panel: Selector checklist */}
          <div className="timecomparison-control-sidebar">
            <div className="dashboard-section-card">
              <div className="suggester-header mb-1">
                <Sliders size={16} className="text-accent" />
                <span className="suggester-title">Target Countries</span>
              </div>
              
              <div className="search-wrapper mb-2 mt-1 w-100">
                <Search size={14} className="search-icon" />
                <input 
                  type="text" 
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search countries..."
                  className="search-input w-100 font-size-sm py-1-5"
                />
              </div>

              <div className="countries-checklist-wrapper">
                {/* India is always the fixed SDR reference row — shown as locked */}
                <div className="country-select-row-btn active locked-country">
                  <span className="check-box-holder locked">
                    <Pin size={10} className="pin-icon" />
                  </span>
                  <span className="country-flag-icon">🇮🇳</span>
                  <div className="country-details-block">
                    <span className="country-title-name">India (SDR Base)</span>
                    <span className="country-title-desc">Fixed • IST – UTC+5:30</span>
                  </div>
                  <span className="locked-badge">Fixed</span>
                </div>

                {searchedCountries.filter(c => c.id !== 'india').map(c => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleToggleCountry(c.id)}
                      className={`country-select-row-btn ${isSelected ? 'active' : ''}`}
                    >
                      <span className="check-box-holder">
                        {isSelected && <Check size={12} className="check-mark-icon" />}
                      </span>
                      <span className="country-flag-icon">{c.flag}</span>
                      <div className="country-details-block">
                        <span className="country-title-name">{c.name}</span>
                        <span className="country-title-desc">{c.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Info Box */}
            <div className="dashboard-section-card mt-2 info-glass-card">
              <div className="flex-items-center gap-1 mb-1 font-size-sm font-weight-bold text-accent-secondary">
                <Info size={14} />
                <span>Planning Guidelines</span>
              </div>
              <p className="font-size-xs text-muted leading-1-5 m-0">
                SDR Shift is anchored to **10:00 AM - 7:00 PM IST**. Timelines highlight local business hours (**9 AM - 5 PM**) for targets. Green blocks denote mutual overlap times which are most optimal for calling and pitching.
              </p>
            </div>
          </div>

          {/* Right Dashboard: Interactive Timelines Canvas */}
          <div className="timecomparison-canvas">
            
            {/* Empty state when no countries added */}
            {activeCountries.length === 0 && (
              <div className="empty-timecomp-hint">
                <Globe size={40} className="text-accent opacity-40" />
                <h3>No countries added yet</h3>
                <p>Select countries from the panel on the left to compare time zones against your IST shift.</p>
              </div>
            )}

            {/* Timeline Board Card */}
            {activeCountries.length > 0 && <div className="dashboard-section-card overflow-x-auto">
              <h3 className="section-card-title mb-2">Timeline Comparison Board (9:00 AM - 9:00 PM IST)</h3>
              
              <div className="comparison-board-grid">
                {/* Header row: Hours numbers in IST */}
                <div className="comparison-row board-header-row">
                  <div className="row-meta-pane">
                    <span className="col-lbl">Compare Countries</span>
                  </div>
                  <div className="row-timeline-pane">
                    {hoursList.map(h => {
                      const isSdrShift = h.value >= SDR_SHIFT.start && h.value < SDR_SHIFT.end;
                      const isHovered = hoveredHour === h.value;
                      return (
                        <div 
                          key={h.value} 
                          className={`timeline-cell-header ${isSdrShift ? 'in-sdr-shift' : ''} ${isHovered ? 'column-hovered' : ''}`}
                          onMouseEnter={() => setHoveredHour(h.value)}
                          onMouseLeave={() => setHoveredHour(null)}
                        >
                          <span className="lbl-hour-num">{h.shortLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Row 1: SDR IST Reference Shift */}
                <div className="comparison-row sdr-ref-row">
                  <div className="row-meta-pane">
                    <span className="flag-icon-ref">🇮🇳</span>
                    <div className="name-block">
                      <span className="title-bold">SDR Team Shift</span>
                      <span className="subtitle-desc">GMT+5:30 • IST</span>
                      <span className="live-time-text text-accent-secondary mt-1">
                        <span className="live-pulse-dot secondary"></span>
                        {getCountryCurrentTime('Asia/Kolkata')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="row-timeline-pane">
                    {hoursList.map(h => {
                      const isSdrShift = h.value >= SDR_SHIFT.start && h.value < SDR_SHIFT.end;
                      const isHovered = hoveredHour === h.value;
                      return (
                        <div 
                          key={h.value} 
                          className={`timeline-cell sdr-cell ${isSdrShift ? 'shift-active' : ''} ${isHovered ? 'column-hovered' : ''}`}
                          onMouseEnter={() => setHoveredHour(h.value)}
                          onMouseLeave={() => setHoveredHour(null)}
                          title={`SDR Shift Hour: ${h.label} IST`}
                        >
                          {isSdrShift && <span className="cell-active-indicator"></span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rows for target countries — draggable to reorder */}
                {activeCountries.map(country => {
                  const stat = overlapStats[country.id] || {};
                  const isDragOver = dragOverId === country.id;
                  return (
                    <div
                      key={country.id}
                      className={`comparison-row country-comparison-row draggable-row ${isDragOver ? 'drag-over-row' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(country.id)}
                      onDragEnter={() => handleDragEnter(country.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={e => e.preventDefault()}
                    >
                      <div className="row-meta-pane">
                        <span className="drag-handle" title="Drag to reorder">
                          <GripVertical size={14} />
                        </span>
                        <span className="flag-icon-ref">{country.flag}</span>
                        <div className="name-block">
                          <span className="title-bold">{country.name}</span>
                          <span className="subtitle-desc">{country.description}</span>
                          <span className="live-time-text text-accent mt-1">
                            <span className="live-pulse-dot"></span>
                            {getCountryCurrentTime(country.timezone)}
                          </span>
                        </div>
                        <button
                          className="row-remove-btn"
                          title="Remove country"
                          onClick={() => handleToggleCountry(country.id)}
                        >
                          <X size={12} />
                        </button>
                      </div>

                      <div className="row-timeline-pane">
                        {hoursList.map(h => {
                          const isSdrShift = h.value >= SDR_SHIFT.start && h.value < SDR_SHIFT.end;
                          const conv = getConvertedTimes(h.value, country.timezone);
                          
                          const isProspectWorking = conv.hourFraction >= PROSPECT_WORK_HOURS.start && conv.hourFraction < PROSPECT_WORK_HOURS.end;
                          const isOverlap = isSdrShift && isProspectWorking;
                          const isHovered = hoveredHour === h.value;

                          let cellClass = 'idle-cell';
                          if (isOverlap) cellClass = 'overlap-cell';
                          else if (isProspectWorking) cellClass = 'prospect-cell';

                          return (
                            <div 
                              key={h.value} 
                              className={`timeline-cell target-cell ${cellClass} ${isHovered ? 'column-hovered' : ''}`}
                              onMouseEnter={() => setHoveredHour(h.value)}
                              onMouseLeave={() => setHoveredHour(null)}
                              title={`IST: ${h.label} | ${country.name}: ${conv.formatted}`}
                            >
                              <span className="cell-hour-fraction">
                                {conv.hourVal}
                                {conv.minuteVal === 30 && <span className="cell-min-sup">30</span>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Legend details */}
              <div className="timeline-legend-row">
                <div className="legend-item"><span className="legend-box sdr-shift-legend"></span> SDR Shift (10 AM - 7 PM IST)</div>
                <div className="legend-item"><span className="legend-box prospect-work-legend"></span> Target Work Hours (9 AM - 5 PM local)</div>
                <div className="legend-item"><span className="legend-box overlap-legend animate-pulse"></span> Optimal Pitch Overlap (Mutual working hours)</div>
              </div>
            </div>}

            {/* Optimal Calling Window Summaries */}
            {activeCountries.length > 0 && <div className="dashboard-section-card mt-2">
              <h3 className="section-card-title flex-items-center mb-2">
                <Sparkles size={16} className="text-accent-secondary mr-1 animate-pulse" />
                Optimal Pitch Windows (Recommended calling slots)
              </h3>
              
              <div className="optimal-windows-grid">
                {activeCountries.map(country => {
                  const stat = overlapStats[country.id] || {};
                  return (
                    <div key={country.id} className={`optimal-window-card ${stat.hasOverlap ? 'has-overlap' : 'no-overlap'}`}>
                      <div className="window-card-header">
                        <span className="window-flag">{country.flag}</span>
                        <strong>{country.name}</strong>
                      </div>

                      <div className="window-card-body">
                        {stat.hasOverlap ? (
                          <>
                            <div className="window-metric">
                              <span className="lbl">IST Calling Window:</span>
                              <span className="val text-success">{stat.istWindow}</span>
                            </div>
                            <div className="window-metric">
                              <span className="lbl">Target Local Time:</span>
                              <span className="val">{stat.localWindow}</span>
                            </div>
                            <div className="window-overlap-indicator">
                              <span>Overlap count: <strong>{stat.overlapHoursCount} hours</strong></span>
                            </div>
                          </>
                        ) : (
                          <div className="no-overlap-text">
                            <AlertCircle size={14} className="text-danger mr-1" />
                            <span>No overlap during SDR shift. Direct pitch not recommended.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>}

            {/* Selected Countries Leads list */}
            {activeCountries.length > 0 && <div className="dashboard-section-card mt-2">
              <div className="section-card-header m-0 mb-2">
                <h3 className="section-card-title flex-items-center">
                  <Users size={16} className="text-accent mr-1" />
                  Prospects in Selected Countries ({activeLeads.length})
                </h3>
              </div>

              {activeLeads.length === 0 ? (
                <div className="empty-section-state">
                  <span>No leads in the selected countries currently in pipeline. Add some leads or check more countries.</span>
                </div>
              ) : (
                <div className="comparison-leads-table-container">
                  <table className="leads-table-styled">
                    <thead>
                      <tr>
                        <th>Prospect Name</th>
                        <th>Company</th>
                        <th>Country</th>
                        <th>Local Timezone</th>
                        <th>Recommended Call Time (IST)</th>
                        <th>BANT Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLeads.map(lead => {
                        const leadCountry = typeof lead.country === 'string' ? lead.country : '';
                        const countryConfig = COUNTRIES_CONFIG.find(ac => 
                          leadCountry.toLowerCase().includes(ac.name.split(' ')[0].toLowerCase()) ||
                          ac.name.toLowerCase().includes(leadCountry.toLowerCase())
                        );
                        const stats = countryConfig ? overlapStats[countryConfig.id] : null;

                        return (
                          <tr key={lead.id}>
                            <td><strong>{lead.name}</strong></td>
                            <td>{lead.company}</td>
                            <td>
                              <span className="flag-cell-icon mr-1">{countryConfig?.flag || '🌐'}</span>
                              {lead.country}
                            </td>
                            <td className="font-mono text-muted font-size-xs">{countryConfig?.timezone || 'N/A'}</td>
                            <td>
                              {stats && stats.hasOverlap ? (
                                <span className="tag-status-success font-size-xs">{stats.istWindow}</span>
                              ) : (
                                <span className="tag-status-danger font-size-xs">No Shift Overlap</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-pill ${(lead.status || 'New Lead').toLowerCase().replace(/\s+/g, '-')}`}>
                                {lead.status || 'New Lead'}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => navigateTo('leads', lead.id)}
                                className="leads-inspect-mini-btn"
                                title="Inspect Lead Details"
                              >
                                <span>View</span>
                                <ChevronRight size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("TimeComparisonView Render Error:", error);
    return (
      <div style={{ padding: '40px', color: '#ff6b6b', backgroundColor: '#1a1d24', border: '1px solid #ff4444', borderRadius: '8px', margin: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Time Overlap Planner Runtime Error</h2>
        <p style={{ color: '#a0aec0', margin: '10px 0 20px 0' }}>An unexpected error occurred during rendering. Please see details below:</p>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', padding: '15px', backgroundColor: '#0d1117', borderRadius: '4px', color: '#f85149', overflowX: 'auto' }}>
          {error.stack || error.message || String(error)}
        </pre>
      </div>
    );
  }
};
