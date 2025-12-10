import { t } from "i18next";
import { enqueueSnackbar } from "notistack";

export default function showError(error) {
  console.log("showError received: ", error);

  // Handle nested error.error structure from backend
  const errorData = error?.error || error?.errors || error;

  // Format 1: { error: { code, message, details: { field: ["error"] } } }
  if (errorData?.details) {
    // Validation errors with details object
    const firstField = Object.keys(errorData.details)[0];
    const firstError = errorData.details[firstField];
    const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
    enqueueSnackbar(errorMessage, { variant: 'error' });
  }
  // Format 2: { errors: { field: ["error"] } } (flat errors object)
  else if (error?.errors && typeof error.errors === 'object' && !Array.isArray(error.errors)) {
    const firstField = Object.keys(error.errors)[0];
    const firstError = error.errors[firstField];
    const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
    enqueueSnackbar(errorMessage, { variant: 'error' });
  }
  // Format 3: Legacy { data: { "field": ["error1", "error2"] } }
  else if (errorData?.data && typeof errorData.data === 'object') {
    const firstError = Object.values(errorData.data)[0];
    const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
    enqueueSnackbar(errorMessage, { variant: 'error' });
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

