import React from 'react';
import { Card } from 'antd';
import { useTranslation } from 'react-i18next';

interface UserBalance {
  userId: string;
  balance: number;
  currency: string;
}

interface BalanceCardProps {
  balance: UserBalance | null;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance }) => {
  const { t } = useTranslation();

  return (
    <Card title={t('accountBalance')} variant="outlined">
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
        ${balance?.balance?.toFixed(2)} {balance?.currency}
      </div>
      <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
        {t('accountBalance')}
      </p>
    </Card>
  );
};

export default BalanceCard;