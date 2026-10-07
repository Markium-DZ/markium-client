import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import axios, { endpoints } from 'src/utils/axios';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export default function StoreSetupCategories({ onComplete }) {
  const { t } = useTranslation();

  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(endpoints.categories.root, {
          params: { per_page: 100, type: 'global' },
        });
        const data = response.data.data?.categories || response.data.data || response.data;
        const all = Array.isArray(data) ? data : [];
        // Show only root categories (no parent) in the wizard
        setCategories(all.filter((c) => !c.parent_id));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setErrorMsg(t('operation_failed'));
      } finally {
        setFetching(false);
      }
    };

    fetchCategories();
  }, [t]);

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg(t('select_at_least_one_category'));
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await axios.patch(endpoints.storeSetup.categories, {
        category_ids: selectedIds,
      });

      onComplete();
    } catch (error) {
      console.error(error);
      const message = error.error?.message || error.message || t('operation_failed');
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 5 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {!!errorMsg && (
        <Alert severity="error">{errorMsg}</Alert>
      )}

      <Stack spacing={1} sx={{ textAlign: 'center' }}>
        <Typography variant="h6">
          {t('select_categories')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('select_categories_description')}
        </Typography>
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
        {categories.map((category) => {
          const isSelected = selectedIds.includes(category.id);
          return (
            <Chip
              key={category.id}
              label={category.translated_name || category.name}
              onClick={() => handleToggle(category.id)}
              variant={isSelected ? 'filled' : 'outlined'}
              color={isSelected ? 'primary' : 'default'}
              sx={{
                fontWeight: isSelected ? 600 : 400,
                borderWidth: 2,
                cursor: 'pointer',
              }}
            />
          );
        })}
      </Box>

<LoadingButton
        fullWidth
        size="large"
        variant="contained"
        onClick={handleSubmit}
        loading={loading}
        disabled={selectedIds.length === 0}
      >
        {t('complete_setup')}
      </LoadingButton>
    </Stack>
  );
}

StoreSetupCategories.propTypes = {
  onComplete: PropTypes.func.isRequired,
};
