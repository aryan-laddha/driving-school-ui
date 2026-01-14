// src/theme/theme.js
import { createTheme } from '@mui/material/styles';

const customTheme = createTheme({
  palette: {
    primary: {
      main: '#212121', // Darker black for primary text/icons
    },
    // Define a custom color for the main dark button, ensuring contrast
    darkBtn: {
        main: '#1E1E1E', // Very dark color for buttons
        contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#42a5f5', // Blue for accents
    },
    background: {
      default: '#f5f5f5', // Light background shade
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: ['Roboto', 'sans-serif'].join(','),
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
        // Apply the custom darkBtn color to the default contained button style
        containedPrimary: {
          backgroundColor: '#1E1E1E',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#424242',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#000000', // Black Navbar
        },
      },
    },
    // ... (other components remain the same)
    MuiDrawer: {
        styleOverrides: {
            paper: {
                backgroundColor: '#f9f9f9', // Light shade for Sidebar
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: '12px', // Slightly larger border radius for modern feel
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', // Subtle shadow
            }
        }
    }
  },
});

export default customTheme;