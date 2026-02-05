import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslation } from 'react-i18next';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

// Static events list — single-day events only
const EVENTS = [
  {
    id: 'ramadan-2026',
    name: 'ramadan',
    nameAr: 'رمضان',
    nameFr: 'Ramadan',
    date: new Date(2026, 1, 18),  // Feb 18, 2026
    image: '/assets/events/ramadane.webp',
    color: '#9C27B0',
  },
  {
    id: 'eid-fitr-2026',
    name: 'eid_al_fitr',
    nameAr: 'عيد الفطر',
    nameFr: 'Aïd el-Fitr',
    date: new Date(2026, 2, 20),  // Mar 20, 2026
    image: '/assets/events/eid.png',
    color: '#4CAF50',
  },
  {
    id: 'eid-adha-2026',
    name: 'eid_al_adha',
    nameAr: 'عيد الأضحى',
    nameFr: 'Aïd el-Adha',
    date: new Date(2026, 4, 27),  // May 27, 2026
    image: '/assets/events/eid-adha.png',
    color: '#FF9800',
  },
  {
    id: 'black-friday-2026',
    name: 'black_friday',
    nameAr: 'الجمعة السوداء',
    nameFr: 'Black Friday',
    date: new Date(2026, 10, 27), // Nov 27, 2026
    image: '/assets/events/black-friday.png',
    color: '#212121',
  },
  {
    id: 'new-year-2027',
    name: 'new_year',
    nameAr: 'رأس السنة',
    nameFr: 'Nouvel An',
    date: new Date(2026, 11, 31), // Dec 31, 2026
    image: '/assets/events/new-year.png',
    color: '#E91E63',
  },
];

const TOTAL_CELLS = 42; // 6 rows × 7 cols — fixed height

// ----------------------------------------------------------------------

export default function EcommerceEventsCalendar() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    t('jan'), t('feb'), t('mar'), t('apr'),
    t('may'), t('jun'), t('jul'), t('aug'),
    t('sep'), t('oct'), t('nov'), t('dec'),
  ];

  const dayNames = isRTL
    ? [t('sat'), t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri')]
    : [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

  // Build fixed 42-cell grid with prev/next month fillers
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const adjustedFirstDay = isRTL ? (firstDayOfMonth + 1) % 7 : firstDayOfMonth;
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];

    // Previous month filler days
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, type: 'prev' });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, type: 'current' });
    }

    // Next month filler days
    let nextDay = 1;
    while (cells.length < TOTAL_CELLS) {
      cells.push({ day: nextDay++, type: 'next' });
    }

    return cells;
  }, [year, month, isRTL]);

  // Check if a day has an event (only for current month days)
  const getEventForDay = (day) =>
    EVENTS.find((e) =>
      e.date.getFullYear() === year && e.date.getMonth() === month && e.date.getDate() === day
    );

  const getEventName = (event) => {
    if (i18n.language === 'ar') return event.nameAr;
    if (i18n.language === 'fr') return event.nameFr;
    return t(event.name);
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Nearest upcoming event
  const nearestEvent = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return EVENTS
      .filter((e) => e.date >= now)
      .sort((a, b) => a.date - b.date)[0] || null;
  }, []);

  const daysUntilNearest = useMemo(() => {
    if (!nearestEvent) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const eventStart = new Date(nearestEvent.date.getFullYear(), nearestEvent.date.getMonth(), nearestEvent.date.getDate());
    const diff = Math.ceil((eventStart - now) / (1000 * 60 * 60 * 24));
    return diff <= 0 ? 0 : diff;
  }, [nearestEvent]);

  return (
    <Card
      sx={{
        p: 1.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
      }}
    >
      {/* Body: Calendar + Nearest Event side by side */}
      <Stack direction="row" spacing={1.5} sx={{ flexGrow: 1 }}>
        {/* Calendar column */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {/* Header — bound to calendar width */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <IconButton size="small" onClick={handlePrevMonth}>
              <Iconify icon={isRTL ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-back-fill'} width={18} />
            </IconButton>

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {monthNames[month]} {year}
            </Typography>

            <IconButton size="small" onClick={handleNextMonth}>
              <Iconify icon={isRTL ? 'eva:arrow-ios-back-fill' : 'eva:arrow-ios-forward-fill'} width={18} />
            </IconButton>
          </Stack>
          {/* Day names */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
            {dayNames.map((name, i) => (
              <Typography
                key={i}
                variant="caption"
                sx={{
                  textAlign: 'center',
                  fontWeight: 600,
                  color: 'text.disabled',
                  fontSize: '0.6rem',
                }}
              >
                {name}
              </Typography>
            ))}
          </Box>

          {/* Fixed 6-row grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
            {calendarCells.map((cell, index) => {
              const isCurrent = cell.type === 'current';
              const event = isCurrent ? getEventForDay(cell.day) : null;
              const todayDate = isCurrent && isToday(cell.day);

              const tooltipTitle = event ? getEventName(event) : '';

              return (
                <Tooltip
                  key={index}
                  title={tooltipTitle}
                  arrow
                  placement="top"
                  TransitionComponent={Fade}
                  TransitionProps={{ timeout: 200 }}
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: event?.color || 'grey.800',
                        '& .MuiTooltip-arrow': { color: event?.color || 'grey.800' },
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        px: 1,
                        py: 0.5,
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 0.5,
                      cursor: event ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                      ...(event && {
                        bgcolor: alpha(event.color, 0.12),
                        '&:hover': { bgcolor: alpha(event.color, 0.22) },
                      }),
                      ...(todayDate && !event && {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        border: `1.5px solid ${theme.palette.primary.main}`,
                      }),
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        lineHeight: 1,
                        fontWeight: (event || todayDate) ? 700 : 400,
                        color: !isCurrent
                          ? 'text.disabled'
                          : event
                          ? event.color
                          : todayDate
                          ? 'primary.main'
                          : 'text.primary',
                      }}
                    >
                      {cell.day}
                    </Typography>

                    {/* Event dot */}
                    {event && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 1,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 3,
                          height: 3,
                          borderRadius: '50%',
                          bgcolor: event.color,
                        }}
                      />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>

        {/* Nearest event sidebar */}
        {nearestEvent && (
          <Stack
            spacing={1}
            sx={{
              width: 120,
              flexShrink: 0,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: alpha(nearestEvent.color, 0.06),
              border: `1px solid ${alpha(nearestEvent.color, 0.15)}`,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.6rem', textAlign: 'center' }}>
              {t('next_event')}
            </Typography>

            {/* Body — centered in remaining space */}
            <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ flexGrow: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                component="img"
                src={nearestEvent.image}
                alt={getEventName(nearestEvent)}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  objectFit: 'cover',
                  flexShrink: 0,
                  boxShadow: `0 2px 6px ${alpha(nearestEvent.color, 0.25)}`,
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: nearestEvent.color, lineHeight: 1.2, fontSize: '0.65rem' }}
                  noWrap
                >
                  {getEventName(nearestEvent)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', lineHeight: 1.2 }}>
                  {nearestEvent.date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                </Typography>
              </Stack>
            </Stack>

            {/* Countdown badge */}
            {daysUntilNearest !== null && (
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 0.75,
                  bgcolor: alpha(nearestEvent.color, 0.12),
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: nearestEvent.color, fontSize: '0.6rem' }}
                >
                  {daysUntilNearest === 0 ? t('now') : `${t('remaining')} ${daysUntilNearest} ${t('day')}`}
                </Typography>
              </Box>
            )}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
