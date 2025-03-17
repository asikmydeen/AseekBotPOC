import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './Sidebar';
import ChatMessage from './chat/ChatMessage';
import ChatInput from './chat/ChatInput';
import FileDropzone from './chat/FileDropzone';
import FileActionPrompt from './chat/FileActionPrompt';
import { Message, MessageType } from '@/types/chat';

const Container = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  &:hover {
    color: #666;
  }
`;

interface ChatInterfaceProps {
  initialMessages?: Message[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialMessages = [] }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [s3Files, setS3Files] = useState<any[]>([]);
  const [currentAction, setCurrentAction] = useState<string>('');

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDocumentAnalysisRequest = () => {
    setShowFileUploadModal(true);
    setCurrentAction('bid-analysis');
  };

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleS3Upload = (s3FileData: any[]) => {
    setS3Files(s3FileData);
  };

  const handleFileAction = (action: string) => {
    if (action === 'cancel') {
      setShowFileUploadModal(false);
      setUploadedFiles([]);
      setS3Files([]);
      return;
    }

    if (action === 'bid-analysis' && s3Files.length > 0) {
      const prompt = "Perform bid document analysis on the attached file(s).";
      sendMessage(prompt, s3Files);
      setShowFileUploadModal(false);
      setUploadedFiles([]);
      setS3Files([]);
    } else if (action === 'send-message' && s3Files.length > 0) {
      // Just close the modal and let the user type their message
      setShowFileUploadModal(false);
      // Keep the s3Files for when the user sends a message
    }
  };

  const sendMessage = async (content: string, files: any[] = []) => {
    if (!content.trim() && files.length === 0) return;

    const userMessage: Message = {
      id: uuidv4(),
      content,
      type: MessageType.USER,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', content);
      
      // Add file information if available
      if (files.length > 0 || s3Files.length > 0) {
        const filesToSend = files.length > 0 ? files : s3Files;
        formData.append('s3Files', JSON.stringify(filesToSend));
      }

      const response = await fetch('/api/processChatMessage', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const botMessage: Message = {
        id: uuidv4(),
        content: data.response,
        type: MessageType.BOT,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
      
      // Clear s3Files after sending
      if (s3Files.length > 0) {
        setS3Files([]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        content: 'Sorry, there was an error processing your request. Please try again.',
        type: MessageType.ERROR,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Sidebar onDocumentAnalysis={handleDocumentAnalysisRequest} />
      <ChatContainer>
        <MessagesContainer>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>
        <ChatInput onSendMessage={(content) => sendMessage(content, s3Files)} isLoading={isLoading} />
      </ChatContainer>

      {showFileUploadModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Upload Document for Analysis</ModalTitle>
              <CloseButton onClick={() => setShowFileUploadModal(false)}>×</CloseButton>
            </ModalHeader>
            <FileDropzone 
              onFilesUploaded={handleFileUpload} 
              onS3Upload={handleS3Upload}
            />
            {s3Files.length > 0 && (
              <FileActionPrompt onAction={handleFileAction} />
            )}
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default ChatInterface;