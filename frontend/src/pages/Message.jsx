import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket, setSocketToken } from '../socket/socket';
import { getChatHistory, getConnections, removeConnection, accessToken } from '../api/api';
import profilePlaceholder from '../assets/profile.png';

const Message = () => {
  const { id: connectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactUserId, setContactUserId] = useState('');
  const [contactImage, setContactImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await getChatHistory(connectionId);
        const msgs = res.data.data;
        setMessages(msgs);

        const otherUserMsg = msgs.find(m => m.senderId._id !== user._id);
        if (otherUserMsg) {
          setContactName(otherUserMsg.senderId.name);
          setContactUserId(otherUserMsg.senderId.userId);
          setContactImage(otherUserMsg.senderId.profileImage || '');
        } else {
          // No messages yet — derive contact from the connections list
          try {
            const connRes = await getConnections();
            const conn = connRes.data.data.find(c => c._id === connectionId);
            if (conn) {
              const other = conn.senderId._id === user._id ? conn.receiverId : conn.senderId;
              setContactName(other.name);
              setContactUserId(other.userId);
              setContactImage(other.profileImage || '');
            } else {
              setContactName('Connection');
            }
          } catch {
            setContactName('Connection');
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChatHistory();
  }, [connectionId, user._id]);

  useEffect(() => {
    setSocketToken(accessToken);
    const socket = getSocket();
    socket.connect();

    socket.on('connect', () => {
      socket.emit('join_room', connectionId);
    });

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    let typingTimeout;
    socket.on('user_typing', () => {
      setIsTyping(true);
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    });

    socket.on('message_error', (err) => {
      console.error(err);
    });

  return () => {
  socket.off('connect');
  socket.off('receive_message');
  socket.off('user_typing');
  socket.off('message_error');
  socket.disconnect();
  };
  }, [connectionId]);

  const handleRemoveConnection = async () => {
    if (!window.confirm(`Remove connection with ${contactName}? This will also delete all messages.`)) return;
    try {
      await removeConnection(contactUserId);
      navigate('/requests');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to remove connection');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const socket = getSocket();
    socket.emit('send_message', { connectionId, content: newMessage.trim() });
    setNewMessage('');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    const socket = getSocket();
    socket.emit('typing', { connectionId });
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', height: '80vh' }}>
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/requests')}
            style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ←
          </button>
          <img
            src={contactImage || profilePlaceholder}
            alt={contactName || 'Connection'}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
          <h3 style={{ margin: 0, flex: 1 }}>{contactName}</h3>
          {contactUserId && (
            <button
              onClick={handleRemoveConnection}
              style={{
                background: 'none',
                border: '1px solid #f87171',
                color: '#f87171',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap'
              }}
            >
              Remove Connection
            </button>
          )}
        </div>

        {/* Message Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', margin: 'auto' }}>
              Loading messages...
            </div>
          ) : (
            <>
              {messages.map(msg => {
                const isMe = msg.senderId._id === user._id;
                return (
                  <div key={msg._id} style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      background: isMe ? 'var(--primary-accent)' : '#333',
                      color: '#fff',
                      padding: '0.75rem 1rem',
                      borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                      lineHeight: '1.4'
                    }}>
                      {msg.content}
                    </div>
                    <span className="text-muted text-sm" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              {isTyping && (
                <div style={{
                  alignSelf: 'flex-start',
                  fontStyle: 'italic',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  marginTop: '-0.5rem'
                }}>
                  typing...
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '1rem', borderTop: '1px solid #333' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              style={{ margin: 0, flex: 1 }}
              placeholder="Type a message..." 
              value={newMessage}
              onChange={handleTyping}
            />
            <button className="btn" type="submit" style={{ width: 'auto' }} disabled={loading}>
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Message;
