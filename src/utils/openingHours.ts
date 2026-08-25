/**
 * Operating Hours Utilities
 * Handles parsing, default generation, and open/closed status calculation for establishments.
 */

export const DEFAULT_CATEGORY_HOURS: Record<string, string[]> = {
  'Padaria': [
    'segunda-feira: 06:00 – 22:00',
    'terça-feira: 06:00 – 22:00',
    'quarta-feira: 06:00 – 22:00',
    'quinta-feira: 06:00 – 22:00',
    'sexta-feira: 06:00 – 22:30',
    'sábado: 06:00 – 22:30',
    'domingo: 06:30 – 21:00',
  ],
  'Restaurante': [
    'segunda-feira: 11:30 – 15:00, 18:30 – 23:00',
    'terça-feira: 11:30 – 15:00, 18:30 – 23:00',
    'quarta-feira: 11:30 – 15:00, 18:30 – 23:00',
    'quinta-feira: 11:30 – 15:00, 18:30 – 23:30',
    'sexta-feira: 11:30 – 15:00, 18:30 – 00:00',
    'sábado: 11:30 – 00:00',
    'domingo: 11:30 – 22:00',
  ],
  'Cafeteria': [
    'segunda-feira: 07:30 – 20:00',
    'terça-feira: 07:30 – 20:00',
    'quarta-feira: 07:30 – 20:00',
    'quinta-feira: 07:30 – 20:00',
    'sexta-feira: 07:30 – 20:30',
    'sábado: 08:00 – 20:00',
    'domingo: 08:30 – 18:00',
  ],
  'Supermercado': [
    'segunda-feira: 07:00 – 22:00',
    'terça-feira: 07:00 – 22:00',
    'quarta-feira: 07:00 – 22:00',
    'quinta-feira: 07:00 – 22:00',
    'sexta-feira: 07:00 – 22:00',
    'sábado: 07:00 – 22:00',
    'domingo: 08:00 – 20:00',
  ],
  'Farmácia': [
    'segunda-feira: 07:00 – 23:00',
    'terça-feira: 07:00 – 23:00',
    'quarta-feira: 07:00 – 23:00',
    'quinta-feira: 07:00 – 23:00',
    'sexta-feira: 07:00 – 23:00',
    'sábado: 07:00 – 23:00',
    'domingo: 08:00 – 22:00',
  ],
  'Shopping': [
    'segunda-feira: 10:00 – 22:00',
    'terça-feira: 10:00 – 22:00',
    'quarta-feira: 10:00 – 22:00',
    'quinta-feira: 10:00 – 22:00',
    'sexta-feira: 10:00 – 22:00',
    'sábado: 10:00 – 22:00',
    'domingo: 14:00 – 20:00',
  ],
  'Boate': [
    'segunda-feira: Fechado',
    'terça-feira: Fechado',
    'quarta-feira: 22:00 – 05:00',
    'quinta-feira: 22:00 – 05:00',
    'sexta-feira: 22:00 – 06:00',
    'sábado: 22:00 – 06:00',
    'domingo: 18:00 – 02:00',
  ],
  'Outros': [
    'segunda-feira: 08:00 – 18:00',
    'terça-feira: 08:00 – 18:00',
    'quarta-feira: 08:00 – 18:00',
    'quinta-feira: 08:00 – 18:00',
    'sexta-feira: 08:00 – 18:00',
    'sábado: 08:00 – 14:00',
    'domingo: Fechado',
  ],
};

/**
 * Returns a complete 7-day schedule for a place based on its category and name.
 */
export function getDefaultOpeningHoursForCategory(category?: string, name?: string): string[] {
  const cat = (category || '').trim();
  const n = (name || '').toLowerCase();

  if (n.includes('24h') || n.includes('24 horas') || n.includes('24 hs')) {
    return [
      'segunda-feira: Aberto 24 horas',
      'terça-feira: Aberto 24 horas',
      'quarta-feira: Aberto 24 horas',
      'quinta-feira: Aberto 24 horas',
      'sexta-feira: Aberto 24 horas',
      'sábado: Aberto 24 horas',
      'domingo: Aberto 24 horas',
    ];
  }

  if (n.includes('bar') || n.includes('boteco') || n.includes('pub') || n.includes('chopperia') || n.includes('cantina')) {
    return [
      'segunda-feira: Fechado',
      'terça-feira: 17:00 – 00:00',
      'quarta-feira: 17:00 – 00:00',
      'quinta-feira: 17:00 – 01:00',
      'sexta-feira: 17:00 – 02:00',
      'sábado: 16:00 – 02:00',
      'domingo: 15:00 – 22:30',
    ];
  }

  if (n.includes('taqueria') || n.includes('mexican') || n.includes('guacamole') || n.includes('tacacá') || n.includes('maniçoba')) {
    return [
      'segunda-feira: 12:00 – 15:00, 18:30 – 23:30',
      'terça-feira: 12:00 – 15:00, 18:30 – 23:30',
      'quarta-feira: 12:00 – 15:00, 18:30 – 23:30',
      'quinta-feira: 12:00 – 15:00, 18:30 – 00:00',
      'sexta-feira: 12:00 – 15:30, 18:30 – 01:00',
      'sábado: 12:00 – 01:00',
      'domingo: 12:00 – 22:30',
    ];
  }

  if (cat && DEFAULT_CATEGORY_HOURS[cat]) {
    return DEFAULT_CATEGORY_HOURS[cat];
  }

  // Check matching category keywords
  if (cat.includes('Padaria') || n.includes('padaria')) return DEFAULT_CATEGORY_HOURS['Padaria'];
  if (cat.includes('Cafeteria') || n.includes('café') || n.includes('cafe')) return DEFAULT_CATEGORY_HOURS['Cafeteria'];
  if (cat.includes('Supermercado') || n.includes('mercado')) return DEFAULT_CATEGORY_HOURS['Supermercado'];
  if (cat.includes('Farmácia') || n.includes('drogaria')) return DEFAULT_CATEGORY_HOURS['Farmácia'];
  if (cat.includes('Boate') || n.includes('balada') || n.includes('club')) return DEFAULT_CATEGORY_HOURS['Boate'];
  if (cat.includes('Shopping')) return DEFAULT_CATEGORY_HOURS['Shopping'];
  if (cat.includes('Restaurante') || n.includes('restaurante') || n.includes('churrascaria') || n.includes('pizzaria')) {
    return DEFAULT_CATEGORY_HOURS['Restaurante'];
  }

  return DEFAULT_CATEGORY_HOURS['Restaurante'];
}

const PORTUGUESE_DAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

const ENGLISH_DAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export interface WeekdayScheduleItem {
  dayName: string;
  hours: string;
  isToday: boolean;
  isClosed: boolean;
}

/**
 * Returns structured weekday schedules with today flagged.
 */
export function getWeekdaySchedules(openingHours?: string[]): WeekdayScheduleItem[] {
  if (!openingHours || openingHours.length === 0) {
    return [];
  }

  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const currentPtDay = PORTUGUESE_DAYS[currentDayIndex];
  const currentEnDay = ENGLISH_DAYS[currentDayIndex];

  return openingHours.map((entry, index) => {
    let dayName = '';
    let hours = '';

    if (entry.includes(': ')) {
      const parts = entry.split(': ');
      dayName = parts[0].trim();
      hours = parts.slice(1).join(': ').trim();
    } else if (entry.includes(':')) {
      const colonIdx = entry.indexOf(':');
      dayName = entry.substring(0, colonIdx).trim();
      hours = entry.substring(colonIdx + 1).trim();
    } else {
      dayName = `Dia ${index + 1}`;
      hours = entry;
    }

    const dayLower = dayName.toLowerCase();
    const isToday = 
      dayLower.includes(currentPtDay) || 
      dayLower.includes(currentEnDay) || 
      (index === (currentDayIndex === 0 ? 6 : currentDayIndex - 1) && !dayLower.includes('feira') && !dayLower.includes('day'));

    const isClosed = hours.toLowerCase().includes('fechado') || hours.toLowerCase().includes('closed');

    return {
      dayName,
      hours,
      isToday,
      isClosed,
    };
  });
}

export interface OpeningStatusResult {
  isOpen: boolean;
  badgeText: string;
  statusText: string;
  detailText: string;
  statusColor: 'emerald' | 'rose' | 'amber' | 'slate';
  badgeColor: 'emerald' | 'rose' | 'amber' | 'slate';
  todaySchedule: string;
}

/**
 * Calculates current open/closed status from opening hours schedule.
 */
export function getOpeningStatus(openingHours?: string[]): OpeningStatusResult {
  if (!openingHours || openingHours.length === 0) {
    return {
      isOpen: true,
      badgeText: 'Horário sob consulta',
      statusText: 'Aberto',
      detailText: 'Consulte o estabelecimento',
      statusColor: 'slate',
      badgeColor: 'slate',
      todaySchedule: 'Horário não informado',
    };
  }

  const schedules = getWeekdaySchedules(openingHours);
  const todaySchedule = schedules.find((s) => s.isToday) || schedules[0];

  if (!todaySchedule) {
    return {
      isOpen: true,
      badgeText: 'Aberto',
      statusText: 'Aberto',
      detailText: 'Funcionamento normal',
      statusColor: 'emerald',
      badgeColor: 'emerald',
      todaySchedule: 'Aberto hoje',
    };
  }

  const hoursStr = todaySchedule.hours.toLowerCase();

  if (hoursStr.includes('fechado') || hoursStr.includes('closed')) {
    return {
      isOpen: false,
      badgeText: 'Fechado hoje',
      statusText: 'Fechado',
      detailText: 'Não abre hoje',
      statusColor: 'rose',
      badgeColor: 'rose',
      todaySchedule: 'Fechado hoje',
    };
  }

  if (hoursStr.includes('24 horas') || hoursStr.includes('24 hours') || hoursStr.includes('aberto 24h')) {
    return {
      isOpen: true,
      badgeText: 'Aberto 24 Horas',
      statusText: 'Aberto 24h',
      detailText: 'Funciona 24 horas ininterruptas',
      statusColor: 'emerald',
      badgeColor: 'emerald',
      todaySchedule: '24 Horas',
    };
  }

  // Parse time intervals like "11:30 – 15:00, 18:30 – 23:00" or "08:00 – 22:00"
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Extract all time ranges
  const rangeRegex = /(\d{1,2}):(\d{2})\s*(?:–|-|to|até)\s*(\d{1,2}):(\d{2})/g;
  let match;
  let isOpenNow = false;
  let closingSoon = false;
  let nextOpenTime = '';
  let closeTime = '';

  const intervals: { start: number; end: number; startStr: string; endStr: string }[] = [];

  while ((match = rangeRegex.exec(hoursStr)) !== null) {
    const startH = parseInt(match[1], 10);
    const startM = parseInt(match[2], 10);
    const endH = parseInt(match[3], 10);
    const endM = parseInt(match[4], 10);

    const startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;

    // Handle overnight shifts like 22:00 - 05:00 (endTotal < startTotal)
    if (endTotal <= startTotal) {
      endTotal += 24 * 60;
    }

    intervals.push({
      start: startTotal,
      end: endTotal,
      startStr: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
      endStr: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
    });
  }

  if (intervals.length > 0) {
    // Check if current time is within any interval
    for (const interval of intervals) {
      let nowAdjusted = currentMinutes;
      // If interval goes past midnight and current time is early morning
      if (interval.end > 24 * 60 && currentMinutes < interval.start && currentMinutes < (interval.end - 24 * 60)) {
        nowAdjusted += 24 * 60;
      }

      if (nowAdjusted >= interval.start && nowAdjusted < interval.end) {
        isOpenNow = true;
        closeTime = interval.endStr;
        const minutesLeft = interval.end - nowAdjusted;
        if (minutesLeft <= 60 && minutesLeft > 0) {
          closingSoon = true;
        }
        break;
      } else if (nowAdjusted < interval.start && (!nextOpenTime || interval.startStr < nextOpenTime)) {
        nextOpenTime = interval.startStr;
      }
    }
  } else {
    // Fallback if parsing didn't find standard ranges
    return {
      isOpen: true,
      badgeText: 'Aberto',
      statusText: 'Aberto',
      detailText: todaySchedule.hours,
      statusColor: 'emerald',
      badgeColor: 'emerald',
      todaySchedule: todaySchedule.hours,
    };
  }

  if (isOpenNow) {
    if (closingSoon) {
      return {
        isOpen: true,
        badgeText: 'Fecha em breve',
        statusText: 'Fecha em breve',
        detailText: `Fecha hoje às ${closeTime}`,
        statusColor: 'amber',
        badgeColor: 'amber',
        todaySchedule: todaySchedule.hours,
      };
    }
    return {
      isOpen: true,
      badgeText: 'Aberto agora',
      statusText: 'Aberto agora',
      detailText: closeTime ? `Fecha às ${closeTime}` : 'Aberto para atendimento',
      statusColor: 'emerald',
      badgeColor: 'emerald',
      todaySchedule: todaySchedule.hours,
    };
  } else {
    return {
      isOpen: false,
      badgeText: 'Fechado agora',
      statusText: 'Fechado agora',
      detailText: nextOpenTime ? `Abre hoje às ${nextOpenTime}` : (todaySchedule.hours ? `Horário: ${todaySchedule.hours}` : 'Fechado neste horário'),
      statusColor: 'rose',
      badgeColor: 'rose',
      todaySchedule: todaySchedule.hours || 'Fechado',
    };
  }
}
