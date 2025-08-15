import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { Card, Form, Input, Button, message, Switch } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'

const EditProfile = () => {
  const { user, updateProfile, updatePassword, enableMFA, disableMFA } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)

  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.user_metadata?.name || '',
        surname: user.user_metadata?.surname || '',
        profilePictureUrl: user.user_metadata?.profilePictureUrl || ''
      })
    }
  }, [user, form, t])

  const handleProfileUpdate = async (values: { name: string; surname: string; profilePictureUrl?: string }) => {
    setLoading(true)
    try {
      const { error } = await updateProfile(values)
      if (error) {
        message.error(t('profileUpdateError'))
      } else {
        message.success(t('profileUpdateSuccess'))
      }
    } catch {
      message.error(t('profileUpdateError'))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (values: { currentPassword: string; newPassword: string }) => {
    setLoading(true)
    try {
      const { error } = await updatePassword(values.newPassword)
      if (error) {
        message.error(t('passwordUpdateError'))
      } else {
        message.success(t('passwordUpdateSuccess'))
        passwordForm.resetFields()
      }
    } catch {
      message.error(t('passwordUpdateError'))
    } finally {
      setLoading(false)
    }
  }

  const handleMFAToggle = async (enabled: boolean) => {
    setMfaLoading(true)
    try {
      const { error } = enabled ? await enableMFA() : await disableMFA()
      if (error) {
        message.error(t('mfaToggleError'))
        setMfaEnabled(!enabled) // Revert the toggle
      } else {
        setMfaEnabled(enabled)
        message.success(enabled ? t('mfaEnabled') : t('mfaDisabled'))
      }
    } catch {
      message.error(t('mfaToggleError'))
      setMfaEnabled(!enabled) // Revert the toggle
    } finally {
      setMfaLoading(false)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <h1>{t('editProfile')}</h1>
      
      <Card title={t('profileInformation')} style={{ marginBottom: 20 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleProfileUpdate}
        >
          <Form.Item
            name="name"
            label={t('name')}
            rules={[{ required: true, message: t('nameRequired') }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('enterName')} />
          </Form.Item>

          <Form.Item
            name="surname"
            label={t('surname')}
            rules={[{ required: true, message: t('surnameRequired') }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('enterSurname')} />
          </Form.Item>

          <Form.Item
            name="profilePictureUrl"
            label={t('profilePictureUrl')}
          >
            <Input placeholder={t('enterProfilePictureUrl')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('updateProfile')}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title={t('securitySettings')} style={{ marginBottom: 20 }}>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordUpdate}
        >
          <Form.Item
            name="newPassword"
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
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
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
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('updatePassword')}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
                              <SafetyOutlined style={{ marginRight: 8 }} />
              {t('twoFactorAuthentication')}
            </div>
            <Switch
              checked={mfaEnabled}
              onChange={handleMFAToggle}
              loading={mfaLoading}
            />
          </div>
          <p style={{ color: '#666', fontSize: '14px', marginTop: 8 }}>
            {t('twoFactorDescription')}
          </p>
        </div>
      </Card>
    </div>
  )
}

export default EditProfile