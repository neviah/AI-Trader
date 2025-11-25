'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Eye, EyeOff, Check, X } from 'lucide-react'

interface ValidationRule {
  test: (value: string) => boolean
  message: string
  met?: boolean
}

interface FormValidation {
  email: ValidationRule[]
  username: ValidationRule[]
  password: ValidationRule[]
  full_name: ValidationRule[]
}

export default function RegistrationForm() {
  const { register, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Validation rules
  const validationRules: FormValidation = {
    email: [
      {
        test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Must be a valid email address',
      },
    ],
    username: [
      {
        test: (value) => value.length >= 3,
        message: 'At least 3 characters long',
      },
      {
        test: (value) => value.length <= 50,
        message: 'Less than 50 characters',
      },
      {
        test: (value) => /^[a-zA-Z0-9_-]+$/.test(value),
        message: 'Only letters, numbers, underscores, and hyphens',
      },
    ],
    password: [
      {
        test: (value) => value.length >= 8,
        message: 'At least 8 characters long',
      },
      {
        test: (value) => /[A-Z]/.test(value),
        message: 'At least one uppercase letter',
      },
      {
        test: (value) => /[a-z]/.test(value),
        message: 'At least one lowercase letter',
      },
      {
        test: (value) => /\d/.test(value),
        message: 'At least one number',
      },
      {
        test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
        message: 'At least one special character',
      },
    ],
    full_name: [
      {
        test: (value) => !value || value.length >= 2,
        message: 'At least 2 characters if provided',
      },
    ],
  }

  // Check validation for a field
  const getFieldValidation = (field: keyof FormValidation, value: string) => {
    return validationRules[field].map(rule => ({
      ...rule,
      met: rule.test(value)
    }))
  }

  // Check if form is valid
  const isFormValid = () => {
    return Object.keys(formData).every(field => {
      const fieldRules = validationRules[field as keyof FormValidation]
      return fieldRules.every(rule => rule.test(formData[field as keyof typeof formData]))
    })
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    clearError()
  }

  const handleInputFocus = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      email: true,
      username: true,
      password: true,
      full_name: true,
    })

    if (!isFormValid()) {
      return
    }

    try {
      await register(formData)
    } catch (error) {
      // Error is handled in the auth store
    }
  }

  const ValidationIndicator = ({ rules, value, fieldName }: { 
    rules: ValidationRule[], 
    value: string, 
    fieldName: string 
  }) => {
    const validations = getFieldValidation(fieldName as keyof FormValidation, value)
    const shouldShow = touched[fieldName] && value.length > 0

    if (!shouldShow) return null

    return (
      <div className="mt-2 space-y-1">
        {validations.map((validation, index) => (
          <div 
            key={index} 
            className={`flex items-center text-xs ${
              validation.met ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {validation.met ? (
              <Check size={12} className="mr-1 flex-shrink-0" />
            ) : (
              <X size={12} className="mr-1 flex-shrink-0" />
            )}
            <span>{validation.message}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🤖 AI Trader</h1>
        <p className="text-gray-600 mt-2">Create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name (Optional)
          </label>
          <input
            type="text"
            className="input"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            onFocus={() => handleInputFocus('full_name')}
            placeholder="Your full name"
          />
          <ValidationIndicator 
            rules={validationRules.full_name}
            value={formData.full_name}
            fieldName="full_name"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username *
          </label>
          <input
            type="text"
            required
            className="input"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            onFocus={() => handleInputFocus('username')}
            placeholder="Choose a username"
          />
          <ValidationIndicator 
            rules={validationRules.username}
            value={formData.username}
            fieldName="username"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            className="input"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onFocus={() => handleInputFocus('email')}
            placeholder="your@email.com"
          />
          <ValidationIndicator 
            rules={validationRules.email}
            value={formData.email}
            fieldName="email"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              className="input pr-10"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onFocus={() => handleInputFocus('password')}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <ValidationIndicator 
            rules={validationRules.password}
            value={formData.password}
            fieldName="password"
          />
        </div>

        {/* Server Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            <strong>Registration Failed:</strong> {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !isFormValid()}
          className={`w-full btn-primary ${
            (!isFormValid() || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            className="text-primary-600 hover:text-primary-500 font-medium"
            onClick={() => window.location.href = '/login'}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}