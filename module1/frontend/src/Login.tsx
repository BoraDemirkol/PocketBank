import React from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Input } from 'antd';

const Login: React.FC = () => (
  <>
    <Input placeholder="username" prefix={<UserOutlined />} />
    <br />
    <br />
    <Input placeholder="password" prefix={<LockOutlined />} />
  </>
);

export default Login;
