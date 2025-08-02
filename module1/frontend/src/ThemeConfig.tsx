// ThemeConfig.tsx
import { theme, ConfigProvider } from '../node_modules/antd';

const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#2E7D32',
    colorSuccess: '#4CAF50',
    colorWarning: '#FBC02D',
    colorError: '#E53935',
    colorInfo: '#0288D1',
    colorBgBase: '#F5F5F5',
    colorTextBase: '#1F2937',
    colorBgContainer: '#FFFFFF',
    colorText: '#1F2937',
    colorTextPlaceholder: '#9CA3AF',
    colorBorder: '#D1D5DB',
  },
  components: {
    Input: {
      colorBgContainer: '#FFFFFF',
      colorText: '#1F2937',
      colorTextPlaceholder: '#9CA3AF',
      colorBorder: '#D1D5DB',
      colorPrimaryBorder: '#2E7D32',
      colorPrimaryHover: '#2E7D32',
    },
    Form: {
      itemMarginBottom: 16,
    },
  },
};

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#81C784',
    colorSuccess: '#81C784',
    colorWarning: '#FFF176',
    colorError: '#EF9A9A',
    colorInfo: '#4FC3F7',
    colorBgBase: '#121212',
    colorTextBase: '#F3F4F6',
    colorBgContainer: '#2A2A2A',
    colorText: '#F3F4F6',
    colorTextPlaceholder: '#6B7280',
    colorBorder: '#374151',
    colorBgElevated: '#2A2A2A',
  },
  components: {
    Input: {
      colorBgContainer: '#2A2A2A',
      colorText: '#F3F4F6',
      colorTextPlaceholder: '#6B7280',
      colorBorder: '#374151',
      colorPrimaryBorder: '#81C784',
      colorPrimaryHover: '#81C784',
    },
    Form: {
      itemMarginBottom: 16,
    },
  },
};

export { lightTheme, darkTheme };