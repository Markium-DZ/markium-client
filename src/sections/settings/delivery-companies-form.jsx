import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useContext, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { alpha } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
} from 'src/components/hook-form';
import showError from 'src/utils/show_error';
import { useGetMyStore } from 'src/api/store';
import { AuthContext } from 'src/auth/context/jwt';
import {
  useGetShippingProviders,
  useGetShippingConnections,
  createShippingConnection,
  updateShippingConnection,
  validateShippingConnection,
  setDefaultShippingConnection,
  deleteShippingConnection,
} from 'src/api/shipping';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

export default function DeliveryCompaniesForm() {
  const { user } = useContext(AuthContext);
  const { store } = useGetMyStore(user?.store?.slug);
  const { providers, providersLoading, providersError } = useGetShippingProviders();
  const { connections, connectionsLoading, mutate: mutateConnections } = useGetShippingConnections();

  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [savingProvider, setSavingProvider] = useState(null);
  const [validatingConnection, setValidatingConnection] = useState(null);
  const [deletingConnection, setDeletingConnection] = useState(null);
  const [editingProviders, setEditingProviders] = useState({});
  const [configDialog, setConfigDialog] = useState(null); // company id or null
  const [searchQuery, setSearchQuery] = useState('');

  const deliveryCompanies = useMemo(() => {
    if (!providers || providers.length === 0) return [];

    return providers.map((provider) => {
      const existingConnection = connections?.find(
        (conn) => conn.provider?.id === provider.id || conn.provider?.identifier === provider.identifier
      );

      const fields = Object.entries(provider.required_credentials || {}).map(([key, credential]) => ({
        name: `${provider.identifier}_${key}`,
        labelKey: key,
        type: credential.type === 'string' ? 'text' : credential.type,
        required: credential.required || false,
      }));

      return {
        id: provider.identifier,
        providerId: provider.id,
        name: provider.name,
        image: provider.logo || '/assets/images/delivery/default.png',
        fields,
        descriptionKey: `${provider.identifier}_description`,
        capabilities: provider.capabilities,
        isSandboxAvailable: provider.is_sandbox_available,
        connectionId: existingConnection?.id,
        isConnected: !!existingConnection,
        isActive: existingConnection?.is_active || false,
        isDefault: existingConnection?.is_default || false,
        isValidated: !!existingConnection?.credentials_validated_at,
        isSandbox: existingConnection?.is_sandbox || false,
        credentials: {},
      };
    });
  }, [providers, connections]);

  // Build dynamic Yup schema
  const buildValidationSchema = () => {
    const schemaFields = {};
    deliveryCompanies.forEach((company) => {
      schemaFields[`${company.id}_enabled`] = Yup.boolean();
      company.fields.forEach((field) => {
        schemaFields[field.name] = Yup.string();
      });
    });
    return Yup.object().shape(schemaFields);
  };

  const DeliveryCompaniesSchema = useMemo(() => buildValidationSchema(), [deliveryCompanies]);

  const buildDefaultValues = () => {
    const defaults = {};
    deliveryCompanies.forEach((company) => {
      defaults[`${company.id}_enabled`] = company.isConnected && company.isActive && company.isValidated;
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

  const { reset, watch } = methods;
  const values = watch();

  useEffect(() => {
    if (deliveryCompanies.length > 0) {
      reset(defaultValues);
    }
  }, [defaultValues, deliveryCompanies, reset]);

  // --- Handlers ---

  const handleValidateConnection = async (company) => {
    if (!company.connectionId) {
      enqueueSnackbar(t('save_connection_first'), { variant: 'warning' });
      return;
    }
    try {
      setValidatingConnection(company.id);
      const response = await validateShippingConnection(company.connectionId);
      const responseData = response?.data || response;
      const isValid = responseData?.success === true || responseData?.valid === true;
      if (isValid) {
        enqueueSnackbar(t('connection_validated_successfully', { name: company.name }), { variant: 'success' });
      } else {
        const errorMessage = responseData?.message || responseData?.error || t('connection_validation_failed', { name: company.name });
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
      await mutateConnections();
    } catch (error) {
      const errorData = error?.response?.data || error?.data || {};
      const errorMessage = errorData?.message || errorData?.error || t('connection_validation_failed', { name: company.name });
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setValidatingConnection(null);
    }
  };

  const handleSetAsDefault = async (company) => {
    if (!company.connectionId) {
      enqueueSnackbar(t('save_connection_first'), { variant: 'warning' });
      return;
    }
    try {
      await setDefaultShippingConnection(company.connectionId);
      enqueueSnackbar(t('default_provider_set', { name: company.name }), { variant: 'success' });
      await mutateConnections();
    } catch (error) {
      showError(error);
    }
  };

  const handleToggleEditMode = (companyId) => {
    setEditingProviders((prev) => ({ ...prev, [companyId]: !prev[companyId] }));
  };

  const handleCancelEdit = (company) => {
    company.fields.forEach((field) => {
      methods.setValue(field.name, '');
    });
    setEditingProviders((prev) => ({ ...prev, [company.id]: false }));
  };

  const handleSwitchToggle = (company) => (event) => {
    event.stopPropagation();
    const isEnabling = event.target.checked;

    if (isEnabling) {
      if (company.isConnected && company.isValidated) {
        // Re-enable a validated connection
        handleToggleEnabled(company, true);
      } else {
        // No valid connection — open config dialog instead of toggling
        setConfigDialog(company.id);
      }
    } else if (company.isConnected) {
      // Disable an existing connection
      handleToggleEnabled(company, false);
    }
  };

  const handleToggleEnabled = async (company, enabled) => {
    try {
      methods.setValue(`${company.id}_enabled`, enabled);
      await updateShippingConnection(company.connectionId, { is_enabled: enabled });
      await mutateConnections();
    } catch (error) {
      methods.setValue(`${company.id}_enabled`, !enabled);
      showError(error);
    }
  };

  const handleTestConnection = async (company) => {
    try {
      setSavingProvider(company.id);
      const data = methods.getValues();

      const credentials = {};
      company.fields.forEach((field) => {
        const fieldKey = field.name.replace(`${company.id}_`, '');
        const fieldValue = data[field.name];
        if (fieldValue) {
          credentials[fieldKey] = fieldValue;
        }
      });

      const hasCredentials = Object.keys(credentials).length > 0;
      const provider = providers.find((p) => p.id === company.providerId);
      const authMethod = provider?.supported_auth_methods?.[0] || 'api_key';

      if (company.connectionId) {
        // --- Existing connection: update credentials then validate ---
        const updateBody = {
          name: `${company.name} Connection`,
          auth_method: authMethod,
          is_enabled: true,
        };
        if (hasCredentials) {
          updateBody.credentials = credentials;
        }
        await updateShippingConnection(company.connectionId, updateBody);

        let validationPassed = false;
        try {
          const validateResponse = await validateShippingConnection(company.connectionId);
          const responseData = validateResponse?.data || validateResponse;
          validationPassed = responseData?.success === true || responseData?.valid === true;
        } catch (_) { /* validation failed */ }

        if (validationPassed) {
          enqueueSnackbar(t('connection_validated_successfully', { name: company.name }), { variant: 'success' });
        } else {
          enqueueSnackbar(t('connection_validation_failed', { name: company.name }), { variant: 'error' });
        }

        await mutateConnections();
        setEditingProviders((prev) => ({ ...prev, [company.id]: false }));
      } else {
        // --- New connection: create → validate → delete on failure ---
        if (!hasCredentials) {
          enqueueSnackbar(t('credentials_required_for_new_connection', { name: company.name }), { variant: 'warning' });
          setSavingProvider(null);
          return;
        }

        const connectionBody = {
          shipping_provider_id: company.providerId,
          name: `${company.name} Connection`,
          auth_method: authMethod,
          credentials,
          is_enabled: true,
          is_default: false,
          is_sandbox: false,
          settings: {},
        };

        const createResponse = await createShippingConnection(connectionBody);
        const newConnectionId = createResponse?.data?.data?.id || createResponse?.data?.id;

        if (newConnectionId) {
          let validationPassed = false;
          try {
            const validateResponse = await validateShippingConnection(newConnectionId);
            const responseData = validateResponse?.data || validateResponse;
            validationPassed = responseData?.success === true || responseData?.valid === true;
          } catch (_) { /* validation failed */ }

          if (validationPassed) {
            enqueueSnackbar(t('connection_validated_successfully', { name: company.name }), { variant: 'success' });
            await mutateConnections();
          } else {
            // Delete the connection on validation failure — don't leave orphan records
            try {
              await deleteShippingConnection(newConnectionId);
            } catch (__) { /* best-effort cleanup */ }
            await mutateConnections();
            methods.setValue(`${company.id}_enabled`, false);
            enqueueSnackbar(t('connection_validation_failed', { name: company.name }), { variant: 'error' });
            setSavingProvider(null);
            return; // Keep dialog open with fields
          }
        }
      }

      setSavingProvider(null);
    } catch (error) {
      setSavingProvider(null);
      showError(error);
    }
  };

  const handleDeleteConnection = async (company) => {
    if (!company.connectionId) return;
    try {
      setDeletingConnection(company.id);
      await deleteShippingConnection(company.connectionId);
      enqueueSnackbar(t('connection_deleted_successfully', { name: company.name }), { variant: 'success' });
      methods.setValue(`${company.id}_enabled`, false);
      await mutateConnections();
      setConfigDialog(null);
    } catch (error) {
      showError(error);
    } finally {
      setDeletingConnection(null);
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return deliveryCompanies;
    const q = searchQuery.toLowerCase().trim();
    return deliveryCompanies.filter(
      (company) => company.name.toLowerCase().includes(q)
    );
  }, [deliveryCompanies, searchQuery]);

  // Loading
  if (providersLoading || connectionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LoadingScreen sx={{ my: 8 }} color="primary" />
      </Box>
    );
  }

  // Error
  if (providersError) {
    return (
      <Alert severity="error">
        <Typography variant="body2">{t('error_loading_providers')}</Typography>
      </Alert>
    );
  }

  // Empty
  if (!deliveryCompanies || deliveryCompanies.length === 0) {
    return (
      <Alert severity="warning">
        <Typography variant="body2">{t('no_providers_available')}</Typography>
      </Alert>
    );
  }

  const activeCompany = deliveryCompanies.find((c) => c.id === configDialog);

  return (
    <FormProvider methods={methods}>
      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder={t('search_shipping_companies')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
          ...(searchQuery && {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <Iconify icon="eva:close-fill" width={18} />
                </IconButton>
              </InputAdornment>
            ),
          }),
        }}
        sx={{ mb: 2.5 }}
      />

      {/* Provider Grid */}
      <Grid container spacing={2.5}>
        {filteredCompanies.map((company) => {
          const isEnabled = !!values[`${company.id}_enabled`];

          return (
            <Grid xs={12} sm={6} md={4} key={company.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'text.disabled',
                    boxShadow: (theme) => theme.customShadows?.z4 || '0 4px 16px 0 rgba(0,0,0,0.06)',
                  },
                  ...(isEnabled && company.isConnected && company.isValidated && {
                    borderColor: (theme) => alpha(theme.palette.success.main, 0.5),
                  }),
                }}
                onClick={() => setConfigDialog(company.id)}
              >
                <Stack sx={{ height: '100%', p: 2.5 }} spacing={2}>
                  {/* Top: Logo + Switch */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box
                      component="img"
                      src={company.image}
                      alt={company.name}
                      sx={{
                        height: 36,
                        maxWidth: 100,
                        objectFit: 'contain',
                      }}
                    />
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Switch
                        size="small"
                        checked={isEnabled}
                        onChange={handleSwitchToggle(company)}
                      />
                    </Box>
                  </Stack>

                  {/* Name */}
                  <Typography variant="subtitle2" fontWeight={600} sx={{ flexGrow: 1 }}>
                    {company.name}
                  </Typography>

                  {/* Status Footer */}
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" gap={0.5}>
                    {company.isConnected && company.isValidated ? (
                      <Chip
                        icon={<Iconify icon="eva:checkmark-circle-2-fill" width={14} />}
                        label={t('validated')}
                        size="small"
                        color="success"
                        variant="soft"
                        sx={{ height: 24, fontSize: '0.7rem' }}
                      />
                    ) : company.isConnected ? (
                      <Chip
                        icon={<Iconify icon="eva:alert-circle-fill" width={14} />}
                        label={t('not_validated')}
                        size="small"
                        color="warning"
                        variant="soft"
                        sx={{ height: 24, fontSize: '0.7rem' }}
                      />
                    ) : (
                      <Chip
                        label={t('not_connected')}
                        size="small"
                        variant="soft"
                        sx={{ height: 24, fontSize: '0.7rem' }}
                      />
                    )}
                    {company.isDefault && (
                      <Chip
                        icon={<Iconify icon="eva:star-fill" width={12} />}
                        label={t('default')}
                        size="small"
                        color="primary"
                        variant="soft"
                        sx={{ height: 24, fontSize: '0.7rem' }}
                      />
                    )}
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          );
        })}

        {filteredCompanies.length === 0 && (
          <Grid xs={12}>
            <Stack alignItems="center" sx={{ py: 6 }}>
              <Iconify icon="eva:search-fill" width={48} sx={{ color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                {t('no_shipping_companies_found')}
              </Typography>
            </Stack>
          </Grid>
        )}
      </Grid>

      {/* Configuration Dialog */}
      <Dialog
        open={!!configDialog}
        onClose={() => {
          setConfigDialog(null);
          setEditingProviders({});
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {activeCompany && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  component="img"
                  src={activeCompany.image}
                  alt={activeCompany.name}
                  sx={{
                    height: 32,
                    maxWidth: 80,
                    objectFit: 'contain',
                  }}
                />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="h6">{activeCompany.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t(activeCompany.descriptionKey)}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => {
                    setConfigDialog(null);
                    setEditingProviders({});
                  }}
                  size="small"
                >
                  <Iconify icon="eva:close-fill" width={20} />
                </IconButton>
              </Stack>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
              <Stack spacing={2.5}>
                {/* Validated State — truly ready */}
                {activeCompany.isConnected && activeCompany.isValidated && !editingProviders[activeCompany.id] ? (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify icon="eva:checkmark-circle-2-fill" width={18} sx={{ color: 'success.main' }} />
                      <Typography variant="body2" color="text.secondary">
                        {t('connection_configured')}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {!activeCompany.isDefault && (
                        <Button
                          variant="outlined"
                          color="inherit"
                          size="small"
                          onClick={() => handleSetAsDefault(activeCompany)}
                          startIcon={<Iconify icon="eva:star-fill" width={16} />}
                        >
                          {t('mark_as_default')}
                        </Button>
                      )}

                      <LoadingButton
                        variant="outlined"
                        color="error"
                        size="small"
                        loading={deletingConnection === activeCompany.id}
                        onClick={() => handleDeleteConnection(activeCompany)}
                        startIcon={<Iconify icon="eva:trash-2-fill" width={16} />}
                      >
                        {t('delete')}
                      </LoadingButton>

                      <LoadingButton
                        variant="outlined"
                        color="inherit"
                        size="small"
                        loading={validatingConnection === activeCompany.id}
                        onClick={() => handleValidateConnection(activeCompany)}
                        startIcon={<Iconify icon="eva:shield-fill" width={16} />}
                      >
                        {t('check_connection')}
                      </LoadingButton>
                    </Stack>
                  </>
                ) : (
                  <>
                    {/* Connected but not validated — show warning */}
                    {activeCompany.isConnected && !activeCompany.isValidated && !editingProviders[activeCompany.id] && (
                      <Alert severity="warning" icon={<Iconify icon="eva:alert-circle-fill" width={20} />}>
                        <Typography variant="body2">
                          {t('connection_not_validated_message')}
                        </Typography>
                      </Alert>
                    )}

                    {/* Edit mode hint */}
                    {activeCompany.isConnected && editingProviders[activeCompany.id] && (
                      <Typography variant="caption" color="text.secondary">
                        {t('update_credentials_message')}
                      </Typography>
                    )}

                    {/* Credential Fields */}
                    {activeCompany.fields.map((field) => (
                      <RHFTextField
                        key={field.name}
                        name={field.name}
                        label={t(field.labelKey)}
                        type={field.type}
                        size="small"
                        helperText={field.required ? t('required_field') : t('optional_field')}
                      />
                    ))}
                  </>
                )}
              </Stack>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2 }}>
              {/* Show test/cancel when NOT in validated-view mode */}
              {!(activeCompany.isConnected && activeCompany.isValidated && !editingProviders[activeCompany.id]) && (
                <>
                  {activeCompany.isConnected && editingProviders[activeCompany.id] && (
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      onClick={() => handleCancelEdit(activeCompany)}
                    >
                      {t('cancel')}
                    </Button>
                  )}
                  <LoadingButton
                    variant="contained"
                    size="small"
                    loading={savingProvider === activeCompany.id}
                    onClick={() => handleTestConnection(activeCompany)}
                    startIcon={<Iconify icon="eva:flash-fill" width={18} />}
                  >
                    {t('test_connection')}
                  </LoadingButton>
                </>
              )}

              {/* Close button only in validated-view mode */}
              {activeCompany.isConnected && activeCompany.isValidated && !editingProviders[activeCompany.id] && (
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setConfigDialog(null);
                    setEditingProviders({});
                  }}
                >
                  {t('close')}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </FormProvider>
  );
}
