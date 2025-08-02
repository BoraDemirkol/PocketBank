import React from 'react';
import { Button, Dropdown} from '../node_modules/antd';
import { GlobalOutlined, DownOutlined } from '@ant-design/icons';
import i18n from './i18n';

const LanguageDropdown: React.FC = () => {
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language); // optional: persist language
  };

  const items = [
    {
      key: 'en',
      label: 'English',
      onClick: () => changeLanguage('en'),
    },
    {
      key: 'tr',
      label: 'Türkçe',
      onClick: () => changeLanguage('tr'),
    },
  ];

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en' ? 'English' : 'Türkçe';
  };

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button
        type="text"
        style={{
          color: 'white',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <GlobalOutlined />
        {getCurrentLanguageLabel()}
        <DownOutlined style={{ fontSize: '10px' }} />
      </Button>
    </Dropdown>
  );
};

export default LanguageDropdown;
