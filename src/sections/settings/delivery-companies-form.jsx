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
import { updateStoreConfig, useGetMyStore } from 'src/api/store';
import { AuthContext } from 'src/auth/context/jwt';
import {
  useGetShippingProviders,
  useGetShippingConnections,
  createShippingConnection,
  updateShippingConnection,
  validateShippingConnection,
  setDefaultShippingConnection,
} from 'src/api/shipping';
import Image from 'src/components/image';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

export default function DeliveryCompaniesForm() {
  const { user } = useContext(AuthContext);
  const { store } = useGetMyStore(user?.store?.slug);
  const { providers, providersLoading, providersError } = useGetShippingProviders();
  const { connections, connectionsLoading, connectionsError, mutate: mutateConnections } = useGetShippingConnections();

  console.log("store", store);
  console.log("providers", providers);
  console.log("connections", connections);

  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [savingProvider, setSavingProvider] = useState(null);
  const [validatingConnection, setValidatingConnection] = useState(null);
  const [editingProviders, setEditingProviders] = useState({});

  // Transform API providers to component structure and merge with existing connections
  const deliveryCompanies = useMemo(() => {
    if (!providers || providers.length === 0) return [];

    return providers.map((provider) => {
      // Find existing connection for this provider
      // Connection has nested provider object with id and identifier
      const existingConnection = connections?.find(
        (conn) => conn.provider?.id === provider.id || conn.provider?.identifier === provider.identifier
      );

      // Convert required_credentials to fields array
      const fields = Object.entries(provider.required_credentials || {}).map(([key, credential]) => ({
        name: `${provider.identifier}_${key}`,
        labelKey: key,
        type: credential.type === 'string' ? 'text' : credential.type,
        required: credential.required || false,
        descriptionKey: key,
      }));

      return {
        id: provider.identifier,
        providerId: provider.id,
        name: provider.name,
        image: provider.logo || '/assets/images/delivery/default.png',
        color: '#4ECDC4', // Default color, can be customized per provider
        fields,
        descriptionKey: `${provider.identifier}_description`,
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
        // Note: Credentials are not returned in the response for security
        credentials: {},
      };
    });
  }, [providers, connections]);

  // Build dynamic Yup schema
  // Make all fields optional - we'll validate in submit handler based on connection state
  const buildValidationSchema = () => {
    const schemaFields = {};

    deliveryCompanies.forEach((company) => {
      // Add enabled field
      schemaFields[`${company.id}_enabled`] = Yup.boolean();

      // Add all credential fields as optional strings
      company.fields.forEach((field) => {
        schemaFields[field.name] = Yup.string();
      });
    });

    return Yup.object().shape(schemaFields);
  };

  const DeliveryCompaniesSchema = useMemo(() => buildValidationSchema(), [deliveryCompanies]);

  // Build default values
  const buildDefaultValues = () => {
    const defaults = {};

    deliveryCompanies.forEach((company) => {
      // Set enabled based on connection status (is_active from API)
      defaults[`${company.id}_enabled`] = company.isConnected && company.isActive;

      // Set all credential fields to empty
      // Note: API doesn't return credentials for security reasons
      // Users will need to re-enter credentials when updating
      company.fields.forEach((field) => {
        defaults[field.name] = '';
      });
    });

    return defaults;
  };

  const defaultValues = useMemo(() => buildDefaultValues(), [store, deliveryCompanies]);

  const methods = useForm({
    resolver: yupResolver(DeliveryCompaniesSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
  } = methods;

  const values = watch();

  // Reset form when data changes
  useEffect(() => {
    if (deliveryCompanies.length > 0) {
      reset(defaultValues);
    }
  }, [defaultValues, deliveryCompanies, reset]);

  // Validate connection handler
  const handleValidateConnection = async (company) => {
    if (!company.connectionId) {
      enqueueSnackbar(t('save_connection_first'), { variant: 'warning' });
      return;
    }

    try {
      setValidatingConnection(company.id);
      const response = await validateShippingConnection(company.connectionId);
      console.log("validateShippingConnection response:", response);

      // Check response for success - handle various response structures
      const responseData = response?.data || response;
      const isValid = responseData?.success === true || responseData?.valid === true;

      if (isValid) {
        enqueueSnackbar(t('connection_validated_successfully', { name: company.name }), { variant: 'success' });
      } else {
        // Get error message from response
        const errorMessage = responseData?.message || responseData?.error || t('connection_validation_failed', { name: company.name });
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }

      // Refresh connections to get updated validation status
      await mutateConnections();
    } catch (error) {
      console.log("validateShippingConnection error:", error);
      // Handle error response from API (e.g., 422 status)
      const errorData = error?.response?.data || error?.data || {};
      const errorMessage = errorData?.message || errorData?.error || t('connection_validation_failed', { name: company.name });
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
    finally {
      setValidatingConnection(null);
    }
  };

  // Set as default handler
  const handleSetAsDefault = async (company) => {
    if (!company.connectionId) {
      enqueueSnackbar(t('save_connection_first'), { variant: 'warning' });
      return;
    }

    try {
      await setDefaultShippingConnection(company.connectionId);
      enqueueSnackbar(t('default_provider_set', { name: company.name }), { variant: 'success' });

      // Refresh connections to get updated default status
      await mutateConnections();
    } catch (error) {
      showError(error);
    }
  };

  // Toggle edit mode for a provider
  const handleToggleEditMode = (companyId) => {
    setEditingProviders(prev => ({
      ...prev,
      [companyId]: !prev[companyId]
    }));
  };

  // Cancel edit mode
  const handleCancelEdit = (company) => {
    // Clear the form fields for this provider
    company.fields.forEach((field) => {
      methods.setValue(field.name, '');
    });
    setEditingProviders(prev => ({
      ...prev,
      [company.id]: false
    }));
  };

  // Save individual provider handler
  const handleSaveProvider = async (company) => {
    try {
      setSavingProvider(company.id);

      const data = methods.getValues();
      const isEnabled = data[`${company.id}_enabled`];

      // Extract credentials for this company
      const credentials = {};
      company.fields.forEach((field) => {
        const fieldKey = field.name.replace(`${company.id}_`, '');
        const fieldValue = data[field.name];
        if (fieldValue) {
          credentials[fieldKey] = fieldValue;
        }
      });

      const hasCredentials = Object.keys(credentials).length > 0;

      // Determine auth method based on provider's supported methods
      const provider = providers.find(p => p.id === company.providerId);
      const authMethod = provider?.supported_auth_methods?.[0] || 'api_key';

      if (company.connectionId) {
        // Update existing connection
        const updateBody = {
          name: `${company.name} Connection`,
          auth_method: authMethod,
          is_enabled: isEnabled,
        };

        if (hasCredentials) {
          updateBody.credentials = credentials;
        }

        console.log('Update connection payload:', updateBody);
        await updateShippingConnection(company.connectionId, updateBody);
        enqueueSnackbar(t('connection_saved_successfully', { name: company.name }), { variant: 'success' });
      } else {
        // Create new connection - credentials are required
        if (!hasCredentials) {
          enqueueSnackbar(
            t('credentials_required_for_new_connection', { name: company.name }),
            { variant: 'warning' }
          );
          setSavingProvider(null);
          return;
        }

        const connectionBody = {
          shipping_provider_id: company.providerId,
          name: `${company.name} Connection`,
          auth_method: authMethod,
          credentials,
          is_enabled: isEnabled,
          is_default: false,
          is_sandbox: false,
          settings: {}
        };

        console.log('Create connection payload:', connectionBody);
        await createShippingConnection(connectionBody);
        enqueueSnackbar(t('connection_created_successfully', { name: company.name }), { variant: 'success' });
      }

      // Refresh connections data
      await mutateConnections();
      // Exit edit mode after successful save
      setEditingProviders(prev => ({
        ...prev,
        [company.id]: false
      }));
      setSavingProvider(null);
    } catch (error) {
      setSavingProvider(null);
      showError(error);
    }
  };

  // Show loading state
  if (providersLoading || connectionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        {/* <CircularProgress /> */}
        <LoadingScreen sx={{ my: 8 }} color='primary' />

      </Box>
    );
  }

  // Show error state
  if (providersError) {
    return (
      <Alert severity="error">
        <Typography variant="body2">
          {t('error_loading_providers')}
        </Typography>
      </Alert>
    );
  }

  // Show empty state
  if (!deliveryCompanies || deliveryCompanies.length === 0) {
    return (
      <Alert severity="warning">
        <Typography variant="body2">
          {t('no_providers_available')}
        </Typography>
      </Alert>
    );
  }

  return (
    <FormProvider methods={methods}>
      <Grid container spacing={3}>
        {/* Information Alert */}
        <Grid xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              {t('delivery_companies_info_message')}
            </Typography>
          </Alert>
        </Grid>

        {/* Delivery Companies Sections */}
        <Grid xs={12} display="flex" flexDirection="column" gap={4}>
          {deliveryCompanies.map((company) => (
            <Card xs={12} key={company.id} width="100%">
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
                      src={company.image}
                      alt={company.name}
                      variant="rounded"
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'background.neutral',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                      }}
                    />
                    {/* <Image
                      src={company.image}
                      alt={company.name}
                      variant="rounded"
                      sx={{
                        scale:0.1,
                        // width: 48,
                        // height: 48,
                        // bgcolor: 'background.neutral',
                        // border: (theme) => `1px solid ${theme.palette.divider}`,
                      }}
                    /> */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h6">{company.name}</Typography>
                        {company.isDefault && (
                          <Chip
                            label={t('default')}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {company.isValidated && (
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
                        {t(company.descriptionKey)}
                      </Typography>
                    </Box>
                    <Box onClick={(e) => e.stopPropagation()} sx={{ mr: 2 }}>
                      <RHFSwitch name={`${company.id}_enabled`} label={t('enabled')} />
                    </Box>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={3}>
                    {/* Connected State - Show connection info and action buttons */}
                    {company.isConnected && !editingProviders[company.id] ? (
                      <>
                        {/* Connection Status */}
                        <Alert severity="success" icon={<Iconify icon="eva:checkmark-circle-2-fill" />}>
                          <Typography variant="body2">
                            {t('connection_configured')}
                          </Typography>
                        </Alert>

                        {/* Action Buttons for connected state */}
                        {values[`${company.id}_enabled`] && (
                          <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                            {/* Update Button - shows inputs when clicked */}
                            <Button
                              variant="contained"
                              color="warning"
                              size="small"
                              onClick={() => handleToggleEditMode(company.id)}
                              startIcon={<Iconify icon="eva:edit-fill" />}
                            >
                              {t('update')}
                            </Button>

                            {/* Verify Connection Button */}
                            <LoadingButton
                              variant="outlined"
                              color="info"
                              size="small"
                              loading={validatingConnection === company.id}
                              onClick={() => handleValidateConnection(company)}
                              startIcon={<Iconify icon="eva:shield-checkmark-fill" />}
                            >
                              {t('verify_connection')}
                            </LoadingButton>

                            {/* Set as Default Button */}
                            {!company.isDefault && (
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => handleSetAsDefault(company)}
                                startIcon={<Iconify icon="eva:star-fill" />}
                              >
                                {t('set_as_default')}
                              </Button>
                            )}
                          </Stack>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Edit Mode or New Connection - Show input fields */}
                        {company.isConnected && editingProviders[company.id] && (
                          <Alert severity="info" sx={{ mb: 1 }}>
                            <Typography variant="caption">
                              {t('update_credentials_message')}
                            </Typography>
                          </Alert>
                        )}

                        {/* Dynamic Fields */}
                        {company.fields.map((field) => (
                          <RHFTextField
                            key={field.name}
                            name={field.name}
                            label={t(field.labelKey)}
                            type={field.type}
                            disabled={!values[`${company.id}_enabled`]}
                            helperText={
                              !values[`${company.id}_enabled`]
                                ? t('enable_to_configure')
                                : field.required
                                  ? t('required_field')
                                  : t('optional_field')
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

                        {/* Action Buttons for edit/create mode */}
                        {values[`${company.id}_enabled`] && (
                          <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                            {/* Submit/Create Button */}
                            <LoadingButton
                              variant="contained"
                              color={company.isConnected ? "primary" : "success"}
                              size="small"
                              loading={savingProvider === company.id}
                              onClick={() => handleSaveProvider(company)}
                              startIcon={<Iconify icon={company.isConnected ? "eva:save-fill" : "eva:plus-fill"} />}
                            >
                              {company.isConnected ? t('submit') : t('create')}
                            </LoadingButton>

                            {/* Cancel Button - only show in edit mode */}
                            {company.isConnected && editingProviders[company.id] && (
                              <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                onClick={() => handleCancelEdit(company)}
                                startIcon={<Iconify icon="eva:close-fill" />}
                              >
                                {t('cancel')}
                              </Button>
                            )}
                          </Stack>
                        )}
                      </>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Card>
          ))}
        </Grid>

        {/* Instructions Card */}
        {/* <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('integration_instructions')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {deliveryCompanies.map((company, index) => (
                <Typography key={company.id} variant="body2">
                  <strong>{index + 1}. {company.name}:</strong> {t(`${company.id}_integration_instructions`)}
                </Typography>
              ))}
            </Stack>
          </Card>
        </Grid> */}

        {/* Actions */}

      </Grid>
    </FormProvider>
  );
}
