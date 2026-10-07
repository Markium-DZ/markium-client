import { t } from "i18next";

// Lazy-load notistack — keeps it out of the initial bundle
let _enqueue;
const getEnqueue = () =>
  _enqueue ?? (_enqueue = import('notistack').then((m) => m.enqueueSnackbar));

export default function showValidationError(error) {
  console.log("error : ", error);

  getEnqueue().then((enqueueSnackbar) => {
    try {
      if (error && typeof error === 'object' && Object.keys(error).length > 0) {
        // Get the first error message
        const firstErrorKey = Object.keys(error)[0];
        const firstError = error[firstErrorKey];

        let errorMessage;

        if (typeof firstError === 'string') {
          errorMessage = firstError;
        } else if (firstError && typeof firstError === 'object' && firstError.message) {
          errorMessage = firstError.message;
        } else {
          errorMessage = t('validation_error_occurred');
        }

        // Ensure we have a valid string message
        if (errorMessage && typeof errorMessage === 'string' && errorMessage.trim()) {
          enqueueSnackbar(errorMessage, { variant: 'error' });
        } else {
          enqueueSnackbar(t('operation_failed'), { variant: 'error' });
        }
      } else if (typeof error === 'string' && error.trim()) {
        enqueueSnackbar(error, { variant: 'error' });
      }
    } catch (err) {
      console.error('Error in showValidationError:', err);
      // Fallback to a safe message
      enqueueSnackbar(t('operation_failed'), { variant: 'error' });
    }
  });
}
