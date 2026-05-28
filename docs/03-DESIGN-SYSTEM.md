# Design System NeoClass

## Vision

Un design system moderne, épuré et inspiré par les meilleurs : Notion (simplicité), Stripe (professionnalisme), Linear (performance), Duolingo (engagement), Google Classroom (éducation).

**Objectif** : Interface intuitive pour les écoles africaines, optimisée pour bande passante limité et multi-plateforme.

---

## 1. Palette de couleurs

### Couleurs Primaires

| Couleur | Code | Usage |
|---------|------|-------|
| **Violet Primaire** | `#6D28D9` | CTA, headers, accents principaux |
| **Violet Secondaire** | `#8B5CF6` | Hover states, secondary actions |
| **Ambre Accent** | `#FACC15` | Alertes, highlights, notifications |

### Couleurs Étendues

```
VIOLETS:
  Violet-50:    #FAF5FF
  Violet-100:   #F3E8FF
  Violet-200:   #E9D5FF
  Violet-300:   #DDD6FE
  Violet-400:   #C4B5FD
  Violet-500:   #A78BFA
  Violet-600:   #8B5CF6  (Secondary)
  Violet-700:   #7C3AED
  Violet-800:   #6D28D9  (Primary)
  Violet-900:   #581C87
  Violet-950:   #3F0F5C

AMBRE/OR:
  Amber-50:     #FFFBEB
  Amber-100:    #FEF3C7
  Amber-200:    #FDE68A
  Amber-300:    #FCD34D
  Amber-400:    #FBBF24
  Amber-500:    #FBBF24
  Amber-600:    #D97706
  Amber-700:    #B45309
  Amber-800:    #92400E
  Amber-900:    #78350F

NEUTRES:
  Gris-50:      #F9FAFB
  Gris-100:     #F3F4F6
  Gris-200:     #E5E7EB
  Gris-300:     #D1D5DB
  Gris-400:     #9CA3AF
  Gris-500:     #6B7280
  Gris-600:     #4B5563
  Gris-700:     #374151
  Gris-800:     #1F2937
  Gris-900:     #111827
  Gris-950:     #030712

ÉTATS:
  Succès:       #10B981  (Vert)
  Danger:       #EF4444  (Rouge)
  Info:         #3B82F6  (Bleu)
  Warning:      #F59E0B  (Orange)
  Disabled:     #9CA3AF  (Gris)
```

### Utilisation par contexte

```
BACKGROUNDS:
  Page default:     Gris-50
  Sections:         Blanc (#FFFFFF)
  Hover:            Gris-100
  Disabled:         Gris-100

TEXT:
  Primary:          Gris-900
  Secondary:        Gris-600
  Tertiary:         Gris-500
  Disabled:         Gris-400
  Inverse (dark):   Blanc

BORDERS:
  Default:          Gris-200
  Focus:            Violet-300
  Error:            #EF4444
  Success:          #10B981

INTERACTIVE:
  Primary button:   Violet-800 (#6D28D9)
  Hover:            Violet-900
  Active:           Violet-950
  Ghost button:     Transparent + Violet-600 border

ACTION:
  Create:           #10B981 (Vert)
  Delete:           #EF4444 (Rouge)
  Edit:             Violet-600
  Archive:          Gris-500
```

---

## 2. Typographie

### Hiérarchie des polices

```
Font Stack: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif

DISPLAY (Hero):
  Size:     48px / 56px
  Weight:   700 Bold
  Line:     1.2
  Letter:   -0.02em
  Usage:    Page titles, hero sections

HEADING 1:
  Size:     36px / 40px
  Weight:   700 Bold
  Line:     1.3
  Letter:   -0.01em
  Usage:    Section titles, modals

HEADING 2:
  Size:     28px / 32px
  Weight:   600 SemiBold
  Line:     1.4
  Letter:   0
  Usage:    Subsection titles

HEADING 3:
  Size:     24px / 28px
  Weight:   600 SemiBold
  Line:     1.4
  Letter:   0
  Usage:    Card titles, sidebar titles

HEADING 4:
  Size:     20px / 24px
  Weight:   600 SemiBold
  Line:     1.5
  Letter:   0
  Usage:    Form labels, list headers

BODY LARGE:
  Size:     18px / 28px
  Weight:   400 Regular
  Line:     1.55
  Letter:   0
  Usage:    Important body text, descriptions

BODY:
  Size:     16px / 24px
  Weight:   400 Regular
  Line:     1.5
  Letter:   0
  Usage:    Main body text, desriptions

BODY SMALL:
  Size:     14px / 20px
  Weight:   400 Regular
  Line:     1.42
  Letter:   0
  Usage:    Secondary text, helper text

CAPTION:
  Size:     12px / 16px
  Weight:   500 Medium
  Line:     1.33
  Letter:   0.02em
  Usage:    Labels, badges, timestamps

MONO:
  Font:     'JetBrains Mono', 'Courier New', monospace
  Size:     14px
  Weight:   400 Regular
  Usage:    Code blocks, API keys
```

### Exemples CSS
```css
.display-large {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.heading-1 {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.3;
}

.body {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

.caption {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
}
```

---

## 3. Composants UI Principaux

### 3.1 Buttons

```
BUTTON VARIANTS:

PRIMARY:
  Background:    #6D28D9 (Violet-800)
  Text:          #FFFFFF
  Hover:         #7C3AED (Violet-700)
  Active:        #5B21B6 (Violet-900)
  Border:        None
  Shadow:        0 1px 2px rgba(0,0,0,0.05)
  Padding:       8px 16px
  Border Radius: 8px
  Font:          Body Small (14px)
  Icon + Gap:    8px

SECONDARY:
  Background:    #F3E8FF (Violet-100)
  Text:          #6D28D9
  Border:        1px #E9D5FF
  Hover:         #E9D5FF (Violet-200)
  Active:        #DDD6FE (Violet-300)
  Shadow:        0 1px 2px rgba(0,0,0,0.05)

GHOST:
  Background:    Transparent
  Text:          #6D28D9
  Border:        1px #D1D5DB (Gris-300)
  Hover:         #F3E8FF
  Active:        #E9D5FF

DANGER:
  Background:    #EF4444
  Text:          #FFFFFF
  Hover:         #DC2626
  Active:        #B91C1C

SUCCESS:
  Background:    #10B981
  Text:          #FFFFFF
  Hover:         #059669
  Active:        #047857

SIZES:
  XS:            12px text, 6px 12px padding
  SM:            14px text, 8px 12px padding
  MD:            14px text, 8px 16px padding  (default)
  LG:            16px text, 12px 20px padding
  XL:            16px text, 12px 24px padding
  FULL:          Width 100%
```

### 3.2 Forms & Inputs

```
INPUT FIELD:
  Background:    #FFFFFF
  Border:        1px #E5E7EB (Gris-200)
  Border Radius: 8px
  Padding:       8px 12px
  Font:          14px / 20px
  Focus:         Border #8B5CF6, Box-shadow 0 0 0 3px rgba(139, 92, 246, 0.1)
  Disabled:      #F3F4F6, #9CA3AF text

SELECT:
  Same as input + dropdown arrow
  Icon color:    #6B7280 (Gris-500)

TEXTAREA:
  Min Height:    80px
  Resize:        Vertical only
  Font:          14px / 20px monospace

CHECKBOX / RADIO:
  Default:       #E5E7EB border
  Checked:       #6D28D9 background
  Hover:         #DDD6FE background

FORM LABEL:
  Font:          14px / 20px Bold
  Color:         #1F2937 (Gris-800)
  Margin Bottom: 4px
  Required:      Red asterisk

FORM ERROR:
  Color:         #EF4444
  Font:          12px / 16px
  Margin Top:    4px
  Icon:          ⚠️

FORM HELP TEXT:
  Color:         #6B7280
  Font:          12px / 16px
  Margin Top:    4px
```

### 3.3 Cards

```
DEFAULT CARD:
  Background:    #FFFFFF
  Border:        1px #E5E7EB
  Border Radius: 12px
  Padding:       20px
  Shadow:        0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
  Hover:         Shadow increased, border #DDD6FE
  Transition:    all 200ms ease-in-out

CARD WITH ICON:
  Icon Size:     40px | 48px | 56px
  Icon Color:    Violet-600
  Icon BG:       Violet-100
  Icon Radius:   8px

CARD INTERACTIVE:
  Cursor:        pointer
  Hover:         Transform translateY(-2px)
  Click:         Active state with border Violet-300

CARD LAYOUT:
  Header:        24px bold text
  Body:          16px regular text, margin top 8px
  Footer:        12px secondary text, margin top 16px
  Actions:       Button right-aligned
```

### 3.4 Navigation & Sidebar

```
SIDEBAR:
  Width:         280px (desktop), 60px (collapsed)
  Background:    #FFFFFF
  Border Right:  1px #E5E7EB
  Padding:       16px top
  Shadow:        None (or subtle on mobile overlay)

MENU ITEM:
  Height:        40px
  Padding:       8px 12px
  Icon Size:     20px
  Label:         14px regular
  Default:       #6B7280 (Gris-500)
  Hover:         #1F2937 (Gris-800), background #F3F4F6
  Active:        #6D28D9, background #FAF5FF
  Transition:    all 150ms ease-in-out

BREADCRUMB:
  Font:          14px regular
  Separator:     / (Gris-400)
  Current:       Bold, Gris-900
  Previous:      Link Violet-600 hover

TABS:
  Height:        40px
  Font:          14px medium
  Border Bottom: 2px
  Default:       #6B7280, border transparent
  Hover:         #374151
  Active:        Violet-800, border Violet-800
  Transition:    all 150ms

PAGINATION:
  Button Size:   32px x 32px
  Border:        1px #E5E7EB
  Hover:         #F3F4F6
  Active:        Violet-800 background, white text
  Disabled:      #F9FAFB, #9CA3AF text
```

### 3.5 Badges & Tags

```
BADGE:
  Padding:       4px 8px
  Font:          12px bold
  Border Radius: 6px
  Display:       inline-block

STATUS BADГES:
  Success:       Background #D1FAE5, text #065F46
  Warning:       Background #FEF3C7, text #92400E
  Error:         Background #FEE2E2, text #991B1B
  Info:          Background #DBEAFE, text #0C4A6E
  Pending:       Background #F3E8FF, text #581C87

TAGS:
  Background:    Varied (based on category)
  Padding:       6px 12px
  Font:          12px regular
  Border Radius: 16px
  Close Icon:    ✕ on hover
```

### 3.6 Modals & Dialogs

```
OVERLAY:
  Background:    rgba(0, 0, 0, 0.5)
  Blur:          No blur (ou 2px si performant)

MODAL:
  Background:    #FFFFFF
  Border Radius: 16px
  Box Shadow:    0 20px 25px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.1)
  Width:         90vw max 600px
  Max Height:    90vh
  Animation:     Scale 0.95 → 1 + fade in
  Duration:      200ms

MODAL HEADER:
  Padding:       24px
  Border Bottom: 1px #E5E7EB
  Font:          20px bold
  Close Button:  Top right × icon

MODAL BODY:
  Padding:       24px
  Max Height:    calc(90vh - 120px)
  Overflow:      Auto

MODAL FOOTER:
  Padding:       20px 24px
  Border Top:    1px #E5E7EB
  Text Align:    Right
  Button Gap:    12px
```

### 3.7 Alerts & Notifications

```
ALERT:
  Padding:       12px 16px
  Border Radius: 8px
  Border Left:   4px colored
  Icon:          Leadingspace
  Close Button:  Right align

SUCCESS:
  Background:    #D1FAE5
  Border:        #10B981
  Icon:          ✓ Green
  Text:          #065F46

ERROR:
  Background:    #FEE2E2
  Border:        #EF4444
  Icon:          ⚠ Red
  Text:          #991B1B

WARNING:
  Background:    #FEF3C7
  Border:        #F59E0B
  Icon:          ⚠ Orange
  Text:          #92400E

INFO:
  Background:    #DBEAFE
  Border:        #3B82F6
  Icon:          ℹ Blue
  Text:          #0C4A6E

TOAST NOTIFICATION:
  Position:      Bottom-right (30px margin)
  Animation:     Slide in from right + fade
  Duration:      4 seconds (auto-dismiss)
  Width:         300-400px
  Mobile:        Bottom with 16px margin
```

### 3.8 Loaders & Skeletons

```
SPINNER:
  Size:          24px | 40px | 56px
  Color:         Violet-600
  Speed:         1 full rotation / 1s
  Style:         Minimalist circular border

PROGRESS BAR:
  Height:        4px | 8px
  Background:    #E5E7EB
  Fill:          Violet-600
  Border Radius: 4px
  Animation:     Linear transition

SKELETON:
  Background:    #E5E7EB
  Animation:     Pulse opacity 0.5 → 1
  Duration:      1.5s
  Border Radius: 4px
```

---

## 4. Architecture Composants (Next.js + Tailwind)

### Structure VSCode
```
/components
  /ui
    Button.tsx
    Card.tsx
    Input.tsx
    Select.tsx
    Modal.tsx
    Alert.tsx
    Badge.tsx
    Tabs.tsx
    Pagination.tsx
  /layout
    Sidebar.tsx
    Header.tsx
    TopNav.tsx
    Footer.tsx
  /dashboard
    StatCard.tsx
    Chart.tsx
    DataTable.tsx
  /forms
    FormField.tsx
    FormError.tsx
    SubmitButton.tsx

/styles
  globals.css
  tailwind.config.js
  colors.js

/lib
  constants.ts
  colors.ts
  classNames.ts
```

### Tailwind Config
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      primary: '#6D28D9',
      secondary: '#8B5CF6',
      accent: '#FACC15',
      violet: {
        50: '#FAF5FF',
        100: '#F3E8FF',
        200: '#E9D5FF',
        300: '#DDD6FE',
        400: '#C4B5FD',
        500: '#A78BFA',
        600: '#8B5CF6',
        700: '#7C3AED',
        800: '#6D28D9',
        900: '#581C87',
        950: '#3F0F5C',
      },
      gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        // ... etc
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
}
```

---

## 5. Composants Détaillés (Code TSX)

### Button.tsx
```typescript
import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className,
    children,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
      primary: 'bg-violet-800 text-white hover:bg-violet-700 active:bg-violet-900 focus:ring-violet-500',
      secondary: 'bg-violet-100 text-violet-800 border-1 border-violet-200 hover:bg-violet-200 active:bg-violet-300',
      ghost: 'bg-transparent text-violet-800 border-1 border-gray-300 hover:bg-gray-100',
      danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
      success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700',
    };

    const sizes = {
      xs: 'px-3 py-1 text-xs gap-1',
      sm: 'px-3 py-2 text-sm gap-2',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-3 text-base gap-2',
      xl: 'px-6 py-3 text-base gap-3',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            {/* Spinner SVG */}
          </svg>
        ) : icon && iconPosition === 'left' ? (
          <>
            {icon}
            {children}
          </>
        ) : icon && iconPosition === 'right' ? (
          <>
            {children}
            {icon}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Card.tsx
```typescript
import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  clickable?: boolean;
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, clickable = false, icon, title, subtitle, actions, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'bg-white border border-gray-200 rounded-xl p-6 shadow-sm',
          'transition-all duration-200 ease-in-out',
          (interactive || clickable) && 'hover:shadow-md hover:border-violet-300 hover:-translate-y-0.5',
          clickable && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {(icon || title || actions) && (
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              {icon && (
                <div className="flex-shrink-0 w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  {icon}
                </div>
              )}
              <div>
                {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
```

---

