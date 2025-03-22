import React from 'react';
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';
import { Box, CircularProgress, Typography } from '@mui/material';

interface DocPreviewProps {
  url: string;
}

const DocPreview: React.FC<DocPreviewProps> = ({ url }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const docs = [
    {
      uri: url,
      fileType: url.toLowerCase().endsWith('.docx') ? 'docx' : 'doc',
    }
  ];

  const handleDocumentLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load document. Please try downloading instead.');
  };

  return (
    <Box sx={{ width: '100%', height: '500px', position: 'relative' }}>
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {error ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}
        >
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <DocViewer
          documents={docs}
          pluginRenderers={DocViewerRenderers}
          config={{
            header: {
              disableHeader: true,
              disableFileName: true,
              retainURLParams: false
            }
          }}
          style={{
            height: '100%',
            width: '100%',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
          theme={{
            primary: '#fff',
            secondary: '#fff',
            tertiary: '#fff',
            text_primary: '#000',
            text_secondary: '#000',
            text_tertiary: '#000',
            disableThemeScrollbar: false,
          }}
        />
      )}
    </Box>
  );
};export default DocPreview;