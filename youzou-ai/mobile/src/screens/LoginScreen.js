import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-google-app-auth';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { login, googleLogin } = useAuth();

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('請輸入電子郵件地址');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('請輸入有效的電子郵件地址');
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('請輸入密碼');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        Alert.alert('成功', '登入成功！', [{ text: '確定' }]);
        // Navigate to main app
        navigation.replace('Main');
      } else {
        Alert.alert('錯誤', result.error, [{ text: '確定' }]);
      }
    } catch (error) {
      Alert.alert('錯誤', '登入失敗，請稍後再試', [{ text: '確定' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      const result = await Google.logInAsync({
        androidClientId: process.env.EXPO_GOOGLE_ANDROID_CLIENT_ID,
        iosClientId: process.env.EXPO_GOOGLE_IOS_CLIENT_ID,
        scopes: ['profile', 'email'],
      });

      if (result.type === 'success') {
        const loginResult = await googleLogin(result.idToken);
        
        if (!loginResult.success) {
          Alert.alert('錯誤', loginResult.error, [{ text: '確定' }]);
        } else {
          Alert.alert('成功', 'Google 登入成功！', [{ text: '確定' }]);
          navigation.replace('Main');
        }
      }
    } catch (error) {
      Alert.alert('錯誤', 'Google 登入失敗，請稍後再試', [{ text: '確定' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#2196F3', '#9C27B0']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* App Header */}
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>✈️</Text>
              </View>
              <Title style={styles.title}>遊走 AI</Title>
              <Text style={styles.subtitle}>
                您的智能旅遊助手{'\n'}Travellin AI
              </Text>
            </View>

            {/* Login Card */}
            <Card style={styles.loginCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>登入帳戶</Title>
                
                <TextInput
                  label="電子郵件地址"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!emailError}
                  left={<TextInput.Icon name="email" />}
                  disabled={loading}
                />
                {emailError ? (
                  <HelperText type="error" visible={true}>
                    {emailError}
                  </HelperText>
                ) : null}

                <TextInput
                  label="密碼"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry
                  error={!!passwordError}
                  left={<TextInput.Icon name="lock" />}
                  disabled={loading}
                />
                {passwordError ? (
                  <HelperText type="error" visible={true}>
                    {passwordError}
                  </HelperText>
                ) : null}

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  style={styles.loginButton}
                  contentStyle={styles.buttonContent}
                  disabled={loading}
                  loading={loading}
                >
                  登入
                </Button>

                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotPasswordButton}
                >
                  <Text style={styles.forgotPasswordText}>
                    忘記密碼？
                  </Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>或</Text>
                  <View style={styles.divider} />
                </View>

                <Button
                  mode="outlined"
                  onPress={handleGoogleLogin}
                  style={styles.googleButton}
                  contentStyle={styles.buttonContent}
                  disabled={loading}
                  icon="google"
                >
                  使用 Google 登入
                </Button>

                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>
                    還沒有帳戶？{' '}
                  </Text>
                  <TouchableOpacity onPress={handleRegister}>
                    <Text style={styles.registerLink}>
                      立即註冊
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appName}>遊走 AI - Travellin AI</Text>
              <Text style={styles.appVersion}>版本 1.0.0</Text>
              <Text style={styles.appDescription}>
                智能旅遊助手，為您找到最優惠的航班和酒店
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 50,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  loginCard: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginHorizontal: 10,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#2196F3',
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
    fontSize: 16,
  },
  loginButton: {
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 25,
  },
  googleButton: {
    marginTop: 10,
    borderRadius: 25,
    borderColor: '#2196F3',
  },
  buttonContent: {
    height: 50,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginVertical: 10,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  appName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  appVersion: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 5,
  },
  appDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LoginScreen;