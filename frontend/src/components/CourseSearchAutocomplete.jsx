import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { searchCourses } from '../services/courseService';

/**
 * CourseSearchAutocomplete Component
 * 
 * Features:
 * - Search courses by ID or name (minimum 2 characters)
 * - Debounce to reduce API calls (300ms)
 * - AbortController for cancelling in-flight requests (race condition prevention)
 * - Loading state with spinner
 * - Auto-navigate to course on selection
 * - Centered responsive width (max 560px)
 */
const CourseSearchAutocomplete = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [value, setValue] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Debounce and race condition management
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Fetch courses from backend search endpoint
   */
  const fetchCourses = useCallback(async (query) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // If query is too short, clear options and return
    if (!query || query.trim().length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    try {
      abortControllerRef.current = new AbortController();
      setLoading(true);

      const data = await searchCourses(query, 10);
      
      // Only apply results if request wasn't aborted (prevents race conditions)
      if (!abortControllerRef.current.signal.aborted) {
        setOptions(data);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err);
        setOptions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Debounced search handler
   */
  const handleInputChange = useCallback(
    (event, newInputValue, reason) => {
      setInputValue(newInputValue);

      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Only search on input change
      if (reason === 'input') {
        if (newInputValue && newInputValue.trim().length >= 2) {
          // Set new debounce timer (300ms)
          debounceTimerRef.current = setTimeout(() => {
            fetchCourses(newInputValue);
          }, 300);
        } else {
          // Clear options if input is too short
          setOptions([]);
        }
      }
    },
    [fetchCourses]
  );

  /**
   * Handle course selection
   */
  const handleChange = useCallback(
    (event, selectedOption) => {
      if (selectedOption) {
        setValue(selectedOption);
        // Navigate to course detail page
        navigate(`/courses/${selectedOption.id}`);
        // Clear input
        setInputValue('');
        setOptions([]);
        setValue(null);
      }
    },
    [navigate]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Determine no options text based on input length and results
   */
  const noOptionsText = () => {
    if (!inputValue || inputValue.trim().length < 2) {
      return 'Type at least 2 characters';
    }
    return 'No courses found';
  };

  return (
    <Box
      sx={{
        flex: 1,
        maxWidth: { xs: '100%', sm: 420, md: 520 },
        mx: 'auto',
        px: { xs: 1, sm: 2 },
      }}
    >
      <Autocomplete
        freeSolo
        options={options}
        value={value}
        inputValue={inputValue}
        onChange={handleChange}
        onInputChange={handleInputChange}
        loading={loading && inputValue.trim().length >= 2}
        getOptionLabel={(option) =>
          typeof option === 'string'
            ? option
            : `${option.id} - ${option.name}`
        }
        filterOptions={(x) => x} // Disable client-side filtering; backend is source of truth
        isOptionEqualToValue={(option, val) =>
          option && val && option.id === val.id
        }
        noOptionsText={noOptionsText()}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Typography variant="body2">
              {`${option.id} - ${option.name}`}
            </Typography>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search course…"
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color: '#999',
                      fontSize: '20px',
                      ml: 0.5,
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading && inputValue.trim().length >= 2 ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#f5f5f5',
                '&:hover': {
                  backgroundColor: '#efefef',
                },
                '&.Mui-focused': {
                  backgroundColor: '#ffffff',
                  '& fieldset': {
                    borderColor: '#00D9A3',
                  },
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e0e0e0',
              },
              '& input::placeholder': {
                color: '#999',
                opacity: 1,
              },
            }}
          />
        )}
        ListboxProps={{
          style: {
            maxHeight: '300px',
          },
        }}
      />
    </Box>
  );
};

export default CourseSearchAutocomplete;

