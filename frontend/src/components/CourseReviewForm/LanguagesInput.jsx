import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

const suggestedLanguages = [
  // Programming Languages
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C',
  'C#',
  'C++',
  'Go',
  'Rust',
  'Kotlin',
  'Swift',
  'Scala',
  'Ruby',
  'PHP',
  'R',

  // Web Technologies
  'HTML',
  'CSS',
  'Sass',
  'Tailwind CSS',

  // Frontend Frameworks
  'React',
  'Next.js',
  'Vue.js',
  'Angular',
  'Svelte',

  // Backend Technologies
  'Node.js',
  'Express',
  'FastAPI',
  'Flask',
  'Django',
  'Spring Boot',
  'ASP.NET Core',

  // Databases
  'SQL',
  'PostgreSQL',
  'MySQL',
  'SQLite',
  'MongoDB',
  'Redis',
  'Firebase',

  // DevOps / Cloud
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'Google Cloud',
  'CI/CD',
  'GitHub Actions',

  // Data / ML
  'Pandas',
  'NumPy',
  'Scikit-learn',
  'TensorFlow',
  'PyTorch',

  // Tools / Other
  'Git',
  'Linux',
  'Bash',
  'PowerShell',
  'REST API',
  'GraphQL',
];

/**
 * LanguagesInput Component
 *
 * A Material UI Autocomplete component for selecting programming languages.
 * Supports multiple selections, custom input, and suggested options.
 * Prevents duplicate entries using Set.
 */
const LanguagesInput = ({ value = [], onChange }) => {
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
      options={suggestedLanguages}
      value={value}
      onChange={handleChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Languages Learned"
          placeholder="Type a language and press Enter"
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

export default LanguagesInput;
