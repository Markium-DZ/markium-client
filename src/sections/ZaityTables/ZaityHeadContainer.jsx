import { Container, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { t } from 'i18next'
import React from 'react'
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs'
import { useSettingsContext } from 'src/components/settings'

const ZaityHeadContainer = ({ children, heading, links, action, mobileAction }) => {
      const settings = useSettingsContext();
      const theme = useTheme();
      const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Container maxWidth={settings.themeStretch ? false : 'lg'}>
            {isMobile ? (
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2, mt: 0.5 }}
                >
                    <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
                        {t(heading)}
                    </Typography>
                    {mobileAction}
                </Stack>
            ) : (
                <CustomBreadcrumbs
                    heading={t(heading)}
                    links={links}
                    action={
                        <>
                            {action}
                        </>
                    }
                    sx={{
                        mb: { xs: 3, md: 5 },
                    }}
                />
            )}
            {children}
        </Container>
    )
}

export default ZaityHeadContainer
