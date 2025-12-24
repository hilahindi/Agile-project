import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAuth } from '../services/authService';

const Navbar = ({ currentPage, onNavigate, onLogout }) => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action) => {
    handleMenuClose();
    if (action === 'profile') {
      onNavigate('profile');
    } else if (action === 'reviews') {
      // TODO: Navigate to reviews page when route exists
      console.log('Navigate to reviews');
    } else if (action === 'logout') {
      onLogout();
    }
  };

  // Get user's first name and initial
  const userName = currentUser?.name || 'User';
  const firstName = userName.split(' ')[0];
  const initial = userName.charAt(0).toUpperCase();

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: '#ffffff',
        color: '#333',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        borderBottom: '1px solid #e5e5e5',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 2, sm: 4 },
          py: 1.5,
        }}
      >
        {/* Left: Logo/App Name */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            minWidth: 'fit-content',
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00D9A3 0%, #00A880 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
            }}
          >
            A
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '20px',
              letterSpacing: '-0.5px',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Afeka Advisor
          </Typography>
        </Box>

        {/* Center: Navigation Links */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flex: 1,
            ml: 4,
          }}
        >
          {/* Dashboard */}
          <Button
            onClick={() => onNavigate('dashboard')}
            sx={{
              position: 'relative',
              color: currentPage === 'dashboard' ? '#00D9A3' : '#666',
              backgroundColor: 'transparent',
              fontSize: '14px',
              fontWeight: currentPage === 'dashboard' ? 600 : 500,
              textTransform: 'none',
              px: 2,
              py: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#00D9A3',
                backgroundColor: 'transparent',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: currentPage === 'dashboard' ? '60%' : '0%',
                height: '2px',
                backgroundColor: '#00D9A3',
                borderRadius: '1px',
                transition: 'width 0.2s ease',
              },
            }}
          >
            Dashboard
          </Button>

          {/* Submit Review */}
          <Button
            onClick={() => onNavigate('review')}
            variant={currentPage === 'review' ? 'outlined' : 'text'}
            sx={{
              position: 'relative',
              color: currentPage === 'review' ? '#00D9A3' : '#666',
              borderColor: currentPage === 'review' ? '#00D9A3' : '#ddd',
              fontSize: '14px',
              fontWeight: currentPage === 'review' ? 600 : 500,
              textTransform: 'none',
              px: 2,
              py: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 217, 163, 0.04)',
                borderColor: '#00D9A3',
                color: '#00D9A3',
              },
            }}
          >
            Submit Review
          </Button>
        </Box>

        {/* Right: User Menu */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            ml: 'auto',
          }}
        >
          <Box
            onClick={handleMenuOpen}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="user-menu"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 0.5 : 1,
              px: 1.5,
              py: 1,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '&:focus-within': {
                outline: '2px solid #00D9A3',
                outlineOffset: '2px',
              },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                backgroundColor: '#00D9A3',
                color: 'white',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {initial}
            </Avatar>

            {!isMobile && (
              <>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#333',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px',
                  }}
                >
                  {firstName}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '16px',
                    color: '#999',
                    ml: 0.5,
                  }}
                >
                  ▼
                </Typography>
              </>
            )}

            {isMobile && (
              <Typography
                sx={{
                  fontSize: '16px',
                  color: '#999',
                }}
              >
                ▼
              </Typography>
            )}
          </Box>
        </Box>
      </Toolbar>

      {/* User Dropdown Menu */}
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: '240px',
            mt: 1,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 2 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#333',
            }}
          >
            {currentUser?.name || 'User'}
          </Typography>
          <Typography
            sx={{
              fontSize: '12px',
              color: '#999',
              mt: 0.5,
            }}
          >
            {currentUser?.name ? `@${currentUser.name.split(' ')[0].toLowerCase()}` : 'Account'}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* My Profile */}
        <MenuItem
          onClick={() => handleMenuItemClick('profile')}
          sx={{
            fontSize: '14px',
            color: '#333',
            py: 1.2,
            px: 2,
            '&:hover': {
              backgroundColor: '#f5f5f5',
              color: '#00D9A3',
            },
          }}
        >
          My Profile
        </MenuItem>

        {/* My Reviews */}
        <MenuItem
          onClick={() => handleMenuItemClick('reviews')}
          sx={{
            fontSize: '14px',
            color: '#333',
            py: 1.2,
            px: 2,
            '&:hover': {
              backgroundColor: '#f5f5f5',
              color: '#00D9A3',
            },
          }}
        >
          My Reviews
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        {/* Sign Out */}
        <MenuItem
          onClick={() => handleMenuItemClick('logout')}
          sx={{
            fontSize: '14px',
            color: '#d32f2f',
            py: 1.2,
            px: 2,
            '&:hover': {
              backgroundColor: '#fff5f5',
              color: '#c62828',
            },
          }}
        >
          Sign out
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar;
