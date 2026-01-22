import { useState, useContext } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Grid from '@mui/material/Grid';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

import { useSnackbar } from 'src/components/snackbar';
import showError from 'src/utils/show_error';
import { AuthContext } from 'src/auth/context/jwt';
import Iconify from 'src/components/iconify';
import { SingleFilePreviewLazy } from 'src/components/upload';
import { createProduct } from 'src/api/orders';
import { updateTheme } from 'src/api/theme';
import { updateStoreConfig } from 'src/api/store';

// ----------------------------------------------------------------------

// Define available templates
const TEMPLATES = [
  {
    id: 'clothing',
    title: 'Clothing',
    description: 'Clean and contemporary design with bold typography',
    image: '/assets/templates/clothing.png',
    preview: '/assets/templates/clothing.png',
  },
  {
    id: 'shoes',
    title: 'Shoes',
    description: 'Traditional and elegant layout with timeless appeal',
    image: '/assets/templates/shoes.png',
    preview: '/assets/templates/shoes.png',
  },
  {
    id: 'furniture',
    title: 'Furniture',
    description: 'Simple and focused design with plenty of white space',
    image: '/assets/templates/furniture.png',
    preview: '/assets/templates/furniture.png',
  },
  {
    id: 'kitchen',
    title: 'Kitchen',
    description: 'Bold colors and dynamic layouts for eye-catching stores',
    image: '/assets/templates/kitchen.png',
    preview: '/assets/templates/kitchen.png',
  },
  {
    id: 'jewellery',
    title: 'Jewellery',
    description: 'Professional and trustworthy design for business stores',
    image: '/assets/templates/jewellery.png',
    preview: '/assets/templates/jewellery.png',
  },
  {
    id: 'autoparts',
    title: 'Autoparts',
    description: 'Stylish and sophisticated design for fashion stores',
    image: '/assets/templates/autoparts.png',
    preview: '/assets/templates/autoparts.png',
  },
  {
    id: 'islamic-lib',
    title: 'Islamic Library',
    description: 'Elegant design for Islamic books and religious content stores',
    image: '/assets/templates/islamic-lib.png',
    preview: '/assets/templates/islamic-lib.png',
  },
  {
    id: 'islamic-lib2',
    title: 'Islamic Library 2',
    description: 'Elegant design for Islamic books and religious content stores',
    image: '/assets/templates/islamic-lib2.png',
    preview: '/assets/templates/islamic-lib2.png',
  },
  {
    id: 'spices',
    title: 'Spices & Herbs',
    description: 'Traditional and aromatic design for spices and herbs stores',
    image: '/assets/templates/spices.png',
    preview: '/assets/templates/spices.png',
  },
  {
    id: 'bags',
    title: 'Bags',
    description: 'Modern and elegant design perfect for bags and accessories stores',
    image: '/assets/templates/bags.png',
    preview: '/assets/templates/bags.png',
  },
  {
    id: 'hardware-store',
    title: 'Hardware Store',
    description: 'Professional and robust design perfect for hardware and tools stores',
    image: '/assets/templates/hardware-store.png',
    preview: '/assets/templates/hardware-store.png',
  },
  {
    id: 'electronics',
    title: 'Electronics',
    description: 'Modern and tech-focused design perfect for electronics and gadget stores',
    image: '/assets/templates/electronics.png',
    preview: '/assets/templates/electronics.png',
  },
  {
    id: 'health-cosmetics',
    title: 'Health & Cosmetics',
    description: 'Clean and elegant design perfect for health and beauty stores',
    image: '/assets/templates/health.png',
    preview: '/assets/templates/health.png',
  },
  {
    id: 'women-fashion',
    title: 'Women Fashion',
    description: 'Elegant and stylish design perfect for women\'s fashion and apparel stores',
    image: '/assets/templates/women-fashion.png',
    preview: '/assets/templates/women-fashion.png',
  },
  {
    id: 'default',
    title: 'Default',
    description: 'Stylish and sophisticated design for fashion stores',
    image: '/assets/templates/default.png',
    preview: '/assets/templates/default.png',
  },
];

// ----------------------------------------------------------------------

export default function StoreTemplateForm() {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const { updateUser, user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(user?.store?.theme_name);

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // TODO: Replace with your actual API call
      // const response = await updateStoreTemplate({ template: selectedTemplate });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await updateTheme({ theme_name: selectedTemplate })
      await updateStoreConfig({ config: { theme_name: selectedTemplate } })

      // Update user session with new template
      // updateUser({
      //   store: {
      //     ...user.store,
      //     template: selectedTemplate,
      //   }
      // });

      enqueueSnackbar(t('template_updated_successfully'), { variant: 'success' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  return (
    <Stack spacing={3}>


      <Box sx={{ display: 'flex', justifyContent: 'end' }}>
        <LoadingButton
          size="large"
          type="button"
          variant="contained"
          loading={loading}
          onClick={handleSubmit}
          disabled={!selectedTemplate}
        >
          {t('apply_template')}
        </LoadingButton>
      </Box>
      <Alert severity="info">
        <AlertTitle>{t('template_selection_guide')}</AlertTitle>
        {t('template_selection_description')}
      </Alert>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t('choose_your_store_template')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('select_template_description')}
            </Typography>
          </Box>


          <Grid container spacing={3}>
            {TEMPLATES.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    position: 'relative',
                    border: (theme) =>
                      selectedTemplate === template.id
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.customShadows.z20,
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleTemplateSelect(template.id)}>
                    <SingleFilePreviewLazy
                      imgUrl={template.image}
                      alt={template.title}
                      sx={{
                        height: 150,
                        bgcolor: 'grey.200',
                      }}
                    />
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Typography variant="h6" component="div">
                            {t(`template_${template.id}`)}
                          </Typography>
                          <Radio
                            checked={selectedTemplate === template.id}
                            value={template.id}
                            sx={{ p: 0 }}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {t(`template_${template.id}_description`)}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>

                  {selectedTemplate === template.id && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="eva:checkmark-fill" width={20} />
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>


        </Stack>
      </Card>
    </Stack>
  );
}
