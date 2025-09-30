"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, BarChart3, RefreshCw, Bot, User, Download, Share, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to SkillEdge-AI Assistant! I\'m here to help you with:\n\n🤖 **General Questions**: Ask me anything about SkillEdge-AI platform, features, and how to use them.\n\n📊 **Report Analysis**: Get personalized insights about your interview performance based on your reports.\n\nSelect a mode above and let\'s get started!',
      timestamp: new Date(),
      sources: ['SkillEdge-AI Knowledge Base']
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [includeReports, setIncludeReports] = useState(false);
  const [conversations, setConversations] = useState([]);
  
  const messagesEndRef = useRef(null);
  const { user, isLoaded } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/conversations`, {
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: conversationId,
          include_reports: includeReports
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: data.message,
        timestamp: new Date(data.timestamp),
        sources: data.sources
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(data.conversation_id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      const errorMessage = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Welcome to SkillEdge-AI Assistant! I\'m here to help you with:\n\n🤖 **General Questions**: Ask me anything about SkillEdge-AI platform, features, and how to use them.\n\n📊 **Report Analysis**: Get personalized insights about your interview performance based on your reports.\n\nSelect a mode above and let\'s get started!',
        timestamp: new Date(),
        sources: ['SkillEdge-AI Knowledge Base']
      }
    ]);
    setConversationId(null);
  };

  const exportConversation = () => {
    const conversationText = messages.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}\nTime: ${msg.timestamp.toLocaleString()}\n${msg.sources ? `Sources: ${msg.sources.join(', ')}\n` : ''}\n---\n`
    ).join('\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skilledge-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Conversation exported successfully!');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const suggestedQuestions = includeReports ? [
    "Why does my report say I speak too fast?",
    "How can I improve my body language?",
    "What do my low confidence scores mean?",
    "Help me understand my verbal analysis"
  ] : [
    "What is SkillEdge-AI?",
    "How do I start my first interview?",
    "What types of reports do you generate?",
    "How can SkillEdge-AI help me improve?"
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Please sign in to use the SkillEdge-AI Assistant.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-2">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    SkillEdge-AI Assistant
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your AI-powered career guidance companion
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={exportConversation} disabled={messages.length <= 1}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" onClick={clearConversation}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Chat Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant={!includeReports ? "default" : "outline"}
                    onClick={() => setIncludeReports(false)}
                    className="w-full justify-start"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    General Q&A
                  </Button>
                  <Button
                    variant={includeReports ? "default" : "outline"}
                    onClick={() => setIncludeReports(true)}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Report Analysis
                  </Button>
                </CardContent>
              </Card>

              {/* Suggested Questions */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Suggested Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => setInput(question)}
                      className="w-full text-left text-xs h-auto p-2 whitespace-normal"
                    >
                      {question}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={includeReports ? "default" : "secondary"}>
                        {includeReports ? "Report Analysis Mode" : "General Q&A Mode"}
                      </Badge>
                      {conversationId && (
                        <Badge variant="outline" className="text-xs">
                          Session: {conversationId.slice(-8)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {messages.length - 1} messages
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : message.isError 
                              ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                        } rounded-2xl px-4 py-3 shadow-sm`}>
                          <div className="flex items-start space-x-3">
                            {message.role === 'assistant' && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {message.role === 'user' && (
                              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              <div className="flex items-center justify-between mt-3">
                                <span className={`text-xs ${
                                  message.role === 'user' 
                                    ? 'text-white/70' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatTime(message.timestamp)}
                                </span>
                                {message.sources && (
                                  <div className="flex flex-wrap gap-1">
                                    {message.sources.map((source, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {source}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        includeReports 
                          ? "Ask about your interview reports..." 
                          : "Ask about SkillEdge-AI..."
                      }
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="px-6"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;