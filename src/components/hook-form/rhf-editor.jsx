import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import FormHelperText from '@mui/material/FormHelperText';

import Editor from '../editor';

// ----------------------------------------------------------------------

export default function RHFEditor({ name, helperText, ...other }) {
  const {
    control,
  } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Editor
          id={name}
          value={field.value || ''}
          onChange={(content) => {
            field.onChange(content);
          }}
          onBlur={field.onBlur}
          error={!!error}
          helperText={
            (!!error || helperText) && (
              <FormHelperText error={!!error} sx={{ px: 2 }}>
                {error ? error?.message : helperText}
              </FormHelperText>
            )
          }
          {...other}
        />
      )}
    />
  );
}

RHFEditor.propTypes = {
  helperText: PropTypes.string,
  name: PropTypes.string,
};
