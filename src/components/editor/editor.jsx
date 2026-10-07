import { useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

import { alpha, useTheme } from '@mui/material/styles';
import FormHelperText from '@mui/material/FormHelperText';

import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

import {
  RichTextEditor,
  LinkBubbleMenuHandler,
  MenuControlsContainer,
  MenuSelectHeading,
  MenuDivider,
  MenuButtonBold,
  MenuButtonItalic,
  MenuButtonUnderline,
  MenuButtonStrikethrough,
  MenuButtonOrderedList,
  MenuButtonBulletedList,
  MenuButtonBlockquote,
  MenuButtonEditLink,
  MenuButtonAlignLeft,
  MenuButtonAlignCenter,
  MenuButtonAlignRight,
  MenuButtonAlignJustify,
  MenuButtonRemoveFormatting,
  LinkBubbleMenu,
} from 'mui-tiptap';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export default function Editor({
  id = 'minimal-tiptap',
  error,
  value,
  onChange,
  onBlur,
  simple = false,
  helperText,
  sx,
  ...other
}) {
  const { t } = useTranslate();
  const theme = useTheme();
  const isRTL = theme.direction === 'rtl';
  const rteRef = useRef(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      LinkExtension.configure({
        autolink: true,
        openOnClick: false,
      }),
      ImageExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: t('editor_placeholder'),
      }),
      LinkBubbleMenuHandler,
    ],
    [t]
  );

  const handleUpdate = useCallback(
    ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        // TipTap returns '<p></p>' for empty content — normalize to empty string
        onChange(html === '<p></p>' ? '' : html);
      }
    },
    [onChange]
  );

  const handleBlur = useCallback(
    ({ editor }) => {
      if (onBlur) {
        onBlur();
      }
    },
    [onBlur]
  );

  const renderControls = useCallback(
    () => (
      <MenuControlsContainer>
        <MenuSelectHeading
          labels={{
            paragraph: t('normal_text'),
            heading1: t('heading_level', { level: 1 }),
            heading2: t('heading_level', { level: 2 }),
            heading3: t('heading_level', { level: 3 }),
            heading4: t('heading_level', { level: 4 }),
            heading5: t('heading_level', { level: 5 }),
            heading6: t('heading_level', { level: 6 }),
          }}
        />

        <MenuDivider />

        <MenuButtonBold />
        <MenuButtonItalic />
        <MenuButtonUnderline />
        <MenuButtonStrikethrough />

        {!simple && (
          <>
            <MenuDivider />
            <MenuButtonAlignLeft />
            <MenuButtonAlignCenter />
            <MenuButtonAlignRight />
            <MenuButtonAlignJustify />
          </>
        )}

        <MenuDivider />

        <MenuButtonOrderedList />
        <MenuButtonBulletedList />

        {!simple && (
          <>
            <MenuDivider />
            <MenuButtonBlockquote />
            <MenuButtonEditLink />
          </>
        )}

        <MenuDivider />
        <MenuButtonRemoveFormatting />
      </MenuControlsContainer>
    ),
    [simple]
  );

  return (
    <>
      <RichTextEditor
        ref={rteRef}
        extensions={extensions}
        content={value || ''}
        onUpdate={handleUpdate}
        onBlur={handleBlur}
        textDirection={isRTL ? 'rtl' : 'ltr'}
        editorDependencies={[isRTL]}
        renderControls={renderControls}
        RichTextFieldProps={{
          variant: 'outlined',
        }}
        sx={{
          '& .MuiTiptap-FieldContainer-root': {
            borderColor: error
              ? theme.palette.error.main
              : alpha(theme.palette.grey[500], 0.2),
          },
          '& .ProseMirror': {
            minHeight: 160,
            maxHeight: 640,
            overflow: 'auto',
            ...(error && {
              bgcolor: alpha(theme.palette.error.main, 0.08),
            }),
          },
          ...sx,
        }}
      >
        {() => <LinkBubbleMenu />}
      </RichTextEditor>

      {helperText && helperText}
    </>
  );
}

Editor.propTypes = {
  error: PropTypes.bool,
  helperText: PropTypes.object,
  id: PropTypes.string,
  simple: PropTypes.bool,
  sx: PropTypes.object,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
};
