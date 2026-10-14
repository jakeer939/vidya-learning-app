import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { HeaderBar, BottomNav } from '../components/navigation';
import { PageIntro, HoverCard } from '../components/common';
import { useLearningProgress } from '../hooks/useLearningProgress';
import { useAuth } from '../hooks/useAuth';
import { getClasses } from '../services/curriculumService';
import { MainTabParamList, RootStackParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { profile, bookmarks, progressMap, selectActiveGrade } = useLearningProgress();
  const [dailyReminders, setDailyReminders] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);
  const classes = getClasses();

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;
  const activeClass = classes.find((c) => c.id === profile?.activeClassId) || classes[2];

  const handleGradeChange = (classId: string) => {
    selectActiveGrade(classId);
    Alert.alert('Class Preference Updated', `Active study class set to ${classes.find(c => c.id === classId)?.title}`);
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <HeaderBar
        title="Profile"
        subtitle="Student preferences and study statistics."
        activeRoute="Profile"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 48, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Heading & Subheading */}
        <PageIntro
          eyebrow="STUDENT ACCOUNT"
          badge={`${activeClass.title} Enrolled`}
          title="Student Profile & Settings"
        />

        {/* Profile Card matching Figma Make .profile-card */}
        <HoverCard className="flex-row items-center bg-palePeach rounded-[22px] p-[22px] gap-4" lift={-3}>
          <Image
            source={require('../../assets/app-images/avatar.png')}
            className="w-[58px] h-[58px] rounded-full"
            style={{ width: 58, height: 58, borderRadius: 29 }}
          />
          <View className="flex-1 gap-1">
            <Text className="font-manrope-extrabold text-lg text-textPrimary">
              {user?.name || profile?.displayName || 'Aarav Sharma'}
            </Text>
            <Text className="font-manrope-medium text-xs text-textSecondary">
              {user?.email ? `${user.email} · ` : ''}Enrolled in {activeClass.title} · AP State Board
            </Text>
          </View>
        </HoverCard>

        {/* Active Class Switcher */}
        <View className="gap-2">
          <Text className="font-manrope-extrabold text-lg text-textPrimary tracking-tight">Enrolled Class</Text>
          <View className="flex-row gap-1.5 mt-1">
            {classes.map((c) => {
              const isSelected = c.id === profile?.activeClassId;
              return (
                <TouchableOpacity
                  key={c.id}
                  className={`flex-1 min-h-[48px] border rounded-xl items-center justify-center ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-white border-border'
                  }`}
                  onPress={() => handleGradeChange(c.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`font-manrope-bold text-[11px] ${
                      isSelected ? 'text-white' : 'text-textSecondary'
                    }`}
                  >
                    Class {c.grade}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Profile Statistics */}
        <View className="gap-2">
          <Text className="font-manrope-extrabold text-lg text-textPrimary tracking-tight">Achievements</Text>
          <View className="flex-row gap-2.5 mt-1">
            <View className="flex-1 py-3.5 px-2 border border-border rounded-2xl bg-white items-center shadow-sm">
              <View className="w-[34px] h-[34px] rounded-[10px] bg-palePeach items-center justify-center mb-2">
                <MaterialIcons name="local-fire-department" size={20} color={Colors.primary} />
              </View>
              <Text className="font-manrope-extrabold text-lg text-textPrimary">{profile?.streakDays || 5}</Text>
              <Text className="font-manrope-semibold text-[11px] text-textSecondary mt-0.5">Day streak</Text>
            </View>

            <View className="flex-1 py-3.5 px-2 border border-border rounded-2xl bg-white items-center shadow-sm">
              <View className="w-[34px] h-[34px] rounded-[10px] bg-palePeach items-center justify-center mb-2">
                <MaterialIcons name="bookmark" size={20} color={Colors.primary} />
              </View>
              <Text className="font-manrope-extrabold text-lg text-textPrimary">{bookmarks.length}</Text>
              <Text className="font-manrope-semibold text-[11px] text-textSecondary mt-0.5">Bookmarks</Text>
            </View>

            <View className="flex-1 py-3.5 px-2 border border-border rounded-2xl bg-white items-center shadow-sm">
              <View className="w-[34px] h-[34px] rounded-[10px] bg-palePeach items-center justify-center mb-2">
                <MaterialIcons name="check" size={20} color={Colors.primary} />
              </View>
              <Text className="font-manrope-extrabold text-lg text-textPrimary">{completedCount}</Text>
              <Text className="font-manrope-semibold text-[11px] text-textSecondary mt-0.5">Completed</Text>
            </View>
          </View>
        </View>

        {/* Settings Group */}
        <View className="gap-2">
          <Text className="font-manrope-extrabold text-lg text-textPrimary tracking-tight">Study Settings</Text>

          <View className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Language Preference */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center gap-3 flex-1">
                <MaterialIcons name="translate" size={20} color={Colors.primary} />
                <View>
                  <Text className="font-manrope-bold text-[13px] text-textPrimary">Study Medium / Language</Text>
                  <Text className="font-manrope-medium text-[11px] text-textSecondary mt-0.5">Primary instruction language</Text>
                </View>
              </View>
              <View className="flex-row gap-1 bg-[#F5F2EF] p-1 rounded-xl">
                <TouchableOpacity
                  className="px-2.5 py-1 rounded-lg bg-primary"
                  activeOpacity={0.8}
                >
                  <Text className="font-manrope-bold text-[11px] text-white">English</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-2.5 py-1 rounded-lg"
                  activeOpacity={0.8}
                  onPress={() => Alert.alert('Telugu Medium', 'Telugu medium textbooks & bilingual summaries are enabled.')}
                >
                  <Text className="font-manrope-medium text-[11px] text-textSecondary">తెలుగు</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Daily Study Goal */}
            <View className="p-4 border-b border-border">
              <View className="flex-row items-center gap-3 mb-2.5">
                <MaterialIcons name="timer" size={20} color={Colors.primary} />
                <View>
                  <Text className="font-manrope-bold text-[13px] text-textPrimary">Daily Study Goal</Text>
                  <Text className="font-manrope-medium text-[11px] text-textSecondary mt-0.5">Target daily learning time</Text>
                </View>
              </View>
              <View className="flex-row gap-2 mt-1">
                {['30 mins', '45 mins', '60 mins'].map((goal, idx) => {
                  const isSelected = idx === 1; // 45 mins default
                  return (
                    <TouchableOpacity
                      key={goal}
                      className={`flex-1 py-2 rounded-xl items-center border ${
                        isSelected ? 'bg-primary border-primary' : 'bg-white border-border'
                      }`}
                      activeOpacity={0.8}
                      onPress={() => Alert.alert('Study Goal', `Daily study goal set to ${goal}`)}
                    >
                      <Text
                        className={`font-manrope-bold text-[11px] ${
                          isSelected ? 'text-white' : 'text-textSecondary'
                        }`}
                      >
                        {goal}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Daily Reminders */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center gap-3 flex-1">
                <MaterialIcons name="notifications-active" size={20} color={Colors.primary} />
                <View>
                  <Text className="font-manrope-bold text-[13px] text-textPrimary">Daily Study Reminders</Text>
                  <Text className="font-manrope-medium text-[11px] text-textSecondary mt-0.5">Notification at 6:00 PM</Text>
                </View>
              </View>
              <Switch
                value={dailyReminders}
                onValueChange={setDailyReminders}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={dailyReminders ? Colors.primary : Colors.white}
              />
            </View>

            {/* Offline Content Cache */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3 flex-1">
                <MaterialIcons name="offline-pin" size={20} color={Colors.primary} />
                <View>
                  <Text className="font-manrope-bold text-[13px] text-textPrimary">Offline Content Cache</Text>
                  <Text className="font-manrope-medium text-[11px] text-textSecondary mt-0.5">Cached curriculum for offline reading</Text>
                </View>
              </View>
              <Switch
                value={offlineSync}
                onValueChange={setOfflineSync}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={offlineSync ? Colors.primary : Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Account Actions / Sign Out */}
        <View className="gap-2">
          <TouchableOpacity
            className="flex-row items-center justify-center p-3.5 rounded-2xl bg-red-50 border border-red-200 gap-2 shadow-xs"
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: () => logout(),
                },
              ]);
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="logout" size={18} color="#DC2626" />
            <Text className="font-manrope-bold text-sm text-red-600">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info & Board Compliance */}
        <View className="items-center py-2 gap-1">
          <Text className="font-manrope-bold text-xs text-textSecondary">Vidya Learning App v1.2.0</Text>
          <Text className="font-manrope-medium text-[10px] text-textMuted">
            Aligned with Andhra Pradesh SCERT Curriculum · Academic Year 2026–2027
          </Text>
        </View>
      </ScrollView>
      <BottomNav activeTab="Profile" navigation={navigation} />
    </View>
  );
};
