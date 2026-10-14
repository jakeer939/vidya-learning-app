import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import Colors from '../constants/colors';

// Auth Screen
import { LoginScreen } from '../screens/auth/LoginScreen';

// Authenticated Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { MyLearningScreen } from '../screens/MyLearningScreen';
import { BookmarksScreen } from '../screens/BookmarksScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ClassSubjectsScreen } from '../screens/ClassSubjectsScreen';
import { SubjectIndexScreen } from '../screens/SubjectIndexScreen';
import { ChapterDetailsScreen } from '../screens/ChapterDetailsScreen';
import { SectionDetailsScreen } from '../screens/SectionDetailsScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { QuizResultScreen } from '../screens/QuizResultScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { NotificationDetailScreen } from '../screens/NotificationDetailScreen';
import { ExamScheduleScreen } from '../screens/ExamScheduleScreen';
import { ExamResultsScreen } from '../screens/ExamResultsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // Session validation in progress: show loading state without redirecting
  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.surface },
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          // Unauthenticated Stack: Protected routes are inaccessible
          <Stack.Group>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animation: 'fade' }}
            />
          </Stack.Group>
        ) : (
          // Authenticated Stack: Gated protected routes
          <Stack.Group>
            {/* Main Tab Screens */}
            <Stack.Screen name="Home" component={DashboardScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Learn" component={LearnScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Tasks" component={TasksScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Progress" component={ProgressScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'fade' }} />

            {/* Legacy Screens */}
            <Stack.Screen name="MyLearning" component={MyLearningScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Bookmarks" component={BookmarksScreen} options={{ animation: 'fade' }} />

            {/* Curriculum Screens */}
            <Stack.Screen name="ClassSubjects" component={ClassSubjectsScreen} />
            <Stack.Screen name="SubjectIndex" component={SubjectIndexScreen} />
            <Stack.Screen name="ChapterDetails" component={ChapterDetailsScreen} />
            <Stack.Screen name="SectionDetails" component={SectionDetailsScreen} />

            {/* Quiz Screens */}
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="QuizResult" component={QuizResultScreen} options={{ gestureEnabled: false }} />

            {/* Notifications */}
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />

            {/* Exam Schedule & Results */}
            <Stack.Screen name="ExamSchedule" component={ExamScheduleScreen} />
            <Stack.Screen name="ExamResults" component={ExamResultsScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
