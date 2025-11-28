import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const MOCK_CHATS = [
  { id: 1, name: 'Project Group 4', lastMsg: 'Meeting at 5 PM? 🕓', time: '10:30', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PG', unread: 3 },
  { id: 2, name: 'Lisa (Buddy)', lastMsg: 'See you at the Mensa? 🥗', time: 'Yesterday', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa', unread: 0 },
];

export default function MessagesScreen() {
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({ light: '#475569', dark: '#94a3b8' }, 'text');
  const text = useThemeColor({}, 'text');
  const card = useThemeColor({}, 'card');
  const accent = useThemeColor({}, 'tint');

  const [selectedChat, setSelectedChat] = useState<typeof MOCK_CHATS[0] | null>(null);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: card }]} edges={['top', 'left', 'right']}>
      {!selectedChat ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={[styles.listHeader, { borderColor: border }]}>
            <ThemedText type="title">Messages</ThemedText>
          </View>
          {MOCK_CHATS.map((chat) => (
            <TouchableOpacity key={chat.id} style={[styles.chatRow, { borderColor: border }]} onPress={() => setSelectedChat(chat)}>
              <View style={styles.avatarWrap}>
                <Feather name="user" size={18} color={muted} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.chatRowTop}>
                  <ThemedText style={{ fontWeight: '700' }}>{chat.name}</ThemedText>
                  <ThemedText style={{ color: muted, fontSize: 12 }}>{chat.time}</ThemedText>
                </View>
                <ThemedText style={{ color: muted }}>{chat.lastMsg}</ThemedText>
              </View>
              {chat.unread > 0 ? (
                <View style={styles.unread}>
                  <ThemedText style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{chat.unread}</ThemedText>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.chatDetail, { backgroundColor: '#efeae2' }]}>
          <View style={[styles.detailHeader, { borderColor: border }]}>
            <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles.backBtn}>
              <Feather name="arrow-left" size={18} color={accent} />
              <ThemedText style={{ color: accent }}>Back</ThemedText>
            </TouchableOpacity>
            <ThemedText style={{ fontWeight: '700' }}>{selectedChat.name}</ThemedText>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
            <View style={styles.incoming}>
              <ThemedText>Hi! Can you send the project files? 📁</ThemedText>
              <ThemedText style={styles.msgTime}>10:30</ThemedText>
            </View>
            <View style={styles.outgoing}>
              <ThemedText>Sure, sending now! 👍</ThemedText>
              <ThemedText style={styles.msgTime}>10:31</ThemedText>
            </View>
          </ScrollView>
          <View style={[styles.inputRow, { borderColor: border }]}>
            <TouchableOpacity style={styles.iconBtn}>
              <Feather name="paperclip" size={18} color={muted} />
            </TouchableOpacity>
            <TextInput style={[styles.input, { color: text }]} placeholder="Message..." placeholderTextColor={muted} />
            <TouchableOpacity style={styles.iconBtn}>
              <Feather name="send" size={18} color={accent} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { padding: 16, gap: 10 },
  listHeader: {
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  chatRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unread: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatDetail: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  messages: {
    gap: 10,
    padding: 12,
  },
  incoming: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderTopLeftRadius: 2,
  },
  outgoing: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    padding: 10,
    borderRadius: 12,
    borderTopRightRadius: 2,
  },
  msgTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    borderTopWidth: 1,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtn: {
    padding: 8,
  },
});
