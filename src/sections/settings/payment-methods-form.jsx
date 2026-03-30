import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useContext, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFSwitch,
} from 'src/components/hook-form';
import showError from 'src/utils/show_error';
import { AuthContext } from 'src/auth/context/jwt';
import VerificationGate from 'src/components/verification-gate/verification-gate';
import {
  useGetPaymentProviders,
  useGetPaymentConnections,
  createPaymentConnection,
  updatePaymentConnection,
  validatePaymentConnection,
  setDefaultPaymentConnection,
} from 'src/api/payment';

// ----------------------------------------------------------------------

export default function PaymentMethodsForm() {
  const { user } = useContext(AuthContext);
  const { providers, providersLoading, providersError } = useGetPaymentProviders();
  const { connections, connectionsLoading, connectionsError, mutate: mutateConnections } = useGetPaymentConnections();

  console.log("providers", providers);
  console.log("connections", connections);

  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [loading, setLoading] = useState(false);
  const [validatingConnection, setValidatingConnection] = useState(null);

  // Transform API providers to component structure and merge with existing connections
  const paymentMethods = useMemo(() => {
    if (!providers || providers.length === 0) return [];

    return providers.map((provider) => {
      // Find existing connection for this provider
      const existingConnection = connections?.find(
        (conn) => conn.provider?.id === provider.id || conn.provider?.identifier === provider.identifier
      );

      // Convert required_credentials to fields array
      const fields = Object.entries(provider.required_credentials || {}).map(([key, credential]) => ({
        name: `${provider.identifier}_${key}`,
        label: credential.label || key,
        type: credential.type === 'string' ? 'text' : credential.type,
        required: credential.required || false,
        placeholder: credential.placeholder || '',
        description: credential.description || '',
      }));

      return {
        id: provider.identifier,
        providerId: provider.id,
        name: provider.name,
        image: provider.logo || '/assets/images/payment/default.png',
        color: '#4ECDC4', // Default color
        fields,
        description: `${provider.name}${provider.supported_countries?.length > 0 ? ` - ${provider.supported_countries.join(', ')}` : ''}`,
        capabilities: provider.capabilities,
        isSandboxAvailable: provider.is_sandbox_available,
        // Connection data
        connectionId: existingConnection?.id,
        connectionName: existingConnection?.name,
        isConnected: !!existingConnection,
        isActive: existingConnection?.is_active || false,
        isDefault: existingConnection?.is_default || false,
        isValidated: !!existingConnection?.credentials_validated_at,
        isSandbox: existingConnection?.is_sandbox || false,
        lastUsedAt: existingConnection?.last_used_at,
        validatedAt: existingConnection?.credentials_validated_at,
        credentials: {},
      };
    });
  }, [providers, connections]);

  // Build dynamic Yup schema
  const buildValidationSchema = () => {
    const schemaFields = {};

    paymentMethods.forEach((method) => {
      schemaFields[`${method.id}_enabled`] = Yup.boolean();

      method.fields.forEach((field) => {
        schemaFields[field.name] = Yup.string();
      });
    });

    return Yup.object().shape(schemaFields);
  };

  const PaymentMethodsSchema = useMemo(() => buildValidationSchema(), [paymentMethods]);

  // Build default values
  const buildDefaultValues = () => {
    const defaults = {};

    paymentMethods.forEach((method) => {
      defaults[`${method.id}_enabled`] = method.isConnected && method.isActive;

      method.fields.forEach((field) => {
        defaults[field.name] = '';
      });
    });

    return defaults;
  };

  const defaultValues = useMemo(() => buildDefaultValues(), [paymentMethods]);

  const methods = useForm({
    resolver: yupResolver(PaymentMethodsSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // Reset form when data changes
  useEffect(() => {
    if (paymentMethods.length > 0) {
      reset(defaultValues);
    }
  }, [defaultValues, paymentMethods, reset]);

  // Validate connection handler
  const handleValidateConnection = async (method) => {
    if (!method.connectionId) {
      enqueueSnackbar(t('save_connection_first'), { variant: 'warning' });
      return;
    }

    try {
      setValidatingConnection(method.id);
      const response = await validatePaymentConnection(method.connectionId);

      const isValid = response.data?.valid || response.data?.success || response.success;

      if (isValid) {
        enqueueSnackbar(t('connection_validated_successfully', { name: method.name }), { variant: 'success' });
      } else {
        const errorMessage = response.data?.message || response.message;
        enqueueSnackbar(
          errorMessage || t('connection_validation_failed', { name: method.name }),
          { variant: 'error' }
        );
      }

      await mutateConnections();
    } catch (error) {
      showError(error);
    } finally {
      setValidatingConnection(null);
    }
  };

  // Set as default handler
  const handleSetAsDefault = async (method) => {
    if (!method.connectionId) {
      enqueueSnackbar(t('save_connection_first'), { variant: 'warning' });
      return;
    }

    try {
      await setDefaultPaymentConnection(method.connectionId);
      enqueueSnackbar(t('default_payment_method_set', { name: method.name }), { variant: 'success' });

      await mutateConnections();
    } catch (error) {
      showError(error);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      for (const method of paymentMethods) {
        const isEnabled = data[`${method.id}_enabled`];

        const credentials = {};
        method.fields.forEach((field) => {
          const fieldKey = field.name.replace(`${method.id}_`, '');
          const fieldValue = data[field.name];
          if (fieldValue) {
            credentials[fieldKey] = fieldValue;
          }
        });

        const hasCredentials = Object.keys(credentials).length > 0;
        const wasEnabled = method.isConnected && method.isActive;
        const enabledStateChanged = isEnabled !== wasEnabled;

        const needsAction =
          (isEnabled && hasCredentials) ||
          (enabledStateChanged && method.connectionId);

        if (!needsAction) {
          continue;
        }

        if (isEnabled) {
          const provider = providers.find(p => p.id === method.providerId);
          const authMethod = provider?.supported_auth_methods?.[0] || 'api_key';

          if (method.connectionId) {
            if (hasCredentials) {
              const updateBody = {
                credentials,
                name: `${method.name} Connection`,
                auth_method: authMethod,
                is_enabled: true,
              };

              console.log('Update connection payload:', updateBody);
              await updatePaymentConnection(method.connectionId, updateBody);
            } else {
              await updatePaymentConnection(method.connectionId, { is_enabled: true });
            }
          } else {
            if (!hasCredentials) {
              enqueueSnackbar(
                t('credentials_required_for_new_connection', { name: method.name }),
                { variant: 'warning' }
              );
              continue;
            }

            const connectionBody = {
              payment_provider_id: method.providerId,
              name: `${method.name} Connection`,
              auth_method: authMethod,
              credentials,
              is_enabled: true,
              is_default: false,
              is_sandbox: false,
              settings: {}
            };

            console.log('Create connection payload:', connectionBody);
            await createPaymentConnection(connectionBody);
          }
        } else if (method.connectionId && !isEnabled) {
          console.log('Disable connection:', method.connectionId);
          await updatePaymentConnection(method.connectionId, { is_enabled: false });
        }
      }

      await mutateConnections();

      enqueueSnackbar(t('payment_methods_saved_successfully'), { variant: 'success' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  });

  // Show loading state
  if (providersLoading || connectionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (providersError) {
    return (
      <Alert severity="error">
        <Typography variant="body2">
          {t('error_loading_payment_providers')}
        </Typography>
      </Alert>
    );
  }

  // Show empty state
  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      <Alert severity="warning">
        <Typography variant="body2">
          {t('no_payment_providers_available')}
        </Typography>
      </Alert>
    );
  }

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <VerificationGate>
              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                loading={isSubmitting || loading}
              >
                {t('save_changes')}
              </LoadingButton>
            </VerificationGate>
          </Stack>
        </Grid>

        {/* Information Alert */}
        <Grid xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              {t('payment_methods_info_message')}
            </Typography>
          </Alert>
        </Grid>

        {/* Payment Methods Sections */}
        <Grid xs={12} display="flex" flexDirection="column" gap={4}>
          {paymentMethods.map((method) => (
            <Card xs={12} key={method.id} width="100%">
              <Accordion>
                <AccordionSummary
                  expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                  sx={{
                    backgroundColor: 'background.neutral',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                    <Avatar
                      src={method.image}
                      alt={method.name}
                      variant="rounded"
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'background.neutral',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h6">{method.name}</Typography>
                        {method.isDefault && (
                          <Chip
                            label={t('default')}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {method.isValidated && (
                          <Chip
                            label={t('validated')}
                            size="small"
                            color="success"
                            variant="outlined"
                            icon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {method.description}
                      </Typography>
                    </Box>
                    <RHFSwitch name={`${method.id}_enabled`} label={t('enabled')} sx={{ mr: 2 }} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={3}>
                    {/* Connection Info */}
                    {method.isConnected && (
                      <Alert severity="info" sx={{ mb: 1 }}>
                        <Typography variant="caption">
                          {t('connection_exists_message') || 'Connection already exists. Leave fields empty to keep existing credentials, or enter new values to update.'}
                        </Typography>
                      </Alert>
                    )}

                    {/* Dynamic Fields */}
                    {method.fields.map((field) => (
                      <RHFTextField
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        type={field.type}
                        placeholder={field.placeholder}
                        disabled={!values[`${method.id}_enabled`]}
                        helperText={
                          !values[`${method.id}_enabled`]
                            ? t('enable_to_configure')
                            : field.description || (field.required
                              ? t('required_field')
                              : t('optional_field'))
                        }
                        InputProps={{
                          startAdornment: (
                            <Iconify
                              icon="solar:key-bold"
                              width={20}
                              sx={{ mr: 1, color: 'text.disabled' }}
                            />
                          ),
                        }}
                      />
                    ))}

                    {/* Action Buttons */}
                    {values[`${method.id}_enabled`] && (
                      <Stack direction="row" spacing={2}>
                        <LoadingButton
                          variant="outlined"
                          color="info"
                          size="small"
                          loading={validatingConnection === method.id}
                          onClick={() => handleValidateConnection(method)}
                          startIcon={<Iconify icon="eva:shield-checkmark-fill" />}
                        >
                          {t('validate_connection')}
                        </LoadingButton>

                        {!method.isDefault && method.connectionId && (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleSetAsDefault(method)}
                            startIcon={<Iconify icon="eva:star-fill" />}
                          >
                            {t('set_as_default')}
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Card>
          ))}
        </Grid>

        {/* Instructions Card */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('integration_instructions')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {paymentMethods.map((method, index) => (
                <Typography key={method.id} variant="body2">
                  <strong>{index + 1}. {method.name}:</strong> {t(`${method.id}_integration_instructions`)}
                </Typography>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}
