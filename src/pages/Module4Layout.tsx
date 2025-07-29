// Module4Layout.tsx
import React, { ReactNode } from 'react';
import { Box, Divider } from '@mui/material';

interface Module4LayoutProps {
  renderCreate: ReactNode;
  renderList: ReactNode;
}

const Module4Layout: React.FC<Module4LayoutProps> = ({
  renderCreate,
  renderList,
}) => {
  return (
    <Box>
      {/* Yeni Bütçe Oluştur Section */}
      <Box sx={{ mb: 4 }}>
        {renderCreate}
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Bütçelerim Section */}
      <Box>
        {renderList}
      </Box>
    </Box>
  );
};

export default Module4Layout;
