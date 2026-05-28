# Architecture Frontend Web - NeoClass

## Stack Technologique

```
Next.js 14 (React 18)
├─ TypeScript
├─ Tailwind CSS
├─ TanStack Query (React Query)
├─ Zustand (State Management)
├─ Socket.io (Real-time)
├─ Axios (HTTP Client)
├─ Next-i18n (Internationalization)
├─ next-auth (Authentication)
├─ shadcn/ui (Component Library)
└─ Storybook (Component Documentation)
```

---

## Structure du projet

```
/neoclass-web
├─ /app                          # Next.js App Router
│  ├─ /(auth)
│  │  ├─ login/page.tsx
│  │  ├─ register/page.tsx
│  │  ├─ forgot-password/page.tsx
│  │  └─ layout.tsx
│  │
│  ├─ /(dashboard)               # Protected routes
│  │  ├─ layout.tsx              # Sidebar + TopNav
│  │  ├─ page.tsx                # Dashboard home
│  │  │
│  │  ├─ [role]                  # Role-based routes
│  │  │  ├─ admin/               # Super Admin
│  │  │  ├─ school-admin/        # School Admin
│  │  │  ├─ teacher/             # Teacher
│  │  │  ├─ student/             # Student
│  │  │  └─ parent/              # Parent
│  │  │
│  │  ├─ classes/
│  │  │  ├─ [id]/page.tsx        # Class detail
│  │  │  └─ page.tsx             # Classes list
│  │  │
│  │  ├─ users/
│  │  │  ├─ [id]/page.tsx        # User profile
│  │  │  └─ page.tsx             # Users list
│  │  │
│  │  ├─ finance/
│  │  │  ├─ invoices/page.tsx
│  │  │  ├─ payments/page.tsx
│  │  │  └─ reports/page.tsx
│  │  │
│  │  ├─ lms/
│  │  │  ├─ courses/page.tsx
│  │  │  ├─ [courseId]/page.tsx
│  │  │  └─ content/page.tsx
│  │  │
│  │  ├─ communications/
│  │  │  ├─ messages/page.tsx
│  │  │  ├─ announcements/page.tsx
│  │  │  └─ [id]/page.tsx
│  │  │
│  │  ├─ reports/
│  │  │  ├─ academic/page.tsx
│  │  │  ├─ financial/page.tsx
│  │  │  └─ custom/page.tsx
│  │  │
│  │  ├─ settings/
│  │  │  ├─ profile/page.tsx
│  │  │  ├─ security/page.tsx
│  │  │  ├─ school/page.tsx      # School settings (admin)
│  │  │  └─ billing/page.tsx
│  │  │
│  │  └─ support/
│  │     ├─ tickets/page.tsx
│  │     └─ help/page.tsx
│  │
│  ├─ api/                        # Route handlers
│  │  ├─ auth/
│  │  │  ├─ login/route.ts
│  │  │  ├─ logout/route.ts
│  │  │  ├─ refresh/route.ts
│  │  │  └─ 2fa/route.ts
│  │  │
│  │  ├─ webhooks/
│  │  │  └─ stripe/route.ts
│  │  │
│  │  └─ revalidate/route.ts     # ISR revalidation
│  │
│  ├─ layout.tsx                 # Root layout
│  ├─ page.tsx                   # Home page
│  └─ error.tsx & not-found.tsx
│
├─ /components                   # Reusable components
│  ├─ /ui                        # Base UI components
│  │  ├─ Button.tsx
│  │  ├─ Card.tsx
│  │  ├─ Input.tsx
│  │  ├─ Select.tsx
│  │  ├─ Checkbox.tsx
│  │  ├─ Modal.tsx
│  │  ├─ Alert.tsx
│  │  ├─ Badge.tsx
│  │  ├─ Tabs.tsx
│  │  ├─ Pagination.tsx
│  │  ├─ Skeleton.tsx
│  │  ├─ Spinner.tsx
│  │  ├─ Tooltip.tsx
│  │  ├─ DropdownMenu.tsx
│  │  └─ Avatar.tsx
│  │
│  ├─ /layout
│  │  ├─ Sidebar.tsx             # Main navigation
│  │  ├─ TopNav.tsx              # Header
│  │  ├─ Footer.tsx
│  │  ├─ NotificationBell.tsx
│  │  ├─ UserMenu.tsx
│  │  ├─ MobileNav.tsx           # Mobile drawer
│  │  └─ Breadcrumb.tsx
│  │
│  ├─ /dashboard
│  │  ├─ StatCard.tsx            # KPI card
│  │  ├─ Chart.tsx               # Chart wrapper
│  │  ├─ DataTable.tsx           # Data table
│  │  ├─ ProgressBar.tsx
│  │  └─ Timeline.tsx
│  │
│  ├─ /forms
│  │  ├─ FormField.tsx           # Form builder
│  │  ├─ FormError.tsx
│  │  ├─ SubmitButton.tsx
│  │  ├─ LoginForm.tsx
│  │  ├─ RegisterForm.tsx
│  │  ├─ CreateClassForm.tsx
│  │  ├─ CreateUserForm.tsx
│  │  ├─ CreateInvoiceForm.tsx
│  │  └─ GradeEntryForm.tsx
│  │
│  ├─ /auth
│  │  ├─ ProtectedRoute.tsx
│  │  ├─ RoleGuard.tsx
│  │  └─ SessionProvider.tsx
│  │
│  └─ /common
│     ├─ LoadingPage.tsx
│     ├─ ErrorBoundary.tsx
│     └─ OfflineBanner.tsx
│
├─ /lib                          # Utility functions
│  ├─ api.ts                     # Axios instance
│  ├─ auth.ts                    # Auth utilities
│  ├─ colors.ts                  # Color constants
│  ├─ hooks.ts                   # Custom hooks
│  ├─ classNames.ts              # Tailwind helpers
│  ├─ validators.ts              # Form validators
│  ├─ constants.ts               # App constants
│  └─ utils.ts                   # General utilities
│
├─ /hooks                        # Custom React hooks
│  ├─ useAuth.ts                 # Auth context
│  ├─ useUser.ts                 # User queries
│  ├─ useClasses.ts              # Classes queries
│  ├─ useGrades.ts               # Grades queries
│  ├─ useNotifications.ts        # Real-time notifications
│  ├─ useOffline.ts              # Offline detection
│  ├─ useLocalStorage.ts
│  ├─ useDebounce.ts
│  ├─ useFetch.ts
│  └─ usePagination.ts
│
├─ /context                      # React Context
│  ├─ AuthContext.tsx
│  ├─ NotificationContext.tsx
│  ├─ OfflineContext.tsx
│ └─ ThemeContext.tsx
│
├─ /stores                       # Zustand stores
│  ├─ authStore.ts
│  ├─ uiStore.ts                 # Sidebar open/close, etc.
│  ├─ userStore.ts
│  ├─ notificationStore.ts
│  └─ filterStore.ts             # Global filters
│
├─ /services                     # API service layer
│  ├─ authService.ts
│  ├─ userService.ts
│  ├─ schoolService.ts
│  ├─ classService.ts
│  ├─ gradeService.ts
│  ├─ financeService.ts
│  ├─ lmsService.ts
│  ├─ communicationService.ts
│  └─ reportService.ts
│
├─ /queries                      # React Query (TanStack Query)
│  ├─ useGetUser.ts              # GET user
│  ├─ useGetClasses.ts
│  ├─ useGetGrades.ts
│  ├─ useCreateInvoice.ts        # POST invoice
│  ├─ useUpdateGrade.ts          # PUT grade
│  └─ queryKeys.ts               # Query key factory
│
├─ /types                        # TypeScript types
│  ├─ index.ts
│  ├─ user.ts
│  ├─ school.ts
│  ├─ class.ts
│  ├─ grade.ts
│  ├─ invoice.ts
│  ├─ course.ts
│  ├─ message.ts
│  ├─ api.ts                     # API response types
│  └─ module.ts
│
├─ /public                       # Static files
│  ├─ logo.svg
│  ├─ favicon.ico
│  ├─ icons/                     # Icon set
│  ├─ images/                    # Landing images
│  └─ manifests/
│     ├─ app.webmanifest        # PWA manifest
│     └─ robots.txt
│
├─ /styles                       # Global styles
│  ├─ globals.css                # Global Tailwind
│  ├─ colors.css                 # CSS color variables
│  └─ animations.css             # Custom animations
│
├─ /locales                      # i18n translations
│  ├─ fr.json
│  ├─ en.json
│  └─ local_languages/           # Swahili, Yoruba, etc.
│     ├─ sw.json
│     └─ yo.json
│
├─ middleware.ts                 # Next.js middleware
├─ next.config.js
├─ tailwind.config.ts
├─ tsconfig.json
├─ .env.local (dev)
├─ .env.production
├─ package.json
└─ README.md
```

---

## Authentication & Authorization Flow

### Login Flow
```
1. User inputs credentials
2. Frontend → POST /api/auth/login
3. Backend validates → returns JWT + Refresh Token
4. Frontend stores JWT in httpOnly cookie (secure)
5. Refresh token → localStorage (with expiry)
6. User redirected to dashboard based on role
```

### Protected Routes
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verify token validity
  const verified = await verifyToken(token.value);
  if (!verified) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

### Role-Based Access Control
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const { user } = useAuthStore();
  
  const canAccess = (requiredRoles: Role[]) => {
    return requiredRoles.includes(user?.role);
  };
  
  const canEdit = (resource: string) => {
    return hasPermission(user, resource, 'edit');
  };
  
  return { user, canAccess, canEdit };
}

// Usage in component
function AdminPanel() {
  const { canAccess } = useAuth();
  
  if (!canAccess(['admin', 'school-admin'])) {
    return <Unauthorized />;
  }
  
  return <AdminContent />;
}
```

---

## State Management (Zustand)

### Auth Store
```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      
      login: async (credentials) => {
        set({ isLoading: true });
        const { user, token } = await authService.login(credentials);
        set({ user, token, isLoading: false });
      },
      
      logout: () => {
        set({ user: null, token: null });
        authService.logout();
      },
      
      refresh: async () => {
        const { token } = await authService.refresh();
        set({ token });
      },
    }),
    { name: 'auth-store' }
  )
);
```

### UI Store (Sidebar, modals, etc.)
```typescript
export const useUIStore = create((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({
    isSidebarOpen: !state.isSidebarOpen,
  })),
  
  openModals: {},
  openModal: (key: string) => set((state) => ({
    openModals: { ...state.openModals, [key]: true },
  })),
  closeModal: (key: string) => set((state) => ({
    openModals: { ...state.openModals, [key]: false },
  })),
}));
```

---

## Data Fetching (React Query / TanStack Query)

### Query Key Factory
```typescript
// queries/queryKeys.ts
export const queryKeys = {
  all: ['root'] as const,
  users: () => [...queryKeys.all, 'users'] as const,
  user: (id: string) => [...queryKeys.users(), id] as const,
  classes: () => [...queryKeys.all, 'classes'] as const,
  class: (id: string) => [...queryKeys.classes(), id] as const,
  grades: () => [...queryKeys.all, 'grades'] as const,
  grades_by_student: (studentId: string) => 
    [...queryKeys.grades(), studentId] as const,
};
```

### Custom Hooks for Queries
```typescript
// hooks/useGetClasses.ts
import { useQuery } from '@tanstack/react-query';
import { classService } from '@/services/classService';
import { queryKeys } from '@/queries/queryKeys';

export function useGetClasses(schoolId: string, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.classes(),
    queryFn: () => classService.list(schoolId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled,
  });
}

// Usage
export function ClassesList() {
  const { data, isPending, error } = useGetClasses(schoolId);
  
  if (isPending) return <Skeleton />;
  if (error) return <Error message={error.message} />;
  
  return (
    <div>
      {data?.map((cls) => (
        <ClassCard key={cls.id} class={cls} />
      ))}
    </div>
  );
}
```

### Mutations
```typescript
// hooks/useCreateGrade.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gradeService } from '@/services/gradeService';
import { queryKeys } from '@/queries/queryKeys';

export function useCreateGrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateGradeDTO) => gradeService.create(data),
    onSuccess: (newGrade) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.grades(),
      });
      
      // Optional: Optimistic update
      queryClient.setQueryData(
        queryKeys.grades_by_student(newGrade.studentId),
        (old: any[]) => [...old, newGrade]
      );
    },
    onError: (error) => {
      console.error('Failed to create grade:', error);
      // Show error toast
    },
  });
}
```

---

## Real-time Features (Socket.io + WebSocket)

### Socket Service
```typescript
// services/socketService.ts
import io from 'socket.io-client';

export class SocketService {
  private socket: any;
  private url = process.env.NEXT_PUBLIC_SOCKET_URL;
  
  connect(token: string) {
    this.socket = io(this.url, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    
    this.socket.on('connect', () => console.log('Connected'));
    this.socket.on('disconnect', () => this.handleDisconnect());
    this.socket.on('error', (err: any) => this.handleError(err));
  }
  
  on(event: string, callback: (...args: any[]) => void) {
    this.socket.on(event, callback);
  }
  
  emit(event: string, data?: any) {
    this.socket.emit(event, data);
  }
  
  disconnect() {
    this.socket?.disconnect();
  }
  
  private handleDisconnect() {
    console.log('Disconnected from socket');
  }
  
  private handleError(err: any) {
    console.error('Socket error:', err);
  }
}

export const socketService = new SocketService();
```

### Notifications Hook
```typescript
// hooks/useNotifications.ts
export function useNotifications() {
  const { addNotification } = useNotificationStore();
  
  useEffect(() => {
    socketService.on('notification', (data) => {
      addNotification({
        id: uuid(),
        type: data.type,
        title: data.title,
        message: data.message,
        createdAt: new Date(),
      });
    });
    
    return () => {
      socketService.off('notification');
    };
  }, []);
}
```

---

## Offline Support (Service Workers + IndexedDB)

### Service Worker Registration
```typescript
// lib/serviceWorker.ts
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
  }
}

// app/layout.tsx
useEffect(() => {
  if (typeof window !== 'undefined') {
    registerServiceWorker();
  }
}, []);
```

### IndexedDB Sync
```typescript
// lib/db.ts
import { openDB } from 'idb';

const DB_NAME = 'neoclass-db';
const STORE_NAME = 'requests';

export async function saveForSync(request: any) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
  
  await db.add(STORE_NAME, request);
}

export async function getSyncQueue() {
  const db = await openDB(DB_NAME);
  return await db.getAll(STORE_NAME);
}
```

---

## Performance Optimizations

### Code Splitting
```typescript
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <Skeleton />,
  ssr: false, // Only load on client
});
```

### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/school-logo.png"
  alt="School"
  width={200}
  height={200}
  priority // For above-the-fold images
  quality={75}
/>
```

### Caching Strategy
```
Static pages:      ISR (revalidate every 24h)
User dashboards:   Client-side cache (5min)
Real-time data:    WebSocket + API
Big tables:        Server-side pagination
```

---

## i18n (Internationalization)

### Configuration
```typescript
// next-i18n.config.ts
export const i18nConfig = {
  defaultLocale: 'fr',
  locales: ['fr', 'en', 'sw', 'yo'], // French, English, Swahili, Yoruba
};

// middleware.ts
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  const pathnameIsMissing = i18nConfig.locales.every(
    (locale) => !pathname.startsWith(`/${locale}`) && pathname !== '/'
  );
  
  if (pathnameIsMissing) {
    return NextResponse.redirect(
      new URL(`/fr${pathname}`, request.url)
    );
  }
}
```

### Usage
```typescript
// app/[locale]/page.tsx
import { useTranslation } from 'next-i18next';

export default function Home({ params: { locale } }: any) {
  const { t } = useTranslation(locale);
  
  return (
    <h1>{t('dashboard.welcome')}</h1>
  );
}
```

---

## Testing Strategy

### Unit Tests (Jest)
```typescript
// __tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  
  it('handles click event', () => {
    const mockClick = jest.fn();
    render(<Button onClick={mockClick}>Click</Button>);
    screen.getByRole('button').click();
    expect(mockClick).toHaveBeenCalled();
  });
});
```

### E2E Tests (Playwright)
```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('[name=email]', 'teacher@school.edu');
  await page.fill('[name=password]', 'password123');
  await page.click('button[type=submit]');
  await page.waitForNavigation();
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Environment Variables

```env
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:8001
AUTH_SECRET=dev_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/neoclass_dev

# .env.production
NEXT_PUBLIC_API_URL=https://api.neoclass.io
NEXT_PUBLIC_SOCKET_URL=https://socket.neoclass.io
AUTH_SECRET=prod_secret_key
DATABASE_URL=postgresql://user:password@prod-db:5432/neoclass
```

---

## Deployment

### Vercel Deployment
```
npx create-next-app@latest neoclass-web
npm run build
vercel deploy --prod
```

### Custom Server (Node.js)
```bash
npm run build
npm start  # Runs on port 3000
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

