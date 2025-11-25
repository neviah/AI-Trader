'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface Notification {
  id: string
  type: 'trade' | 'portfolio' | 'alert' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high'
  action?: {
    label: string
    url?: string
    onClick?: () => void
  }
}

interface RealTimeNotificationsProps {
  userId?: string
  onNotificationClick?: (notification: Notification) => void
}

export default function RealTimeNotifications({ 
  userId = 'demo-user', 
  onNotificationClick 
}: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Initialize with some demo notifications
  useEffect(() => {
    const demoNotifications: Notification[] = [
      {
        id: '1',
        type: 'trade',
        title: 'AI Trade Executed',
        message: 'Bought 50 shares of AAPL at $175.23',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'medium',
        action: { label: 'View Details', url: '/portfolio' }
      },
      {
        id: '2',
        type: 'portfolio',
        title: 'Portfolio Update',
        message: 'Your portfolio is up 2.4% today (+$1,247)',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        priority: 'low'
      },
      {
        id: '3',
        type: 'alert',
        title: 'Risk Alert',
        message: 'TSLA position down 8%, approaching stop-loss level',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        priority: 'high',
        action: { label: 'Review Position' }
      }
    ]
    
    setNotifications(demoNotifications)
    setUnreadCount(demoNotifications.filter(n => !n.read).length)
  }, [])

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly generate new notifications
      if (Math.random() > 0.7) {
        const newNotification = generateRandomNotification()
        addNotification(newNotification)
      }
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const generateRandomNotification = (): Notification => {
    const types = ['trade', 'portfolio', 'alert', 'info'] as const
    const type = types[Math.floor(Math.random() * types.length)]
    
    const templates = {
      trade: [
        'AI bought 25 shares of MSFT at $378.45',
        'AI sold 15 shares of GOOGL at $142.18',
        'AI added NVDA to portfolio (30 shares at $875.30)',
        'Stop-loss triggered: Sold 40 shares of AMD at $125.67'
      ],
      portfolio: [
        'Portfolio up 1.8% today (+$892)',
        'Portfolio down 0.9% today (-$456)',
        'New all-time high: $127,543',
        'Monthly return: +5.2% (+$2,847)'
      ],
      alert: [
        'High volatility detected in tech sector',
        'Market uncertainty: VIX up 12%',
        'Earnings season begins next week',
        'Fed announcement scheduled for 2:00 PM'
      ],
      info: [
        'AI analysis completed for 127 stocks',
        'Market data updated: 12,847 data points',
        'New risk management rules applied',
        'Weekly performance report available'
      ]
    }
    
    const messages = templates[type]
    const message = messages[Math.floor(Math.random() * messages.length)]
    
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message,
      timestamp: new Date(),
      read: false,
      priority: type === 'alert' ? 'high' : type === 'trade' ? 'medium' : 'low'
    }
  }

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 19)]) // Keep last 20
    setUnreadCount(prev => prev + 1)
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
    if (notifications.find(n => n.id === id && !n.read)) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'high' ? 'text-red-600' : 
                     priority === 'medium' ? 'text-blue-600' : 'text-gray-600'
    
    switch (type) {
      case 'trade': return <TrendingUp className={`w-5 h-5 ${iconClass}`} />
      case 'portfolio': return <DollarSign className={`w-5 h-5 ${iconClass}`} />
      case 'alert': return <AlertCircle className={`w-5 h-5 ${iconClass}`} />
      case 'info': return <Info className={`w-5 h-5 ${iconClass}`} />
      default: return <Bell className={`w-5 h-5 ${iconClass}`} />
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification('AI Trader Notifications', {
          body: 'You will now receive real-time trading notifications',
          icon: '/favicon.ico'
        })
      }
    }
  }

  return (
    <div className="relative" ref={notificationRef}>
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen && 'Notification' in window && Notification.permission === 'default') {
            requestNotificationPermission()
          }
        }}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications yet</p>
                  <p className="text-sm mt-1">You'll see real-time updates here</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      markAsRead(notification.id)
                      onNotificationClick?.(notification)
                      if (notification.action?.url) {
                        window.location.href = notification.action.url
                      }
                      notification.action?.onClick?.()
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                        <p className={`text-sm mt-1 ${
                          !notification.read ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {notification.action && (
                            <span className="text-xs text-blue-600 font-medium">
                              {notification.action.label}
                            </span>
                          )}
                        </div>
                        {!notification.read && (
                          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button className="text-sm text-gray-600 hover:text-gray-800">
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}