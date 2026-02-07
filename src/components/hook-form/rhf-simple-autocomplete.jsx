import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';


export default function SimpleAutocomplete({ name, label, disabled, getOptionLabel, options, placeholder, multiple = false }) {
  const { control, setValue } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      disabled={disabled}
      render={({ field: { value }, fieldState: { error } }) => (
        <Autocomplete
          options={options}
          disabled={disabled}
          multiple={multiple}
          getOptionLabel={!!getOptionLabel ? getOptionLabel : (option) => option.name}
          value={multiple ? options.filter((o) => value?.includes(o.id)) : options?.find((o) => o.id == value) || null} // Convert id to object for UI
          isOptionEqualToValue={(option, val) => option.id == val?.id} // Prevent mismatches
          onChange={(event, newValue) =>
            setValue(
              name,
              multiple ? newValue.map((item) => item.id) : newValue?.id || '',
              { shouldValidate: true }
            )
          }
          renderInput={(params) => (
            <TextField
              disabled={disabled}
              {...params}
              label={label}
              placeholder={placeholder}
              error={!!error}
              helperText={error ? error.message : ''}
            />
          )}
        />
      )}
    />
  );
}

SimpleAutocomplete.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  multiple: PropTypes.bool
};
