// ----------------------------------------------------------------------

export function iconButton(theme) {
  return {
    MuiIconButton: {
      styleOverrides: {
        root: {
          // WCAG 2.5.5: minimum 44×44px touch target
          minWidth: 44,
          minHeight: 44,
        },
        sizeSmall: {
          minWidth: 36,
          minHeight: 36,
        },
      },
    },
  };
}
