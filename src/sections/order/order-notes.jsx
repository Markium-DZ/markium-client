import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, darken, lighten, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import showError from 'src/utils/show_error';
import { fToNow, fDateTime } from 'src/utils/format-time';
import { useGetOrderNotes, createOrderNote, updateOrderNote, deleteOrderNote } from 'src/api/order-notes';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const COLORS = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];

// One tap adds the note; `fill` ones only prefill the box so the merchant can finish the sentence.
const PRESETS = [
  { key: 'note_preset_no_answer', color: 'red' },
  { key: 'note_preset_call_back', color: 'orange' },
  { key: 'note_preset_confirmed', color: 'green' },
  { key: 'note_preset_address', color: 'blue', fill: true },
];

const MAX_LENGTH = 1000;

function useNoteColor() {
  const theme = useTheme();

  return (color) =>
    ({
      red: theme.palette.error.main,
      orange: '#FF7A00',
      yellow: theme.palette.warning.main,
      green: theme.palette.success.main,
      blue: theme.palette.info.main,
      purple: theme.palette.secondary.main,
    })[color] || theme.palette.grey[500];
}

// ----------------------------------------------------------------------

export default function OrderNotes({ orderId }) {
  const { t, i18n } = useTranslate();
  const { notes, notesLoading, mutate } = useGetOrderNotes(orderId);

  const inputRef = useRef(null);
  const [body, setBody] = useState('');
  const [color, setColor] = useState('default');
  const [saving, setSaving] = useState(false);

  const addNote = async (text, noteColor) => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    try {
      setSaving(true);
      const created = await createOrderNote(orderId, { body: trimmed, color: noteColor });
      await mutate((current) => ({ ...current, data: [created, ...(current?.data || [])] }), { revalidate: false });
      setBody('');
      setColor('default');
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreset = (preset) => {
    const text = t(preset.key);
    if (preset.fill) {
      setBody(`${text} `);
      setColor(preset.color);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    addNote(text, preset.color);
  };

  const replaceNote = (updated) =>
    mutate((current) => ({ ...current, data: (current?.data || []).map((n) => (n.id === updated.id ? updated : n)) }), {
      revalidate: false,
    });

  const removeNote = (noteId) =>
    mutate((current) => ({ ...current, data: (current?.data || []).filter((n) => n.id !== noteId) }), {
      revalidate: false,
    });

  return (
    <Card>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>{t('order_notes')}</span>
            {notes.length > 0 && <Chip size="small" label={notes.length} sx={{ height: 20, fontSize: '0.7rem' }} />}
          </Stack>
        }
        subheader={t('order_notes_private_hint')}
        subheaderTypographyProps={{ variant: 'caption' }}
      />

      <Stack spacing={2} sx={{ p: 3, pt: 2 }}>
        {/* Composer */}
        <Stack spacing={1}>
          {!body && (
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {PRESETS.map((preset) => (
                <PresetChip key={preset.key} preset={preset} label={t(preset.key)} disabled={saving} onClick={() => handlePreset(preset)} />
              ))}
            </Stack>
          )}

          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            minRows={1}
            maxRows={5}
            size="small"
            value={body}
            placeholder={t('order_note_placeholder')}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                addNote(body, color);
              }
            }}
          />

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <ColorPicker value={color} onChange={setColor} />
            <LoadingButton
              size="small"
              variant="contained"
              loading={saving}
              disabled={!body.trim()}
              onClick={() => addNote(body, color)}
              startIcon={<Iconify icon="mingcute:add-line" width={16} />}
            >
              {t('add')}
            </LoadingButton>
          </Stack>
        </Stack>

        {/* List */}
        {!notesLoading && notes.length === 0 && (
          <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', py: 1 }}>
            {t('order_notes_empty')}
          </Typography>
        )}

        {notes.length > 0 && (
          <Stack spacing={1}>
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                orderId={orderId}
                lang={i18n.language}
                onUpdated={replaceNote}
                onDeleted={removeNote}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

OrderNotes.propTypes = {
  orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

// ----------------------------------------------------------------------

function NoteItem({ note, orderId, lang, onUpdated, onDeleted }) {
  const { t } = useTranslate();
  const noteColor = useNoteColor();
  const main = noteColor(note.color);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const [draftColor, setDraftColor] = useState(note.color);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const edited = note.updated_at && note.created_at && new Date(note.updated_at) - new Date(note.created_at) > 1000;

  const startEdit = () => {
    setDraft(note.body);
    setDraftColor(note.color);
    setConfirmDelete(false);
    setEditing(true);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed === note.body && draftColor === note.color) {
      setEditing(false);
      return;
    }
    try {
      setBusy(true);
      onUpdated(await updateOrderNote(orderId, note.id, { body: trimmed, color: draftColor }));
      setEditing(false);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      setBusy(true);
      await deleteOrderNote(orderId, note.id);
      onDeleted(note.id);
    } catch (error) {
      showError(error);
      setBusy(false);
    }
  };

  // Quick color change without entering edit mode
  const recolor = async (newColor) => {
    if (newColor === note.color) return;
    try {
      onUpdated(await updateOrderNote(orderId, note.id, { color: newColor }));
    } catch (error) {
      showError(error);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        px: 1.5,
        py: 1.25,
        borderRadius: 1.5,
        bgcolor: alpha(main, 0.08),
        borderInlineStart: `3px solid ${main}`,
        opacity: busy ? 0.6 : 1,
        transition: 'background-color 0.15s, opacity 0.15s',
        '& .note-actions': { opacity: 1 },
        '@media (hover: hover)': {
          '& .note-actions': { opacity: confirmDelete ? 1 : 0, transition: 'opacity 0.15s' },
          '&:hover .note-actions, &:focus-within .note-actions': { opacity: 1 },
        },
      }}
    >
      {editing ? (
        <Stack spacing={1}>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={1}
            maxRows={6}
            size="small"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                save();
              }
              if (e.key === 'Escape') setEditing(false);
            }}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <ColorPicker value={draftColor} onChange={setDraftColor} />
            <Stack direction="row" spacing={0.5}>
              <Button size="small" color="inherit" onClick={() => setEditing(false)}>
                {t('cancel')}
              </Button>
              <LoadingButton size="small" variant="contained" loading={busy} disabled={!draft.trim()} onClick={save}>
                {t('save')}
              </LoadingButton>
            </Stack>
          </Stack>
        </Stack>
      ) : (
        <>
          <Typography
            variant="body2"
            onDoubleClick={startEdit}
            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', pr: 0.5 }}
          >
            {note.body}
          </Typography>

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 0.75 }}>
            <Stack className="note-actions" direction="row" alignItems="center" spacing={0.25}>
              {confirmDelete ? (
                <>
                  <Button size="small" color="error" variant="soft" onClick={remove} disabled={busy} sx={{ minWidth: 0, px: 1, height: 26 }}>
                    {t('delete')}?
                  </Button>
                  <IconButton size="small" onClick={() => setConfirmDelete(false)} aria-label={t('cancel')}>
                    <Iconify icon="eva:close-fill" width={16} />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton size="small" onClick={startEdit} aria-label={t('edit')}>
                    <Iconify icon="solar:pen-bold" width={15} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setConfirmDelete(true)} aria-label={t('delete')}>
                    <Iconify icon="solar:trash-bin-trash-bold" width={15} />
                  </IconButton>
                  <ColorPicker value={note.color} onChange={recolor} size={12} compact />
                </>
              )}
            </Stack>

            <Tooltip title={fDateTime(note.created_at, 'dd/MM/yyyy HH:mm')} placement="top">
              <Typography variant="caption" sx={{ color: 'text.disabled', whiteSpace: 'nowrap', ml: 'auto' }}>
                {fToNow(note.created_at, lang)}
                {edited && ` · ${t('edited')}`}
              </Typography>
            </Tooltip>
          </Stack>
        </>
      )}
    </Box>
  );
}

NoteItem.propTypes = {
  note: PropTypes.object.isRequired,
  orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  lang: PropTypes.string,
  onUpdated: PropTypes.func.isRequired,
  onDeleted: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function ColorPicker({ value, onChange, size = 18, compact = false }) {
  const { t } = useTranslate();
  const noteColor = useNoteColor();

  return (
    <Stack direction="row" alignItems="center" spacing={compact ? 0.5 : 0.75} role="radiogroup" aria-label={t('note_color')}>
      {COLORS.map((c) => {
        const selected = c === value;
        return (
          <Box
            key={c}
            component="button"
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(`note_color_${c}`)}
            onClick={() => onChange(c)}
            sx={{
              p: 0,
              width: size,
              height: size,
              border: 0,
              cursor: 'pointer',
              borderRadius: '50%',
              bgcolor: noteColor(c),
              boxShadow: (theme) =>
                selected ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${noteColor(c)}` : 'none',
              transition: 'transform 0.1s',
              '&:hover': { transform: 'scale(1.15)' },
            }}
          />
        );
      })}
    </Stack>
  );
}

ColorPicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  size: PropTypes.number,
  compact: PropTypes.bool,
};

// ----------------------------------------------------------------------

function PresetChip({ preset, label, disabled, onClick }) {
  const theme = useTheme();
  const noteColor = useNoteColor();
  const main = noteColor(preset.color);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Chip
      size="small"
      label={preset.fill ? `${label}…` : label}
      disabled={disabled}
      onClick={onClick}
      icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: main, ml: '8px !important' }} />}
      sx={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: isDark ? lighten(main, 0.3) : darken(main, 0.35),
        bgcolor: alpha(main, isDark ? 0.24 : 0.18),
        border: `1px solid ${alpha(main, 0.48)}`,
        '&:hover': { bgcolor: alpha(main, isDark ? 0.36 : 0.28) },
      }}
    />
  );
}

PresetChip.propTypes = {
  preset: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};
