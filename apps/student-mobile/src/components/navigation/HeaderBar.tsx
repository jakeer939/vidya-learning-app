import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../constants/colors';
import { getUnreadCount } from '../../services/notificationService';
import { SidebarDrawer } from './SidebarDrawer';
import { useAuth } from '../../hooks/useAuth';

interface HeaderBarProps {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showSearch?: boolean;
  onSearchPress?: () => void;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmarkPress?: () => void;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  rightAction?: React.ReactNode;
  studentName?: string;
  studentClass?: string;
  activeRoute?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  eyebrow,
  subtitle,
  showBack = false,
  onBackPress,
  onProfilePress,
  onNotificationPress,
  rightAction,
  studentName = 'Aarav Sharma',
  studentClass = 'Class 8',
  activeRoute,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch {
        setUnreadCount(0);
      }
    };
    loadUnread();
  }, []);

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      navigation.navigate('Notifications');
    }
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      navigation.navigate('Profile');
    }
  };

  return (
    <View className="bg-white z-10" style={{ paddingTop: topInset }}>
      {/* Top Navbar with App Name, Menu, & Profile */}
      <View className="h-16 px-4 flex-row items-center justify-between bg-white border-b border-border">
        {/* Left side: Hamburger menu button + Logo + App Title */}
        <View className="flex-row items-center gap-2">
          {/* Hamburger Menu (three lines before logo) */}
          <TouchableOpacity
            className="w-10 h-10 rounded-xl bg-palePeach border border-[#f2ded3] items-center justify-center shadow-sm"
            onPress={() => setIsDrawerOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open navigation drawer"
          >
            <MaterialIcons name="menu" size={22} color={Colors.primary} />
          </TouchableOpacity>

          <View
            className="w-10 h-10 rounded-lg bg-palePeach border border-[#f2ded3] items-center justify-center shadow-sm overflow-hidden"
            style={{ width: 40, height: 40 }}
          >
            <Image
              source={require('../../../assets/app-images/logo.png')}
              className="w-7 h-7"
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
          </View>
          <Text className="font-manrope-extrabold text-base text-textPrimary tracking-tight">Vidya Learning</Text>
        </View>

        {/* Right side: Notifications bell + Profile chip */}
        <View className="flex-row items-center gap-2">
          {/* Notification Bell */}
          <TouchableOpacity
            className="w-10 h-10 rounded-full border border-border items-center justify-center bg-white"
            onPress={handleNotificationPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <MaterialIcons name="notifications-none" size={20} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-error items-center justify-center border-2 border-white">
                <Text className="font-manrope-extrabold text-[9px] text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Avatar Button */}
          <TouchableOpacity
            className="w-10 h-10 rounded-full border border-border bg-white items-center justify-center overflow-hidden shadow-sm"
            onPress={handleProfilePress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Student profile"
          >
            <Image
              source={require('../../../assets/app-images/avatar.png')}
              className="w-8 h-8 rounded-full"
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Back Section seamlessly flowing into the page content below */}
      {showBack && (
        <View className="px-5 pt-3.5 pb-1 flex-row items-center justify-between bg-white gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-xl border border-border bg-white items-center justify-center shadow-sm"
            onPress={onBackPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 justify-center">
            {subtitle ? (
              <Text className="font-manrope-extrabold text-[10px] text-primary tracking-wider mb-0.5 uppercase">
                {subtitle}
              </Text>
            ) : eyebrow ? (
              <Text className="font-manrope-extrabold text-[10px] text-primary tracking-wider mb-0.5 uppercase">
                {eyebrow}
              </Text>
            ) : null}
            {title ? (
              <Text className="font-manrope-extrabold text-xl text-textPrimary tracking-tight" numberOfLines={1}>
                {title}
              </Text>
            ) : null}
          </View>

          {rightAction && (
            <View className="items-center justify-center">
              {rightAction}
            </View>
          )}
        </View>
      )}

      {/* Persistent Sidebar Drawer accessible from anywhere */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        navigation={navigation}
        studentName={user?.name || studentName}
        studentClass={studentClass}
        activeRoute={activeRoute}
      />
    </View>
  );
};
