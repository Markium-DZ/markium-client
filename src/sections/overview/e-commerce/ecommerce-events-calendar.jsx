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

// Static events list - dates for 2025
const EVENTS = [
  {
    id: 'ramadan-2025',
    name: 'ramadan',
    nameAr: 'رمضان',
    nameFr: 'Ramadan',
    date: new Date(2025, 11, 1), // March 1, 2025 (start of Ramadan)
    endDate: new Date(2025, 11, 1), // March 30, 2025
    image: '/assets/events/ramadane.png',
    color: '#9C27B0',
  },
  {
    id: 'eid-fitr-2025',
    name: 'eid_al_fitr',
    nameAr: 'عيد الفطر',
    nameFr: 'Aïd el-Fitr',
    date: new Date(2025, 2, 30), // March 30, 2025
    endDate: new Date(2025, 3, 2), // April 2, 2025
    image: '/assets/events/eid.png',
    color: '#4CAF50',
  },
  {
    id: 'eid-adha-2025',
    name: 'eid_al_adha',
    nameAr: 'عيد الأضحى',
    nameFr: 'Aïd el-Adha',
    date: new Date(2025, 5, 6), // June 6, 2025
    endDate: new Date(2025, 5, 10), // June 10, 2025
    image: '/assets/events/eid-adha.png',
    color: '#FF9800',
  },
  {
    id: 'black-friday-2025',
    name: 'black_friday',
    nameAr: 'الجمعة السوداء',
    nameFr: 'Black Friday',
    date: new Date(2025, 10, 28), // November 28, 2025
    endDate: new Date(2025, 10, 28),
    image: '/assets/events/black-friday.png',
    color: '#212121',
  },
  {
    id: 'new-year-2026',
    name: 'new_year',
    nameAr: 'رأس السنة',
    nameFr: 'Nouvel An',
    date: new Date(2025, 11, 31), // December 31, 2025
    endDate: new Date(2026, 0, 1), // January 1, 2026
    image: '/assets/events/new-year.png',
    color: '#E91E63',
  },
];

// ----------------------------------------------------------------------

export default function EcommerceEventsCalendar() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Adjust first day for RTL (Saturday as first day in Arabic)
  const adjustedFirstDay = isRTL ? (firstDayOfMonth + 1) % 7 : firstDayOfMonth;

  // Get month name (using existing short translations)
  const monthNames = [
    t('jan'), t('feb'), t('mar'), t('apr'),
    t('may'), t('jun'), t('jul'), t('aug'),
    t('sep'), t('oct'), t('nov'), t('dec')
  ];

  // Day names
  const dayNames = isRTL
    ? [t('sat'), t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri')]
    : [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

  // Get events for current month
  const monthEvents = useMemo(() => {
    return EVENTS.filter((event) => {
      const eventMonth = event.date.getMonth();
      const eventYear = event.date.getFullYear();
      const endMonth = event.endDate?.getMonth() || eventMonth;
      const endYear = event.endDate?.getFullYear() || eventYear;

      // Check if event spans across current month
      return (
        (eventYear === year && eventMonth === month) ||
        (endYear === year && endMonth === month) ||
        (eventYear === year && eventMonth < month && endYear === year && endMonth >= month)
      );
    });
  }, [year, month]);

  // Check if a day has an event
  const getEventForDay = (day) => {
    const checkDate = new Date(year, month, day);
    return EVENTS.find((event) => {
      const eventStart = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
      const eventEnd = event.endDate
        ? new Date(event.endDate.getFullYear(), event.endDate.getMonth(), event.endDate.getDate())
        : eventStart;
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventName = (event) => {
    if (i18n.language === 'ar') return event.nameAr;
    if (i18n.language === 'fr') return event.nameFr;
    return t(event.name);
  };

  // Generate calendar days
  const calendarDays = [];

  // Empty cells for days before first day of month
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <Card
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <IconButton size="small" onClick={handlePrevMonth}>
          <Iconify icon={isRTL ? "eva:arrow-ios-forward-fill" : "eva:arrow-ios-back-fill"} />
        </IconButton>

        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {monthNames[month]} {year}
        </Typography>

        <IconButton size="small" onClick={handleNextMonth}>
          <Iconify icon={isRTL ? "eva:arrow-ios-back-fill" : "eva:arrow-ios-forward-fill"} />
        </IconButton>
      </Stack>

      {/* Day names header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          mb: 1,
        }}
      >
        {dayNames.map((day, index) => (
          <Typography
            key={index}
            variant="caption"
            sx={{
              textAlign: 'center',
              fontWeight: 600,
              color: 'text.secondary',
              fontSize: '0.65rem',
            }}
          >
            {day}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          flexGrow: 1,
        }}
      >
        {calendarDays.map((day, index) => {
          const event = day ? getEventForDay(day) : null;
          const todayDate = isToday(day);

          return (
            <Tooltip
              key={index}
              title={event ? getEventName(event) : ''}
              arrow
              placement="top"
              TransitionComponent={Fade}
              TransitionProps={{ timeout: 300 }}
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: event?.color || 'grey.800',
                    '& .MuiTooltip-arrow': {
                      color: event?.color || 'grey.800',
                    },
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.75,
                  },
                },
              }}
            >
              <Box
                onMouseEnter={() => event && setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
                sx={{
                  position: 'relative',
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  cursor: event ? 'pointer' : 'default',
                  transition: 'all 0.2s ease-in-out',
                  ...(day && {
                    bgcolor: event
                      ? alpha(event.color, 0.15)
                      : todayDate
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'transparent',
                    border: todayDate
                      ? `2px solid ${theme.palette.primary.main}`
                      : event
                      ? `1px solid ${alpha(event.color, 0.3)}`
                      : '1px solid transparent',
                    '&:hover': event
                      ? {
                          bgcolor: alpha(event.color, 0.25),
                          transform: 'scale(1.1)',
                          boxShadow: `0 4px 12px ${alpha(event.color, 0.3)}`,
                        }
                      : {},
                  }),
                }}
              >
                {day && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: event ? 700 : todayDate ? 700 : 500,
                      color: event
                        ? event.color
                        : todayDate
                        ? 'primary.main'
                        : 'text.primary',
                      fontSize: '0.7rem',
                    }}
                  >
                    {day}
                  </Typography>
                )}

                {/* Event indicator dot */}
                {event && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4,
                      height: 4,
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

      {/* Event preview on hover */}
      <Box
        sx={{
          mt: 2,
          minHeight: 80,
          borderRadius: 1.5,
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          ...(hoveredEvent
            ? {
                bgcolor: alpha(hoveredEvent.color, 0.1),
                border: `1px solid ${alpha(hoveredEvent.color, 0.3)}`,
              }
            : {
                bgcolor: alpha(theme.palette.grey[500], 0.04),
                border: `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
              }),
        }}
      >
        {hoveredEvent ? (
          <Stack direction="row" spacing={1.5} sx={{ p: 1.5, height: '100%' }}>
            <Box
              component="img"
              src={hoveredEvent.image}
              alt={getEventName(hoveredEvent)}
              sx={{
                width: 60,
                height: 60,
                borderRadius: 1,
                objectFit: 'cover',
                boxShadow: `0 2px 8px ${alpha(hoveredEvent.color, 0.3)}`,
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Stack spacing={0.5} justifyContent="center" sx={{ flexGrow: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: hoveredEvent.color }}
              >
                {getEventName(hoveredEvent)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {hoveredEvent.date.toLocaleDateString(i18n.language, {
                  month: 'short',
                  day: 'numeric',
                })}
                {hoveredEvent.endDate && hoveredEvent.endDate > hoveredEvent.date && (
                  <>
                    {' - '}
                    {hoveredEvent.endDate.toLocaleDateString(i18n.language, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </>
                )}
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: '100%', py: 2 }}
          >
            <Iconify
              icon="solar:calendar-bold-duotone"
              width={24}
              sx={{ color: 'text.disabled', mb: 0.5 }}
            />
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {monthEvents.length > 0
                ? t('hover_to_see_events')
                : t('no_events_this_month')}
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Events list for current month */}
      {/* {monthEvents.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: 1.5 }}>
          {monthEvents.map((event) => (
            <Stack
              key={event.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                p: 0.75,
                borderRadius: 0.75,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(event.color, 0.1),
                },
              }}
              onMouseEnter={() => setHoveredEvent(event)}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: event.color,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: '0.7rem',
                }}
                noWrap
              >
                {getEventName(event)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )} */}
    </Card>
  );
}
