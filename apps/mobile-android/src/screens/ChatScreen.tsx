import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Conversation, Message } from '../types';
import { ChannelBadge } from '../components/ChannelBadge';
import { CannedResponseBar } from '../components/CannedResponseBar';
import { CustomerModal } from '../components/CustomerModal';
import { mobileApi } from '../services/api.service';
import { mobileSocket } from '../services/socket.service';

interface Props {
  conversation: Conversation;
  onBack: () => void;
  lang?: 'my' | 'en';
}

export const ChatScreen: React.FC<Props> = ({ conversation, onBack, lang = 'my' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isBotHandling, setIsBotHandling] = useState(conversation.handoverStatus === 'BOT_HANDLING');
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const flatListRef = useRef<any>(null);
  const isMy = lang === 'my';

  const loadMessages = async () => {
    try {
      const data = await mobileApi.getMessages(conversation.id);
      setMessages(data);
    } catch (e) {
      console.warn('Err load messages:', e);
    }
  };

  useEffect(() => {
    loadMessages();
    mobileSocket.joinConversation(conversation.id);

    // Incoming messages
    const handleNewMessage = (payload: any) => {
      if (payload.message && payload.message.conversationId === conversation.id) {
        setMessages((prev) => [...prev, payload.message]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    };

    mobileSocket.onIncomingMessage(handleNewMessage);
    mobileSocket.onOutgoingMessage(handleNewMessage);

    return () => {
      mobileSocket.leaveConversation(conversation.id);
    };
  }, [conversation.id]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const sent = await mobileApi.sendMessage(conversation.id, textToSend, false);
      if (sent) {
        setMessages((prev) => [...prev, sent]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    } catch (e) {
      console.warn('Send message failed:', e);
    }
  };

  const handleToggleHandover = async () => {
    const nextStatus = isBotHandling ? 'TRANSFERRED_TO_AGENT' : 'BOT_HANDLING';
    setIsBotHandling(!isBotHandling);
    try {
      await mobileApi.toggleHandover(conversation.id, nextStatus);
    } catch (e) {
      console.warn('Toggle handover failed:', e);
    }
  };

  const handleRequestPhone = async () => {
    const promptText = 'လူကြီးမင်း၏ အော်ဒါအား အမြန်ဆုံး ပို့ဆောင်ပေးနိုင်ရန် ဆက်သွယ်ရမည့် ဖုန်းနံပါတ်လေး ပြောပြပေးပါခင်ဗျာ။ (သို့မဟုတ် "ဖုန်းနံပါတ် ပေးပို့ရန် / Share My Phone number" ခလုတ်ကို နှိပ်ပေးပါခင်ဗျာ) 🙏';
    setInputText(promptText);
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCustomer = item.senderType === 'CUSTOMER';
    const isBot = item.senderType === 'BOT';
    const isAgent = item.senderType === 'AGENT';

    return (
      <View
        style={[
          styles.msgRow,
          isCustomer ? styles.msgRowLeft : styles.msgRowRight,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isCustomer && styles.customerBubble,
            isBot && styles.botBubble,
            isAgent && styles.agentBubble,
          ]}
        >
          {/* Header indicator */}
          <View style={styles.bubbleHeader}>
            <Text
              style={[
                styles.senderLabel,
                isAgent ? styles.agentSenderLabel : styles.defaultSenderLabel,
              ]}
            >
              {isBot ? '🤖 Gemini AI Bot' : item.senderName}
            </Text>
            <Text
              style={[
                styles.timeLabel,
                isAgent ? styles.agentTimeLabel : styles.defaultTimeLabel,
              ]}
            >
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {/* Image if any */}
          {item.mediaUrl && (
            <View style={styles.imageContainer}>
              <Text style={styles.imagePlaceholder}>📸 [Payment Slip / Image]</Text>
            </View>
          )}

          {/* Text Content */}
          <Text
            style={[
              styles.msgText,
              isAgent ? styles.agentMsgText : styles.defaultMsgText,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerTitleArea}
            onPress={() => setIsCustomerModalVisible(true)}
          >
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {conversation.customer.name}
              </Text>
              <ChannelBadge channel={conversation.channelType} size="sm" />
            </View>
            <Text style={styles.headerSubtext}>
              {conversation.customer.phone
                ? `📞 ${conversation.customer.phone}`
                : isMy
                ? 'ℹ️ CRM အချက်အလက် ကြည့်ရန်'
                : 'ℹ️ Tap for CRM details'}
            </Text>
          </TouchableOpacity>

          {/* Handover Toggle Button */}
          <TouchableOpacity
            style={[styles.handoverBtn, isBotHandling ? styles.botActiveBtn : styles.agentActiveBtn]}
            onPress={handleToggleHandover}
          >
            <Text style={styles.handoverText}>
              {isBotHandling
                ? isMy
                  ? '🤖 AI ဖြေနေ'
                  : '🤖 AI Bot'
                : isMy
                ? '👨‍💻 လူဖြေနေ'
                : '👨‍💻 Agent'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Missing Phone Request Prompt Strip */}
        {!conversation.customer.phone && (
          <TouchableOpacity style={styles.phoneBanner} onPress={handleRequestPhone}>
            <Text style={styles.phoneBannerText}>
              📱 {isMy ? 'ဖုန်းနံပါတ် တောင်းဆိုရန် နှိပ်ပါ (Share My Phone number)' : 'Request Phone Number'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Message Stream */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Canned Burmese Response Bar */}
        <CannedResponseBar onSelect={(text) => setInputText(text)} lang={lang} />

        {/* Bottom Input Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isMy ? 'မြန်မာယူနီကုဒ်ဖြင့် စာရိုက်ပါ...' : 'Type a reply...'}
            placeholderTextColor="#94A3B8"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            disabled={!inputText.trim()}
            onPress={handleSend}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>

        {/* Customer CRM Drawer Modal */}
        <CustomerModal
          visible={isCustomerModalVisible}
          customer={conversation.customer}
          onClose={() => setIsCustomerModalVisible(false)}
          lang={lang}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E40AF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  topBar: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 6,
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerTitleArea: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    maxWidth: 160,
  },
  headerSubtext: {
    color: '#BFDBFE',
    fontSize: 11,
    marginTop: 2,
  },
  handoverBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  botActiveBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  agentActiveBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  handoverText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  phoneBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    alignItems: 'center',
  },
  phoneBannerText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },
  messageList: {
    padding: 12,
    gap: 10,
  },
  msgRow: {
    flexDirection: 'row',
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  customerBubble: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopLeftRadius: 4,
  },
  botBubble: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    borderTopLeftRadius: 4,
  },
  agentBubble: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
    borderTopRightRadius: 4,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  defaultSenderLabel: {
    color: '#64748B',
  },
  agentSenderLabel: {
    color: '#BFDBFE',
  },
  timeLabel: {
    fontSize: 9,
  },
  defaultTimeLabel: {
    color: '#94A3B8',
  },
  agentTimeLabel: {
    color: '#DBEAFE',
  },
  msgText: {
    fontSize: 13,
    lineHeight: 19,
  },
  defaultMsgText: {
    color: '#0F172A',
  },
  agentMsgText: {
    color: '#FFFFFF',
  },
  imageContainer: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 6,
  },
  imagePlaceholder: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    maxHeight: 90,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
