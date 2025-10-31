/**
 * NotificationCenter.jsx
 * 
 * Composant de gestion des notifications internes
 * - Affiche un badge avec le nombre de messages non lus
 * - Popup pour voir/lire/supprimer les messages
 * - Lien vers les paramètres de notifications
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, X, Check, Trash2, Settings } from 'lucide-react';
import './NotificationCenter.css';

export default function NotificationCenter() {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({});

  // Récupérer les notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/notifications/inbox?limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setUnreadCount(data.unread || 0);
      }
    } catch (error) {
      console.error('❌ Fetch notifications error:', error);
    }
  }, []);

  // Récupérer les préférences
  const fetchPreferences = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/notifications/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences || {});
      }
    } catch (error) {
      console.error('❌ Fetch preferences error:', error);
    }
  }, []);

  // Marquer comme lu
  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/notifications/mark-read/${messageId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('❌ Mark read error:', error);
    }
  };

  // Supprimer un message
  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/notifications/message/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
    }
  };

  // Marquer tout comme lu
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('❌ Mark all read error:', error);
    }
  };

  // Mettre à jour les préférences
  const updatePreference = async (key, value) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [key]: value })
      });

      if (res.ok) {
        fetchPreferences();
      }
    } catch (error) {
      console.error('❌ Update preferences error:', error);
    }
  };

  // Initialisation et polling
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchPreferences]);

  return (
    <div className="notification-center">
      {/* Bouton cloche */}
      <button
        className="bell-button"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowPreferences(false);
        }}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Popup de notifications */}
      {isOpen && (
        <div className="notification-popup">
          {/* En-tête */}
          <div className="popup-header">
            <h3>Notifications {messages.length > 0 && `(${messages.length})`}</h3>
            <div className="header-actions">
              <button
                className="icon-button"
                onClick={() => setShowPreferences(!showPreferences)}
                title="Paramètres"
              >
                <Settings size={16} />
              </button>
              <button className="close-button" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="popup-content">
            {showPreferences ? (
              // Préférences de notification
              <div className="preferences-panel">
                <h4>Préférences de notification</h4>
                
                <label className="pref-item">
                  <input
                    type="checkbox"
                    checked={preferences.ticketNotifications !== false}
                    onChange={(e) => updatePreference('ticketNotifications', e.target.checked)}
                  />
                  <span>🎫 Notifications de tickets</span>
                </label>

                <label className="pref-item">
                  <input
                    type="checkbox"
                    checked={preferences.eventNotifications !== false}
                    onChange={(e) => updatePreference('eventNotifications', e.target.checked)}
                  />
                  <span>🎉 Notifications d'événements</span>
                </label>

                <label className="pref-item">
                  <input
                    type="checkbox"
                    checked={preferences.reportNotifications !== false}
                    onChange={(e) => updatePreference('reportNotifications', e.target.checked)}
                  />
                  <span>📋 Notifications de rapports</span>
                </label>

                <label className="pref-item">
                  <input
                    type="checkbox"
                    checked={preferences.maintenanceNotifications !== false}
                    onChange={(e) => updatePreference('maintenanceNotifications', e.target.checked)}
                  />
                  <span>⚠️ Alertes de maintenance</span>
                </label>

                <label className="pref-item">
                  <input
                    type="checkbox"
                    checked={preferences.systemNotifications !== false}
                    onChange={(e) => updatePreference('systemNotifications', e.target.checked)}
                  />
                  <span>🔔 Messages système</span>
                </label>
              </div>
            ) : (
              // Liste de messages
              <>
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <Bell size={48} />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {unreadCount > 0 && (
                      <div className="mark-all-read">
                        <button onClick={markAllAsRead}>
                          ✓ Marquer tout comme lu
                        </button>
                      </div>
                    )}

                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`message-item ${msg.readAt ? 'read' : 'unread'}`}
                      >
                        <div className="message-header">
                          <strong>{msg.title}</strong>
                          <small>
                            {formatTime(new Date(msg.createdAt))}
                          </small>
                        </div>

                        <div
                          className="message-content"
                          dangerouslySetInnerHTML={{
                            __html: msg.content
                          }}
                        />

                        <div className="message-footer">
                          <small className="type-badge">{msg.type}</small>
                          <div className="message-actions">
                            {!msg.readAt && (
                              <button
                                className="action-button"
                                onClick={() => markAsRead(msg.id)}
                                title="Marquer comme lu"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              className="action-button delete"
                              onClick={() => deleteMessage(msg.id)}
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Formate un timestamp relatif
 */
function formatTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;

  return date.toLocaleDateString('fr-FR');
}
