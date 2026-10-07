import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { useResponsive } from 'src/hooks/use-responsive';

import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

// Static events list
const EVENTS = [
  {
    id: 'ramadan-2026',
    name: 'ramadan',
    nameAr: 'رمضان',
    nameFr: 'Ramadan',
    date: new Date(2026, 1, 18),
    image: '/assets/events/ramadane.webp',
    color: '#9C27B0',
  },
  {
    id: 'eid-fitr-2026',
    name: 'eid_al_fitr',
    nameAr: 'عيد الفطر',
    nameFr: 'Aïd el-Fitr',
    date: new Date(2026, 2, 20),
    image: '/assets/events/eid.png',
    color: '#4CAF50',
  },
  {
    id: 'eid-adha-2026',
    name: 'eid_al_adha',
    nameAr: 'عيد الأضحى',
    nameFr: 'Aïd el-Adha',
    date: new Date(2026, 4, 27),
    image: '/assets/events/eid-adha.png',
    color: '#FF9800',
  },
  {
    id: 'black-friday-2026',
    name: 'black_friday',
    nameAr: 'الجمعة السوداء',
    nameFr: 'Black Friday',
    date: new Date(2026, 10, 27),
    image: '/assets/events/black-friday.png',
    color: '#212121',
  },
  {
    id: 'new-year-2027',
    name: 'new_year',
    nameAr: 'رأس السنة',
    nameFr: 'Nouvel An',
    date: new Date(2026, 11, 31),
    image: '/assets/events/new-year.png',
    color: '#E91E63',
  },
];

// ----------------------------------------------------------------------

function getEventForDate(date) {
  return EVENTS.find(
    (e) =>
      e.date.getFullYear() === date.getFullYear() &&
      e.date.getMonth() === date.getMonth() &&
      e.date.getDate() === date.getDate()
  );
}

// Custom day renderer — highlights event days with a colored dot
function EventDay(props) {
  const { day, outsideCurrentMonth, ...other } = props;
  const { i18n } = useTranslation();
  const event = !outsideCurrentMonth ? getEventForDate(day) : null;

  const label = event
    ? i18n.language === 'ar'
      ? event.nameAr
      : i18n.language === 'fr'
        ? event.nameFr
        : event.name
    : '';

  if (event) {
    return (
      <Tooltip title={label} arrow placement="top">
        <Badge
          overlap="circular"
          badgeContent={
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: event.color,
              }}
            />
          }
        >
          <PickersDay
            {...other}
            day={day}
            outsideCurrentMonth={outsideCurrentMonth}
            sx={{
              bgcolor: alpha(event.color, 0.1),
              color: event.color,
              fontWeight: 700,
              '&:hover': { bgcolor: alpha(event.color, 0.2) },
              '&.Mui-selected': {
                bgcolor: alpha(event.color, 0.2),
                color: event.color,
                '&:hover': { bgcolor: alpha(event.color, 0.3) },
              },
            }}
          />
        </Badge>
      </Tooltip>
    );
  }

  return <PickersDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />;
}

// ----------------------------------------------------------------------

export default function EcommerceEventsCalendar() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const lgUp = useResponsive('up', 'lg');

  const [currentDate, setCurrentDate] = useState(new Date());

  const getEventName = (event) => {
    if (i18n.language === 'ar') return event.nameAr;
    if (i18n.language === 'fr') return event.nameFr;
    return t(event.name);
  };

  // Nearest upcoming event
  const nearestEvent = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return EVENTS.filter((e) => e.date >= now).sort((a, b) => a.date - b.date)[0] || null;
  }, []);

  const daysUntilNearest = useMemo(() => {
    if (!nearestEvent) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const eventStart = new Date(
      nearestEvent.date.getFullYear(),
      nearestEvent.date.getMonth(),
      nearestEvent.date.getDate()
    );
    const diff = Math.ceil((eventStart - now) / (1000 * 60 * 60 * 24));
    return diff <= 0 ? 0 : diff;
  }, [nearestEvent]);

  return (
    <Card
      sx={{
        ...( lgUp ? { height: '100%' } : {}),
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        px: lgUp ? 3 : 2,
        py: lgUp ? 2 : 1.5,
      }}
    >
      {/* MUI DateCalendar */}
      <Box sx={{ overflow: 'hidden' }}>
        <DateCalendar
          value={currentDate}
          onChange={(newDate) => setCurrentDate(newDate)}
          showDaysOutsideCurrentMonth
          {...(lgUp && { fixedWeekNumber: 6 })}
          slots={{ day: EventDay }}
          sx={{
            maxHeight: 'none',
            maxWidth: 'none',
            width: '100%',
            height: lgUp ? undefined : 280,
            '& .MuiDayCalendar-header, & .MuiDayCalendar-weekContainer': {
              justifyContent: 'space-evenly',
            },
            '& .MuiPickersCalendarHeader-root': {
              px: 0,
              mt: 0,
              mb: 0,
              minHeight: lgUp ? 32 : 28,
            },
            '& .MuiPickersCalendarHeader-label': {
              fontSize: lgUp ? '0.85rem' : '0.8rem',
            },
            '& .MuiDayCalendar-weekDayLabel': {
              width: lgUp ? 28 : 32,
              height: lgUp ? 28 : 28,
              fontSize: '0.7rem',
            },
            '& .MuiPickersDay-root': {
              width: lgUp ? 28 : 32,
              height: lgUp ? 28 : 32,
              fontSize: '0.75rem',
            },
            '& .MuiPickersDay-root.Mui-selected': {
              bgcolor: theme.palette.primary.main,
            },
            '& .MuiDayCalendar-slideTransition': {
              minHeight: lgUp ? 180 : 160,
            },
          }}
        />
      </Box>

      {/* Nearest event — compact horizontal strip */}
      {nearestEvent && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            px: 2,
            py: 1,
            borderRadius: 1.5,
            bgcolor: alpha(nearestEvent.color, 0.06),
            border: `1px solid ${alpha(nearestEvent.color, 0.15)}`,
          }}
        >
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
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />

          <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              noWrap
              sx={{
                fontWeight: 700,
                color: nearestEvent.color,
                fontSize: '0.8rem',
                lineHeight: 1.2,
              }}
            >
              {getEventName(nearestEvent)}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'text.secondary', fontSize: '0.7rem', lineHeight: 1.2 }}
            >
              {nearestEvent.date.toLocaleDateString(i18n.language, {
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
          </Stack>

          {daysUntilNearest !== null && (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 0.75,
                bgcolor: alpha(nearestEvent.color, 0.12),
                flexShrink: 0,
              }}
            >
              <Typography
                variant="caption"
                noWrap
                sx={{ fontWeight: 700, color: nearestEvent.color, fontSize: '0.7rem' }}
              >
                {daysUntilNearest === 0
                  ? t('now')
                  : `${daysUntilNearest} ${t('day')}`}
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </Card>
  );
}
