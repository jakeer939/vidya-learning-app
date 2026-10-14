import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '@vidya/api-client';

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState<string | null>(null);

  const handleLogin = async () => {
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    // Basic email format check
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage(null);
    setForgotPasswordNotice(null);
    setLoading(true);

    try {
      await login(trimmedEmail, password);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMessage('Invalid email or password.');
        } else if (err.status === 403) {
          setErrorMessage('Account not active. Please contact the administrator.');
        } else {
          setErrorMessage(err.message || 'Server error. Please try again.');
        }
      } else if (err?.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Unable to connect to server. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    setForgotPasswordNotice(null);
  };

  const handleForgotPassword = () => {
    const copy = 'Please contact the administrator to reset your password.';
    setForgotPasswordNotice(copy);
    Alert.alert('Reset Password', copy, [{ text: 'OK' }]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View className="items-center mt-6 mb-7">
          <View
            className="w-14 h-14 rounded-2xl bg-palePeach border border-[#f2ded3] items-center justify-center shadow-sm overflow-hidden mb-3"
            style={{ width: 56, height: 56 }}
          >
            <Image
              source={require('../../../assets/app-images/logo.png')}
              className="w-10 h-10"
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </View>
          <Text className="font-manrope-extrabold text-2xl text-textPrimary tracking-tight">
            Vidya Learning
          </Text>
          <View className="mt-1 bg-palePeach px-2.5 py-0.5 rounded-full border border-primaryLight">
            <Text className="font-manrope-extrabold text-[10px] text-primary tracking-widest uppercase">
              Student Portal · AP SCERT
            </Text>
          </View>
        </View>

        {/* Title */}
        <View className="mb-5">
          <Text className="font-manrope-bold text-xl text-textPrimary">Sign In</Text>
          <Text className="font-manrope-medium text-xs text-textSecondary mt-1 leading-relaxed">
            Enter your student credentials to access textbook lessons, practice quizzes, and exam results.
          </Text>
        </View>

        {/* Error Alert */}
        {errorMessage && (
          <View className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex-row items-center gap-2.5">
            <MaterialIcons name="error-outline" size={20} color="#DC2626" />
            <Text className="font-manrope-medium text-xs text-red-700 flex-1">{errorMessage}</Text>
          </View>
        )}

        {/* Forgot Password Notice Alert */}
        {forgotPasswordNotice && (
          <View className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex-row items-center gap-2.5">
            <MaterialIcons name="info-outline" size={20} color="#D97706" />
            <Text className="font-manrope-medium text-xs text-amber-800 flex-1">
              {forgotPasswordNotice}
            </Text>
          </View>
        )}

        {/* Email Field */}
        <View className="mb-4">
          <Text className="font-manrope-semibold text-xs text-textPrimary mb-1.5">Student Email</Text>
          <View className="flex-row items-center h-12 px-3.5 rounded-xl border border-border bg-[#F9FAFB]">
            <MaterialIcons name="mail-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              className="flex-1 ml-2.5 font-manrope-medium text-sm text-textPrimary"
              placeholder="e.g. student@vidya.test"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage(null);
              }}
            />
          </View>
        </View>

        {/* Password Field */}
        <View className="mb-2">
          <Text className="font-manrope-semibold text-xs text-textPrimary mb-1.5">Password</Text>
          <View className="flex-row items-center h-12 px-3.5 rounded-xl border border-border bg-[#F9FAFB]">
            <MaterialIcons name="lock-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              className="flex-1 ml-2.5 font-manrope-medium text-sm text-textPrimary"
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password Link */}
        <View className="items-end mb-6">
          <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
            <Text className="font-manrope-semibold text-xs text-primary">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          className="h-12 rounded-xl bg-primary items-center justify-center shadow-sm"
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text className="font-manrope-bold text-sm text-white">Sign In as Student</Text>
          )}
        </TouchableOpacity>

        {/* Quick Demo Credentials */}
        <View className="mt-7 p-3.5 rounded-xl bg-palePeach/70 border border-[#f2ded3]">
          <Text className="font-manrope-bold text-[11px] text-primary uppercase tracking-wider mb-2">
            Quick Test Credentials
          </Text>
          <TouchableOpacity
            className="py-2 px-3 rounded-lg bg-white border border-primaryLight flex-row items-center justify-between"
            onPress={() => handleFillDemo('student@vidya.test', 'StudentDemo1!')}
            activeOpacity={0.7}
          >
            <View>
              <Text className="font-manrope-semibold text-[12px] text-textPrimary">student@vidya.test</Text>
              <Text className="font-manrope-medium text-[10px] text-textSecondary">Default AP Student Account</Text>
            </View>
            <Text className="font-manrope-bold text-[11px] text-primary">Use</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-[1px] bg-border" />
          <Text className="mx-3 font-manrope-medium text-[11px] text-textMuted uppercase tracking-wider">
            or continue with
          </Text>
          <View className="flex-1 h-[1px] bg-border" />
        </View>

        {/* Social login kept as stale UI — not wired (out of scope). */}
        <View className="gap-2.5">
          <TouchableOpacity
            className="h-11 rounded-xl border border-border bg-white flex-row items-center justify-center px-4 gap-3 shadow-xs opacity-60"
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Unavailable', 'Google sign-in is not available for student accounts.')
            }
          >
            <MaterialIcons name="g-mobiledata" size={24} color="#EA4335" />
            <Text className="font-manrope-semibold text-xs text-textPrimary">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-11 rounded-xl border border-border bg-white flex-row items-center justify-center px-4 gap-3 shadow-xs opacity-60"
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Unavailable',
                'School Student ID sign-in is not available yet. Use your provisioned email and password.'
              )
            }
          >
            <MaterialIcons name="badge" size={18} color={Colors.primary} />
            <Text className="font-manrope-semibold text-xs text-textPrimary">
              Continue with School Student ID
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Provisioning Footer Note */}
        <View className="mt-8 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Text className="font-manrope-medium text-[11px] text-textSecondary text-center leading-4">
            Student accounts are issued by the school administration. To reset your password, please contact the administrator.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
