import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { Card, Form, Input, Button, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'

const ResetPassword = () => {
  const { updatePassword } = useAuth()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)

  const [form] = Form.useForm()

  useEffect(() => {
    // Check if we have access token from URL (password reset flow)
    const accessToken = searchParams.get('access_token')
    if (accessToken) {
      // Store the token for later use
      localStorage.setItem('resetToken', accessToken)
    }
  }, [searchParams, t])

  const handlePasswordReset = async (values: { password: string }) => {
    setLoading(true)
    try {
      const { error } = await updatePassword(values.password)
      if (error) {
        message.error(t('passwordResetError'))
      } else {
        message.success(t('passwordResetSuccess'))
        form.resetFields()
      }
    } catch {
      message.error(t('passwordResetError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '20px' }}>
      <h1>{t('resetPassword')}</h1>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePasswordReset}
        >
          <Form.Item
            name="password"
            label={t('newPassword')}
            rules={[
              { required: true, message: t('passwordRequired') },
              { min: 6, message: t('passwordMinLength') }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('enterNewPassword')} />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={t('confirmPassword')}
            dependencies={['password']}
            rules={[
              { required: true, message: t('confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error(t('passwordsDoNotMatch')))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('confirmNewPassword')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              {t('resetPassword')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ResetPassword