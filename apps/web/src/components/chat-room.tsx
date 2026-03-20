'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Message = {
  id: string;
  roomId: string;
  username: string;
  message: string;
  createdAt: string;
};

type Props = {
  token: string;
};

export function ChatRoom({ token }: Props) {
  const [roomId, setRoomId] = useState('general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/chat`, {
      auth: {
        token
      }
    });

    socket.on('room:history', (history: Message[]) => {
      setMessages(history);
    });

    socket.on('room:message', (nextMessage: Message) => {
      setMessages((current) => [...current, nextMessage]);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    socketRef.current?.emit('room:join', { roomId });
  }, [roomId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    socketRef.current?.emit('room:message', {
      roomId,
      message
    });
    setMessage('');
  };

  return (
    <div className="chat-card">
      <div className="chat-toolbar">
        <label>
          Room
          <input value={roomId} onChange={(event) => setRoomId(event.target.value)} />
        </label>
      </div>

      <div className="chat-messages">
        {messages.map((item) => (
          <div className="chat-message" key={item.id}>
            <strong>{item.username}</strong>
            <span>{item.message}</span>
          </div>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          placeholder="Type a message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
