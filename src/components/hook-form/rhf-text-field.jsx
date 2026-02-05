import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';
import TextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

function convertToLatinNumbers(input) {
  if (!input) return input; // Return as-is if input is empty or undefined

  return input.toString().replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
}

export default function RHFTextField({ name, helperText, type, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          fullWidth
          type={type}
          value={field.value || ''} // Ensure controlled component
          onChange={(event) => {
            let newValue = event.target.value;

            if (type === 'number') {
              newValue = convertToLatinNumbers(newValue); // Convert Arabic numbers to Latin
              newValue = newValue ? Number(newValue) : ''; // Prevent NaN
            }

            field.onChange(newValue);
          }}
          error={!!error}
          helperText={error ? error?.message : helperText}
          inputProps={{
            'aria-invalid': !!error,
            ...(error && { 'aria-describedby': `${name}-error` }),
          }}
          FormHelperTextProps={error ? { id: `${name}-error`, role: 'alert' } : undefined}
          {...other}
          sx={{
            "& .MuiInputBase-root": {
              height: 50,
            },
            "& .MuiInputBase-input": {
              padding: "10px",
            },
          }}
        />
      )}
    />
  );
}

RHFTextField.propTypes = {
  helperText: PropTypes.node,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
};
