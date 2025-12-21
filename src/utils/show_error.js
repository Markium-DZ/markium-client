import { t } from "i18next";
import { enqueueSnackbar } from "notistack";

export default function showError(error) {
  console.log("showError received: ", error);

  // Handle nested error.error structure from backend
  const errorData = error?.error || error?.errors || error;

  // Format 1: { error: { code, message, details: { field: ["error"] } } }
  if (errorData?.details) {
    // Validation errors with details object (422 errors)
    const fields = Object.keys(errorData.details);
    if (fields.length > 0) {
      // Show all validation errors
      fields.forEach(field => {
        const fieldErrors = errorData.details[field];
        const errorMessage = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
        enqueueSnackbar(errorMessage, { variant: 'error' });
      });
    } else if (errorData.message) {
      enqueueSnackbar(errorData.message, { variant: 'error' });
    }
  }
  // Format 2: { errors: { field: ["error"] } } (flat errors object - 422 validation errors)
  else if (error?.errors && typeof error.errors === 'object' && !Array.isArray(error.errors)) {
    const fields = Object.keys(error.errors);
    if (fields.length > 0) {
      // Show all validation errors
      fields.forEach(field => {
        const fieldErrors = error.errors[field];
        const errorMessage = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
        enqueueSnackbar(errorMessage, { variant: 'error' });
      });
    } else if (error.message) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  }
  // Format 3: Legacy { data: { "field": ["error1", "error2"] } }
  else if (errorData?.data && typeof errorData.data === 'object') {
    const fields = Object.keys(errorData.data);
    if (fields.length > 0) {
      // Show all validation errors
      fields.forEach(field => {
        const fieldErrors = errorData.data[field];
        const errorMessage = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
        enqueueSnackbar(errorMessage, { variant: 'error' });
      });
    }
  }
  // Format 4: Simple message { message: "Error text" }
  else if (errorData?.message) {
    enqueueSnackbar(errorData.message, { variant: 'error' });
  }
  // Format 5: Direct string error
  else if (typeof errorData === 'string') {
    enqueueSnackbar(errorData, { variant: 'error' });
  }
  // Fallback
  else {
    enqueueSnackbar(t('operation_failed'), { variant: 'error' });
  }
}

