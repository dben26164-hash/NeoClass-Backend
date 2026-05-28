# Architecture Mobile - NeoClass

## Stratégie Multi-Platform

Nous recommandons **React Native avec Expo** pour sa maintenabilité et rapid development, ou **Flutter** pour performance maximale.

**Choix recommandé : React Native + Expo** (pour rapidité de marché)

---

## Stack Technologique - React Native

```
React Native 0.73+
├─ Expo 50+ (Development)
├─ TypeScript
├─ React Navigation
├─ React Query (TanStack Query)
├─ Zustand (State Management)
├─ Socket.io (Real-time)
├─ WatermelonDB (Local Sync)
├─ Firebase (Push Notifications)
├─ i18n-js (Internationalization)
└─ NativeBase / React Native Paper (UI)
```

---

## Structure du projet React Native

```
/neoclass-mobile
├─ app.json                      # Expo config
├─ app.config.js                 # Conditional config
├─ package.json
├─ tsconfig.json
├─ .env.local
│
├─ /src
│  ├─ /screens                   # Screen components
│  │  ├─ /auth
│  │  │  ├─ LoginScreen.tsx
│  │  │  ├─ RegisterScreen.tsx
│  │  │  ├─ ForgotPasswordScreen.tsx
│  │  │  └─ AuthLayout.tsx
│  │  │
│  │  ├─ /dashboard              # Role-specific dashboards
│  │  │  ├─ AdminDashboardScreen.tsx
│  │  │  ├─ SchoolAdminDashboardScreen.tsx
│  │  │  ├─ TeacherDashboardScreen.tsx
│  │  │  ├─ StudentDashboardScreen.tsx
│  │  │  └─ ParentDashboardScreen.tsx
│  │  │
│  │  ├─ /classes
│  │  │  ├─ ClassesListScreen.tsx
│  │  │  ├─ ClassDetailScreen.tsx
│  │  │  ├─ AttendanceScreen.tsx
│  │  │  └─ ScheduleScreen.tsx
│  │  │
│  │  ├─ /grades
│  │  │  ├─ GradesScreen.tsx
│  │  │  ├─ GradeDetailScreen.tsx
│  │  │  ├─ GradeEntryScreen.tsx  (Teacher only)
│  │  │  └─ BulletinScreen.tsx
│  │  │
│  │  ├─ /lms
│  │  │  ├─ CoursesScreen.tsx
│  │  │  ├─ CourseDetailScreen.tsx
│  │  │  ├─ LessonScreen.tsx
│  │  │  ├─ QuizScreen.tsx
│  │  │  ├─ SubmissionScreen.tsx
│  │  │  └─ VideoPlayerScreen.tsx
│  │  │
│  │  ├─ /finance
│  │  │  ├─ InvoicesScreen.tsx
│  │  │  ├─ InvoiceDetailScreen.tsx
│  │  │  ├─ PaymentScreen.tsx
│  │  │  └─ TransactionHistoryScreen.tsx
│  │  │
│  │  ├─ /communication
│  │  │  ├─ MessagesScreen.tsx
│  │  │  ├─ ChatScreen.tsx
│  │  │  ├─ AnnouncementsScreen.tsx
│  │  │  └─ NotificationsScreen.tsx
│  │  │
│  │  ├─ /reports
│  │  │  ├─ ReportsScreen.tsx
│  │  │  ├─ ReportDetailScreen.tsx
│  │  │  └─ ReportViewerScreen.tsx
│  │  │
│  │  ├─ /profile
│  │  │  ├─ ProfileScreen.tsx
│  │  │  ├─ EditProfileScreen.tsx
│  │  │  ├─ SecurityScreen.tsx
│  │  │  └─ PreferencesScreen.tsx
│  │  │
│  │  └─ /settings
│  │     ├─ SettingsScreen.tsx
│  │     ├─ AppSettingsScreen.tsx
│  │     ├─ NotificationPreferencesScreen.tsx
│  │     └─ AboutScreen.tsx
│  │
│  ├─ /components                # Reusable components
│  │  ├─ /ui
│  │  │  ├─ Button.tsx
│  │  │  ├─ Card.tsx
│  │  │  ├─ Input.tsx
│  │  │  ├─ Select.tsx
│  │  │  ├─ Checkbox.tsx
│  │  │  ├─ Modal.tsx
│  │  │  ├─ Alert.tsx
│  │  │  ├─ Badge.tsx
│  │  │  ├─ Avatar.tsx
│  │  │  ├─ EditText.tsx           # TextField with validation
│  │  │  ├─ TabBar.tsx
│  │  │  ├─ Spinner.tsx
│  │  │  ├─ Skeleton.tsx
│  │  │  └─ BottomSheet.tsx
│  │  │
│  │  ├─ /layout
│  │  │  ├─ SafeAreaWrapper.tsx
│  │  │  ├─ BottomTabsNavigator.tsx
│  │  │  ├─ DrawerNavigator.tsx
│  │  │  ├─ StackNavigator.tsx
│  │  │  ├─ Header.tsx
│  │  │  └─ EmptyState.tsx
│  │  │
│  │  ├─ /dashboard
│  │  │  ├─ StatCard.tsx
│  │  │  ├─ ChartWidget.tsx
│  │  │  ├─ ListItem.tsx
│  │  │  └─ ProgressBar.tsx
│  │  │
│  │  └─ /common
│  │     ├─ LoadingIndicator.tsx
│  │     ├─ ErrorBoundary.tsx
│  │     ├─ OfflineBanner.tsx
│  │     └─ RefreshControl.tsx
│  │
│  ├─ /navigation                # Navigation configuration
│  │  ├─ RootNavigator.tsx        # Main router
│  │  ├─ AuthNavigator.tsx
│  │  ├─ DashboardNavigator.tsx
│  │  └─ LinkingConfiguration.ts  # Deep linking
│  │
│  ├─ /stores                    # Zustand stores
│  │  ├─ authStore.ts
│  │  ├─ uiStore.ts
│  │  ├─ userStore.ts
│  │  ├─ offlineStore.ts
│  │  └─ notificationStore.ts
│  │
│  ├─ /hooks                     # Custom hooks
│  │  ├─ useAuth.ts
│  │  ├─ useUser.ts
│  │  ├─ useClasses.ts
│  │  ├─ useGrades.ts
│  │  ├─ useNotifications.ts
│  │  ├─ useOffline.ts
│  │  ├─ useBiometric.ts         # Face ID / Fingerprint
│  │  ├─ useCamera.ts            # Document capture
│  │  └─ useLocalStorage.ts
│  │
│  ├─ /services                  # API services
│  │  ├─ apiClient.ts
│  │  ├─ authService.ts
│  │  ├─ userService.ts
│  │  ├─ classService.ts
│  │  ├─ gradeService.ts
│  │  ├─ financeService.ts
│  │  ├─ lmsService.ts
│  │  ├─ communicationService.ts
│  │  └─ reportService.ts
│  │
│  ├─ /database                  # WatermelonDB
│  │  ├─ schema.ts
│  │  ├─ migrations.ts
│  │  ├─ models/
│  │  │  ├─ User.ts
│  │  │  ├─ Class.ts
│  │  │  ├─ Grade.ts
│  │  │  ├─ Invoice.ts
│  │  │  ├─ Course.ts
│  │  │  └─ Message.ts
│  │  └─ synchronize.ts          # Sync engine
│  │
│  ├─ /utils
│  │  ├─ colors.ts
│  │  ├─ styles.ts               # StyleSheet factory
│  │  ├─ validators.ts
│  │  ├─ constants.ts
│  │  ├─ formatters.ts
│  │  └─ helpers.ts
│  │
│  ├─ /types
│  │  ├─ index.ts
│  │  ├─ user.ts
│  │  ├─ class.ts
│  │  ├─ grade.ts
│  │  ├─ invoice.ts
│  │  ├─ course.ts
│  │  ├─ message.ts
│  │  └─ api.ts
│  │
│  ├─ /locales                   # i18n translations
│  │  ├─ fr.json
│  │  ├─ en.json
│  │  ├─ sw.json                 # Swahili
│  │  └─ yo.json                 # Yoruba
│  │
│  └─ App.tsx                    # Root component
│
├─ /assets
│  ├─ /images
│  ├─ /icons
│  └─ /fonts
│
├─ /ios                          # Native iOS code
│  └─ Podfile
│
├─ /android                      # Native Android code
│  └─ build.gradle
│
└─ README.md
```

---

## Core Features

### 1. Authentication & Biometrics

```typescript
// hooks/useBiometric.ts
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export function useBiometric() {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  
  useEffect(() => {
    const checkBiometric = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(compatible && enrolled);
    };
    
    checkBiometric();
  }, []);
  
  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: 'Unlock your NeoClass account',
      });
      return result.success;
    } catch (error) {
      console.error('Biometric failed:', error);
      return false;
    }
  };
  
  return { isBiometricAvailable, authenticate };
}

// Usage
export function LoginScreen() {
  const { isBiometricAvailable, authenticate } = useBiometric();
  
  const handleBiometricLogin = async () => {
    const success = await authenticate();
    if (success) {
      // Get stored credentials and login
      const credentials = await SecureStore.getItemAsync('auth_credentials');
      await login(JSON.parse(credentials!));
    }
  };
  
  return (
    <View>
      {/* Regular login form */}
      {isBiometricAvailable && (
        <Button onPress={handleBiometricLogin} title="Login with Biometrics" />
      )}
    </View>
  );
}
```

### 2. Local Database (WatermelonDB)

```typescript
// database/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'school_id', type: 'string', isIndexed: true },
        { name: 'synced_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'grades',
      columns: [
        { name: 'student_id', type: 'string', isIndexed: true },
        { name: 'course_id', type: 'string', isIndexed: true },
        { name: 'score', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'synced_at', type: 'number' },
      ],
    }),
    // ... other tables
  ],
});

// database/models/Grade.ts
import { Model } from '@nozbe/watermelondb';
import { field, relation, date } from '@nozbe/watermelondb/decorators';

export class Grade extends Model {
  static table = 'grades';
  
  @field('student_id') studentId!: string;
  @field('course_id') courseId!: string;
  @field('score') score!: number;
  @date('created_at') createdAt!: Date;
  @date('synced_at') syncedAt?: Date;
}
```

### 3. Offline Sync Engine

```typescript
// database/synchronize.ts
import Database from '@nozbe/watermelondb';

export async function synchronizeData(
  database: Database,
  apiClient: AxiosInstance
) {
  try {
    // 1. Download data from server
    const { users, grades, invoices } = await apiClient.get('/sync/all');
    
    // 2. Write to local DB
    await database.write(async () => {
      const usersCollection = database.collections.get('users');
      
      for (const user of users) {
        await usersCollection.create((newUser) => {
          newUser.email = user.email;
          newUser.name = user.name;
          newUser.syncedAt = new Date();
        });
      }
    });
    
    // 3. Upload local changes to server
    await uploadPendingChanges(database, apiClient);
    
  } catch (error) {
    console.error('Sync failed in offline mode, will retry:', error);
    // Queue will retry when connection is restored
  }
}

// Listen for network changes
import NetInfo from '@react-native-community/netinfo';

export function setupSyncListener(database: Database, apiClient: AxiosInstance) {
  NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      synchronizeData(database, apiClient);
    }
  });
}
```

### 4. Real-time Features (Socket.io)

```typescript
// services/socketService.ts
import io, { Socket } from 'socket.io-client';

export class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  
  connect(url: string, token: string) {
    this.socket = io(url, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });
    
    this.socket.on('connect', () => console.log('Socket connected'));
    this.socket.on('disconnect', () => console.log('Socket disconnected'));
    this.socket.on('error', (error) => this.handleError(error));
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
      
      this.socket?.on(event, (data) => {
        this.listeners.get(event)?.forEach((cb) => cb(data));
      });
    }
    
    this.listeners.get(event)!.push(callback);
  }
  
  off(event: string) {
    this.listeners.delete(event);
    this.socket?.off(event);
  }
  
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
  
  private handleError(error: any) {
    console.error('Socket error:', error);
  }
}
```

### 5. Push Notifications (Firebase)

```typescript
// hooks/usePushNotifications.ts
import { getMessaging, getToken } from 'firebase/messaging';
import * as Notifications from 'expo-notifications';

export function usePushNotifications() {
  useEffect(() => {
    // Request permissions
    async function setupNotifications() {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }
      
      // Get FCM token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'YOUR_PROJECT_ID',
      });
      
      // Send to backend
      await authService.registerPushToken(token.data);
    }
    
    setupNotifications();
  }, []);
  
  // Handle incoming notifications
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        // Handle notification data
        handleNotificationPress(data);
      }
    );
    
    return () => subscription.remove();
  }, []);
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});
```

### 6. Camera & Document Capture

```typescript
// hooks/useCamera.ts
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export function useCamera() {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      return result.assets[0];
    }
  };
  
  const capturePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    
    if (!result.canceled) {
      return result.assets[0];
    }
  };
  
  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword'],
    });
    
    if (result.type === 'success') {
      return result;
    }
  };
  
  return { pickImage, capturePhoto, pickDocument };
}
```

---

## Navigation Structure

### Root Navigator
```typescript
// navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { DashboardNavigator } from './DashboardNavigator';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <SplashScreen />;
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Dashboard" component={DashboardNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Dashboard Navigator (Bottom Tabs + Drawer)
```typescript
// navigation/DashboardNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function DashboardTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            Classes: 'book',
            Grades: 'bar-chart',
            Messages: 'mail',
            Profile: 'user',
          };
          return <Icon name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6D28D9',
        tabBarInactiveTintColor: '#9CA3AF',
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Classes" component={ClassesScreen} />
      <Tab.Screen name="Grades" component={GradesScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function DashboardNavigator() {
  return (
    <Drawer.Navigator screenOptions={drawerOptions}>
      <Drawer.Screen name="Main" component={DashboardTabs} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Help" component={HelpScreen} />
      <Drawer.Screen name="Logout" component={LogoutScreen} />
    </Drawer.Navigator>
  );
}
```

---

## Styling

### Theme Configuration
```typescript
// utils/theme.ts
export const colors = {
  primary: '#6D28D9',
  secondary: '#8B5CF6',
  accent: '#FACC15',
  gray50: '#F9FAFB',
  gray900: '#111827',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
};

export const sizes = {
  buttonHeight: 48,
  inputHeight: 44,
  headerHeight: 56,
  tabBarHeight: 62,
};

// Usage
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
  },
  button: {
    height: sizes.buttonHeight,
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

---

## Performance Optimization

### Lazy Loading
```typescript
const ClassDetail = React.lazy(() => import('./ClassDetailScreen'));

// Memoization
const TeacherListItem = React.memo(({ teacher, onPress }) => (
  <Pressable onPress={() => onPress(teacher.id)}>
    <Text>{teacher.name}</Text>
  </Pressable>
));
```

### Image Optimization
```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: avatarUrl, cache: FastImage.cacheControl.immutable }}
  style={{ width: 100, height: 100 }}
/>
```

---

## Android-Specific Considerations

### Storage Permission (Scoped Storage)
```typescript
// android/app/build.gradle
targetSdkVersion 34

// Request permissions
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const permission = Platform.OS === 'android'
  ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
  : PERMISSIONS.IOS.PHOTO_LIBRARY;

const result = await request(permission);
```

### Network Security
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- network_security_config.xml -->
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">api.neoclass.io</domain>
  </domain-config>
</network-security-config>
```

---

## iOS-Specific Considerations

### App Transport Security
```xml
<!-- ios/Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
  <key>NSExceptionDomains</key>
  <dict>
    <key>api.neoclass.io</key>
    <dict>
      <key>NSIncludesSubdomains</key>
      <true/>
      <key>NSThirdPartyExceptionRequiresForwardSecrecy</key>
      <false/>
    </dict>
  </dict>
</dict>
```

### App Capabilities
- Face ID (Privacy - Face ID Usage Description)
- Camera (Privacy - Camera Usage Description)
- Photo Library
- Push Notifications

---

## Testing

### Unit Tests (Jest)
```typescript
// __tests__/authService.test.ts
import { authService } from '@/services/authService';

describe('authService', () => {
  it('should login successfully', async () => {
    const result = await authService.login({
      email: 'teacher@school.edu',
      password: 'password123',
    });
    
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
  });
});
```

### Component Tests
```typescript
// __tests__/Button.test.tsx
import { render } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Press me</Button>);
    expect(getByText('Press me')).toBeDefined();
  });
});
```

### E2E Tests (Detox)
```typescript
// e2e/login.e2e.ts
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('teacher@school.edu');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).multiTap();
    
    await waitFor(element(by.id('dashboard-header')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

---

## Deployment

### Generate iOS Build
```bash
eas build --platform ios --auto-submit
```

### Generate Android Build
```bash
eas build --platform android --auto-submit
```

### Submission to App Stores
```bash
eas submit --platform ios
eas submit --platform android
```

---

## Environment Configuration

```json
// app.config.js
export default {
  expo: {
    name: 'NeoClass',
    slug: 'neoclass',
    version: '1.0.0',
    platforms: ['ios', 'android'],
    orientation: 'portrait',
    icon: './assets/icons/app-icon.png',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTabletMode: true,
      bundleIdentifier: 'com.neoclass.mobile',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icons/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.neoclass.mobile',
    },
    extra: {
      apiUrl: process.env.API_URL,
      socketUrl: process. env.SOCKET_URL,
    },
  },
};
```

