import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  styled,
} from '@mui/material';

const SearchField = styled(TextField)({
  width: '100%',
  minWidth: '300px',
  maxWidth: '300px',
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white',
    borderRadius: '6px',
    '&:hover fieldset': {
      borderColor: '#00D9A3',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#00D9A3',
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#999',
    opacity: 1,
  },
});

/**
 * CourseSearchAutocomplete Component
 * 
 * Features:
 * - Search courses by ID (numeric prefix) or name
 * - Debounce to reduce API calls (300ms)
 * - Client-side caching with Map (keyed by query)
 * - AbortController for cancelling in-flight requests
 * - Loading and error states
 * - Navigate to course detail page on selection
 */
const CourseSearchAutocomplete = ({ onNavigate }) => {
  const [inputValue, setInputValue] = useState('');
  const [value, setValue] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Cache and debounce management
  const cacheRef = useRef(new Map());
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Fetch courses from backend search endpoint
   */
  const fetchCourses = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setOptions([]);
      setError('');
      return;
    }

    // Check cache first
    const cacheKey = query.toLowerCase();
    if (cacheRef.current.has(cacheKey)) {
      setOptions(cacheRef.current.get(cacheKey));
      setError('');
      return;
    }

    try {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError('');

      const response = await fetch(
        `http://localhost:8000/api/courses/search?q=${encodeURIComponent(query)}&limit=10`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the results
      cacheRef.current.set(cacheKey, data);
      setOptions(data);
      
      if (data.length === 0) {
        setError('No courses found');
      } else {
        setError('');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Failed to search courses');
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

      // Only search on input change (not on blur or other reasons)
      if (reason === 'input') {
        if (newInputValue && newInputValue.trim().length > 0) {
          // Set new debounce timer (300ms)
          debounceTimerRef.current = setTimeout(() => {
            fetchCourses(newInputValue);
          }, 300);
        } else {
          // Clear options if input is empty
          setOptions([]);
          setError('');
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
      if (selectedOption && onNavigate) {
        setValue(selectedOption);
        setInputValue('');
        
        // Navigate to course detail page via onNavigate callback
        onNavigate(`/courses/${selectedOption.id}`);
      } else {
        setValue(null);
      }
    },
    [onNavigate]
  );

  // Cleanup abort controller on unmount
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

  return (
    <Box sx={{ position: 'relative' }}>
      <Autocomplete
        freeSolo
        options={options}
        value={value}
        inputValue={inputValue}
        onChange={handleChange}
        onInputChange={handleInputChange}
        loading={loading}
        getOptionLabel={(option) =>
          typeof option === 'string'
            ? option
            : `${option.id} - ${option.name}`
        }
        renderOption={(props, option) => (
          <li {...props}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {option.id} - {option.name}
              </Typography>
            </Box>
          </li>
        )}
        noOptionsText={
          error ? error : loading ? 'Searching...' : 'Start typing to search'
        }
        renderInput={(params) => (
          <SearchField
            {...params}
            placeholder="Search courses by ID or name..."
            variant="outlined"
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        slotProps={{
          popper: {
            modifiers: [
              {
                name: 'flip',
                enabled: true,
              },
            ],
          },
        }}
        isOptionEqualToValue={(option, val) =>
          option && val && option.id === val.id
        }
      />
    </Box>
  );
};

export default CourseSearchAutocomplete;
