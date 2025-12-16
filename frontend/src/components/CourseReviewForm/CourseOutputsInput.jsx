import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

const suggestedOutputs = [
  'Final Project',
  'Mini Project',
  'Web Application',
  'Mobile Application',
  'REST API',
  'CRUD App',
  'Database Schema',
  'Machine Learning Model',
  'Data Pipeline',
  'Deep Learning Model',
  'Simulation',
  'Research Paper',
  'Technical Report',
  'CLI Tool',
  'Dashboard',
  'UI Prototype',
  'Game',
  'Automation Script',
  'Notebook Analysis (Jupyter)',
  'Microservice',
];

/**
 * CourseOutputsInput Component
 *
 * A Material UI Autocomplete component for selecting course outputs.
 * Supports multiple selections, custom input, and suggested options.
 * Prevents duplicate entries using Set.
 */
const CourseOutputsInput = ({ value = [], onChange }) => {
  const handleChange = (event, newValue) => {
    // Remove duplicates using Set
    const uniqueValues = Array.from(new Set(newValue));
    onChange(uniqueValues);
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      fullWidth
      options={suggestedOutputs}
      value={value}
      onChange={handleChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Course Outputs"
          placeholder="Type an output and press Enter"
          variant="outlined"
          size="medium"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': {
                borderColor: '#ddd',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00D9A3',
                boxShadow: '0 0 0 3px rgba(0, 217, 163, 0.1)',
              },
            },
            '& .MuiInputBase-input': {
              fontSize: '0.95rem',
            },
            '& .MuiFormLabel-root.Mui-focused': {
              color: '#00D9A3',
            },
            '& .MuiAutocomplete-tag': {
              height: 'auto',
              padding: '6px 8px',
              margin: '4px 4px',
              fontSize: '0.9rem',
              backgroundColor: '#00D9A3',
              color: '#1a1a1a',
            },
          }}
        />
      )}
      componentsProps={{
        paper: {
          sx: {
            '& .MuiAutocomplete-listbox': {
              maxHeight: '200px',
            },
          },
        },
      }}
      sx={{
        '& .MuiAutocomplete-inputRoot': {
          padding: '6px 8px',
          display: 'flex',
          flexWrap: 'wrap',
        },
        '& .MuiAutocomplete-input': {
          flexGrow: 1,
          minWidth: '200px !important',
          width: '100% !important',
        },
        '& .MuiOutlinedInput-root': {
          width: '100%',
        },
      }}
    />
  );
};

export default CourseOutputsInput;
