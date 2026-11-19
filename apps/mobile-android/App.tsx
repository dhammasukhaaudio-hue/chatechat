import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler, StatusBar } from 'react-native';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { InboxScreen } from './src/screens/InboxScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Conversation } from './src/types';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'inbox' | 'chat' | 'settings'>('inbox');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [lang, setLang] = useState<'my' | 'en'>('my');

  // Android Hardware Back Button Handler (All Android Devices)
  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen === 'chat') {
        setCurrentScreen('inbox');
        setSelectedConversation(null);
        return true; // handled
      }
      if (currentScreen === 'settings') {
        setCurrentScreen('inbox');
        return true; // handled
      }
      return false; // let Android OS exit or minimize app
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentScreen]);

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <ConnectionScreen
          onConnected={() => setIsConnected(true)}
          lang={lang}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {currentScreen === 'inbox' && (
        <InboxScreen
          onSelectConversation={(conv) => {
            setSelectedConversation(conv);
            setCurrentScreen('chat');
          }}
          onOpenSettings={() => setCurrentScreen('settings')}
          lang={lang}
        />
      )}

      {currentScreen === 'chat' && selectedConversation && (
        <ChatScreen
          conversation={selectedConversation}
          onBack={() => {
            setCurrentScreen('inbox');
            setSelectedConversation(null);
          }}
          lang={lang}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          onBack={() => setCurrentScreen('inbox')}
          onDisconnect={() => setIsConnected(false)}
          currentLang={lang}
          onToggleLang={() => setLang(lang === 'my' ? 'en' : 'my')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
