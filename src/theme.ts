import { createTheme } from '@mui/material';

// Minimaliste : noir et blanc, une seule couleur d'accent pour les états.
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#111111' },
        secondary: { main: '#6b6b6b' },
        background: { default: '#fafafa', paper: '#ffffff' },
        text: { primary: '#111111', secondary: '#6b6b6b' },
        divider: '#e6e6e6',
    },
    shape: { borderRadius: 8 },
    typography: {
        fontFamily:
            '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        h1: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.01em' },
        h2: { fontSize: '1.25rem', fontWeight: 600 },
        h3: { fontSize: '1rem', fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 500 },
    },
    components: {
        MuiButton: { defaultProps: { disableElevation: true } },
        MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: { root: { border: '1px solid #e6e6e6' } },
        },
        MuiAppBar: {
            defaultProps: { elevation: 0, color: 'inherit' },
            styleOverrides: { root: { borderLeft: 0, borderRight: 0, borderTop: 0 } },
        },
        MuiTextField: { defaultProps: { size: 'small' } },
        MuiSelect: { defaultProps: { size: 'small' } },
        MuiChip: { defaultProps: { size: 'small' } },
        MuiTableCell: { styleOverrides: { head: { fontWeight: 600, color: '#6b6b6b' } } },
    },
});

export { theme };
