import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationState } from '@react-navigation/native';
import Colors from '../../constants/colors';
import { getUnreadCount } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
  studentName?: string;
  studentClass?: string;
  activeRoute?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.82);

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  navigation,
  studentName = 'Aarav Sharma',
  studentClass = 'Class 8',
  activeRoute,
}) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const effectiveStudentName = user?.name || studentName;
  const [unreadCount, setUnreadCount] = useState(0);

  // Detect current route from React Navigation state
  const currentNavRoute = useNavigationState((state) => {
    if (!state || !state.routes || state.index === undefined) return undefined;
    return state.routes[state.index]?.name;
  });

  const [selectedRoute, setSelectedRoute] = useState<string>(
    activeRoute || currentNavRoute || 'Home'
  );

  useEffect(() => {
    if (activeRoute) {
      setSelectedRoute(activeRoute);
    } else if (currentNavRoute) {
      setSelectedRoute(currentNavRoute);
    }
  }, [activeRoute, currentNavRoute, isOpen]);

  useEffect(() => {
    if (isOpen) {
      getUnreadCount().then(setUnreadCount).catch(() => setUnreadCount(0));
    }
  }, [isOpen]);

  const navItems: Array<{
    key: string;
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    badge?: string;
    badgeColor?: string;
  }> = [
    { key: 'Home', label: 'Home Dashboard', icon: 'home' },
    { key: 'Learn', label: 'Curriculum & Learn', icon: 'auto-stories' },
    { key: 'Tasks', label: 'Tasks & Quizzes', icon: 'assignment' },
    { key: 'Progress', label: 'Progress & Analytics', icon: 'bar-chart' },
    { key: 'ExamSchedule', label: 'Exam Schedule & Timetable', icon: 'event-note', badge: 'AP Board', badgeColor: Colors.primary },
    { key: 'ExamResults', label: 'Marks Memo & Results', icon: 'grade', badge: 'Official', badgeColor: Colors.success },
    { key: 'Notifications', label: 'Notifications & Circulars', icon: 'notifications', badge: unreadCount > 0 ? `${unreadCount}` : undefined, badgeColor: Colors.error },
    { key: 'Bookmarks', label: 'Saved Bookmarks', icon: 'bookmark' },
    { key: 'Profile', label: 'Student Profile & Settings', icon: 'person' },
  ];

  const handleNavigate = (routeKey: string) => {
    setSelectedRoute(routeKey);
    onClose();
    if (navigation && navigation.navigate) {
      navigation.navigate(routeKey);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 flex-row">
        {/* Backdrop Scrim */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0 bg-black/55" />
        </TouchableWithoutFeedback>

        {/* Drawer Container */}
        <View
          className="bg-white h-full shadow-2xl justify-between"
          style={{
            width: DRAWER_WIDTH,
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 12),
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          {/* Header & Student Profile Card */}
          <View className="border-b border-border pb-4 px-5">
            {/* Top Bar with Logo & Close Button */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2.5">
                <View
                  className="w-9 h-9 rounded-xl bg-palePeach border border-[#f2ded3] items-center justify-center overflow-hidden"
                  style={{ width: 36, height: 36 }}
                >
                  <Image
                    source={require('../../../assets/app-images/logo.png')}
                    className="w-6 h-6"
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text className="font-manrope-extrabold text-base text-textPrimary leading-5">Vidya Learning</Text>
                  <Text className="font-manrope-semibold text-[10px] text-primary">SCERT AP (2026–27)</Text>
                </View>
              </View>

              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-surfaceSoft items-center justify-center border border-border"
                onPress={onClose}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Student Profile Quick Tile */}
            <TouchableOpacity
              className="bg-palePeach/70 rounded-2xl p-3 flex-row items-center gap-3 border border-[#f2ded3]"
              onPress={() => handleNavigate('Profile')}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../../assets/app-images/avatar.png')}
                className="w-11 h-11 rounded-full"
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
              <View className="flex-1">
                <Text className="font-manrope-extrabold text-sm text-textPrimary" numberOfLines={1}>
                  {effectiveStudentName}
                </Text>
                <Text className="font-manrope-medium text-xs text-textSecondary mt-0.5">
                  {studentClass} · AP State Board
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Navigation Items List with refined modern highlight */}
          <ScrollView className="flex-1 px-3 py-2" showsVerticalScrollIndicator={false}>
            <View className="gap-1.5">
              {navItems.map((item) => {
                const isActive = selectedRoute === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    className={`flex-row items-center justify-between px-2.5 py-2.5 rounded-2xl ${
                      isActive
                        ? 'bg-[#FAF0E9] border border-[#ECD7CC]'
                        : 'bg-transparent border border-transparent'
                    }`}
                    onPress={() => handleNavigate(item.key)}
                    activeOpacity={0.75}
                  >
                    <View className="flex-row items-center gap-2.5 flex-1">
                      {/* Active Indicator Bar */}
                      <View
                        className={`w-1 h-5 rounded-full ${
                          isActive ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />

                      {/* Icon Tile */}
                      <View
                        className={`w-9 h-9 rounded-xl items-center justify-center ${
                          isActive
                            ? 'bg-white border border-[#E8D4C8] shadow-xs'
                            : 'bg-surfaceSoft'
                        }`}
                      >
                        <MaterialIcons
                          name={item.icon}
                          size={19}
                          color={isActive ? Colors.primary : Colors.textSecondary}
                        />
                      </View>

                      {/* Item Label */}
                      <Text
                        className={`text-[13px] flex-1 ${
                          isActive
                            ? 'font-manrope-extrabold text-primaryDark tracking-tight'
                            : 'font-manrope-medium text-textPrimary'
                        }`}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      {item.badge && (
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isActive ? Colors.primary : (item.badgeColor || Colors.primary),
                          }}
                        >
                          <Text className="font-manrope-extrabold text-[10px] text-white">
                            {item.badge}
                          </Text>
                        </View>
                      )}

                      {isActive && (
                        <MaterialIcons name="chevron-right" size={16} color={Colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Sign Out Option */}
              <TouchableOpacity
                className="flex-row items-center justify-between px-2.5 py-2.5 rounded-2xl mt-2 bg-red-50/70 border border-red-200"
                onPress={() => {
                  onClose();
                  logout();
                }}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-9 h-9 rounded-xl items-center justify-center bg-white border border-red-200">
                    <MaterialIcons name="logout" size={19} color="#DC2626" />
                  </View>
                  <Text className="text-[13px] font-manrope-bold text-red-600">
                    Sign Out
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Version & Board Compliance (Medium toggle removed as requested) */}
          <View className="border-t border-border py-4 px-5 gap-1.5 items-center bg-[#FCFAF8]">
            <View className="flex-row items-center gap-1.5">
              <MaterialIcons name="school" size={14} color={Colors.primary} />
              <Text className="font-manrope-extrabold text-xs text-textPrimary">
                Vidya Learning · v1.2.0
              </Text>
            </View>
            <Text className="font-manrope-medium text-[10px] text-textMuted text-center leading-4">
              Andhra Pradesh State Council of Educational Research and Training (SCERT) · 2026–2027
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};
