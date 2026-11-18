import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Conversation, ChannelType, ConversationStatus } from '../types';
import { ChannelBadge } from '../components/ChannelBadge';
import { mobileApi } from '../services/api.service';
import { mobileSocket } from '../services/socket.service';

interface Props {
  onSelectConversation: (conv: Conversation) => void;
  onOpenSettings: () => void;
  lang?: 'my' | 'en';
}

export const InboxScreen: React.FC<Props> = ({ onSelectConversation, onOpenSettings, lang = 'my' }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | ConversationStatus>('ALL');
  const [channelFilter, setChannelFilter] = useState<'ALL' | ChannelType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isMy = lang === 'my';

  const loadData = async () => {
    try {
      const data = await mobileApi.getConversations();
      setConversations(data);
    } catch (e) {
      console.warn('Load conversations err:', e);
    }
  };

  useEffect(() => {
    loadData();

    // Socket real-time updates
    mobileSocket.onIncomingMessage((data) => {
      console.log('📱 Real-time incoming message arrived on Android:', data);
      loadData();
    });

    mobileSocket.onHandoverRequested((data) => {
      console.log('🚨 Urgent handover requested on Android:', data);
      loadData();
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredConversations = conversations.filter((c) => {
    // Tab filter
    if (activeTab !== 'ALL' && c.status !== activeTab) {
      return false;
    }
    // Channel filter
    if (channelFilter !== 'ALL' && c.channelType !== channelFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customer.name.toLowerCase().includes(q);
      const matchPhone = c.customer.phone?.includes(q);
      const matchSnippet = c.lastMessageSnippet.toLowerCase().includes(q);
      return matchName || matchPhone || matchSnippet;
    }
    return true;
  });

  const renderItem = ({ item }: { item: Conversation }) => {
    const isBot = item.handoverStatus === 'BOT_HANDLING';
    const isUrgent = item.handoverStatus === 'HUMAN_REQUESTED';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => onSelectConversation(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.customer.name.substring(0, 1).toUpperCase()}</Text>
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.customerName} numberOfLines={1}>
                {item.customer.name}
              </Text>
              <ChannelBadge channel={item.channelType} size="sm" />
            </View>

            <View style={styles.metaRow}>
              {isUrgent ? (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>🚨 {isMy ? 'လူနဲ့ပြောလိုသည်' : 'Agent Needed'}</Text>
                </View>
              ) : isBot ? (
                <View style={styles.botBadge}>
                  <Text style={styles.botText}>🤖 {isMy ? 'AI မေးမြန်းနေသည်' : 'AI Handling'}</Text>
                </View>
              ) : (
                <View style={styles.humanBadge}>
                  <Text style={styles.humanText}>👨‍💻 {isMy ? 'Agent တာဝန်ယူ' : 'Agent Active'}</Text>
                </View>
              )}

              {item.customer.phone && (
                <Text style={styles.phoneText}>📞 {item.customer.phone}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Message Snippet */}
        <View style={styles.snippetRow}>
          <Text style={[styles.snippet, item.unreadCount > 0 && styles.unreadSnippet]} numberOfLines={1}>
            {item.lastMessageSnippet}
          </Text>

          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.appBar}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.appTitle}>{isMy ? 'စုပေါင်း inbox' : 'Unified Inbox'}</Text>
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.appSubtitle}>
              {isMy ? 'Facebook, Telegram, Viber, TikTok ဆက်သွယ်မှုများ' : 'Omnichannel Communications'}
            </Text>
          </View>

          <TouchableOpacity style={styles.settingsBtn} onPress={onOpenSettings}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={isMy ? 'နာမည်၊ ဖုန်း၊ စကားစု ရှာဖွေရန်...' : 'Search customer or message...'}
            placeholderTextColor="#94A3B8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Channel Filters */}
        <View style={styles.filterRow}>
          {(
            [
              { id: 'ALL', label: isMy ? 'အားလုံး' : 'All' },
              { id: 'MESSENGER', label: '🔵 Messenger' },
              { id: 'TELEGRAM', label: '✈️ Telegram' },
              { id: 'VIBER', label: '🟣 Viber' },
              { id: 'TIKTOK', label: '🎵 TikTok' },
            ] as const
          ).map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.filterChip, channelFilter === c.id && styles.activeChip]}
              onPress={() => setChannelFilter(c.id as any)}
            >
              <Text
                style={[styles.chipText, channelFilter === c.id && styles.activeChipText]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Triage Tabs */}
        <View style={styles.tabsRow}>
          {[
            { id: 'ALL', label: isMy ? 'အားလုံး' : 'All' },
            { id: 'UNASSIGNED', label: isMy ? 'မဖြေရသေး' : 'Unassigned' },
            { id: 'ACTIVE', label: isMy ? 'လုပ်ဆောင်ဆဲ' : 'Active' },
            { id: 'WAITING', label: isMy ? 'စောင့်ဆိုင်းဆဲ' : 'Waiting' },
            { id: 'RESOLVED', label: isMy ? 'ဖြေရှင်းပြီး' : 'Resolved' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Conversation List */}
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>
                {isMy ? 'မက်ဆေ့ခ်ျများ မရှိသေးပါ' : 'No messages found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isMy
                  ? 'အသစ်ဝင်ရောက်လာသော Customer မက်ဆေ့ခ်ျများကို ဤနေရာတွင် အချိန်နှင့်တပြေးညီ ပြသပေးပါမည်'
                  : 'New incoming customer messages will appear here in real-time'}
              </Text>
            </View>
          }
        />
      </View>
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
    backgroundColor: '#F8FAFC',
  },
  appBar: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  appSubtitle: {
    fontSize: 11,
    color: '#93C5FD',
    marginTop: 2,
  },
  settingsBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  settingsIcon: {
    fontSize: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  clearSearch: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeChip: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    gap: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentText: {
    color: '#B91C1C',
    fontSize: 10,
    fontWeight: '700',
  },
  botBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  botText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '600',
  },
  humanBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  humanText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '600',
  },
  phoneText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  snippetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  snippet: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  unreadSnippet: {
    fontWeight: '700',
    color: '#0F172A',
  },
  unreadBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
