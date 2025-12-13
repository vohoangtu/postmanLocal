# Design System - PostmanLocal

Tài liệu này mô tả design system của PostmanLocal, bao gồm các design tokens, components, và guidelines để đảm bảo UI consistency.

## Design Tokens

### Colors

Design system sử dụng color palette với các semantic colors:

- **Primary (Blue)**: `#3b82f6` - Dùng cho các actions chính, links, và highlights
- **Success (Green)**: `#22c55e` - Dùng cho success states và positive feedback
- **Error (Red)**: `#ef4444` - Dùng cho errors và destructive actions
- **Warning (Yellow)**: `#f59e0b` - Dùng cho warnings và cautions

Mỗi color có scale từ 50-900 để hỗ trợ nhiều use cases.

### Spacing

Spacing scale sử dụng rem units:

- `xs`: 0.25rem (4px)
- `sm`: 0.5rem (8px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `2xl`: 3rem (48px)
- `3xl`: 4rem (64px)

### Border Radius

- `sm`: 0.25rem (4px)
- `md`: 0.375rem (6px)
- `lg`: 0.5rem (8px)
- `xl`: 0.75rem (12px)
- `2xl`: 1rem (16px)
- `full`: 9999px (fully rounded)

### Shadows

- `sm`: 0 1px 2px 0 rgb(0 0 0 / 0.05)
- `md`: 0 4px 6px -1px rgb(0 0 0 / 0.1)
- `lg`: 0 10px 15px -3px rgb(0 0 0 / 0.1)
- `xl`: 0 20px 25px -5px rgb(0 0 0 / 0.1)

### Transitions

- `fast`: 150ms
- `normal`: 300ms
- `slow`: 500ms

## UI Components

### Button

Button component với nhiều variants và sizes.

```tsx
import { Button } from '@/components/UI';

<Button variant="primary" size="md">Click me</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="danger" size="lg">Delete</Button>
```

**Variants:**
- `primary`: Blue background, white text
- `secondary`: Gray background
- `danger`: Red background
- `ghost`: Transparent với border
- `link`: Text link style

**Sizes:**
- `sm`: Small (px-3 py-1.5 text-xs)
- `md`: Medium (px-4 py-2 text-sm) - default
- `lg`: Large (px-6 py-3 text-base)

**Props:**
- `variant`: Button style variant
- `size`: Button size
- `loading`: Hiển thị loading spinner
- `disabled`: Disable button
- `children`: Button content

### Input

Input component với label, error state, và helper text.

```tsx
import { Input } from '@/components/UI';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

**Props:**
- `label`: Label text
- `error`: Error message (hiển thị màu đỏ)
- `helperText`: Helper text bên dưới input
- `fullWidth`: Full width input
- Tất cả standard HTML input props

### Select

Select component với consistent styling.

```tsx
import { Select } from '@/components/UI';

<Select
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'vn', label: 'Vietnam' },
  ]}
/>
```

**Props:**
- `label`: Label text
- `options`: Array of { value, label }
- `error`: Error message
- `helperText`: Helper text
- `fullWidth`: Full width select
- Tất cả standard HTML select props

### Textarea

Textarea component với label và error state.

```tsx
import { Textarea } from '@/components/UI';

<Textarea
  label="Description"
  rows={5}
  placeholder="Enter description"
/>
```

**Props:**
- `label`: Label text
- `rows`: Number of rows (default: 4)
- `error`: Error message
- `helperText`: Helper text
- `fullWidth`: Full width textarea
- Tất cả standard HTML textarea props

### Modal

Modal component với overlay và customizable footer.

```tsx
import { Modal, Button } from '@/components/UI';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

**Props:**
- `isOpen`: Control modal visibility
- `onClose`: Close handler
- `title`: Modal title
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `footer`: Custom footer content
- `closeOnOverlayClick`: Close khi click overlay (default: true)
- `showCloseButton`: Hiển thị close button (default: true)

### Card

Card component với title, subtitle, và footer.

```tsx
import { Card } from '@/components/UI';

<Card
  title="Card Title"
  subtitle="Card subtitle"
  footer={<Button>Action</Button>}
  hover
>
  <p>Card content</p>
</Card>
```

**Props:**
- `title`: Card title
- `subtitle`: Card subtitle
- `footer`: Footer content
- `hover`: Enable hover shadow effect
- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')

### Badge

Badge component cho labels và tags.

```tsx
import { Badge } from '@/components/UI';

<Badge variant="success" size="md">Active</Badge>
<Badge variant="error">Inactive</Badge>
```

**Variants:**
- `primary`: Blue
- `success`: Green
- `error`: Red
- `warning`: Yellow
- `info`: Cyan
- `gray`: Gray

**Sizes:**
- `sm`: Small
- `md`: Medium (default)
- `lg`: Large

### Tooltip

Tooltip component cho additional information.

```tsx
import { Tooltip } from '@/components/UI';

<Tooltip content="This is a tooltip">
  <button>Hover me</button>
</Tooltip>
```

## Usage Guidelines

### Importing Components

Luôn import từ `@/components/UI` để đảm bảo consistency:

```tsx
import { Button, Input, Modal } from '@/components/UI';
```

### Dark Mode

Tất cả components đều hỗ trợ dark mode tự động thông qua Tailwind dark: classes.

### Accessibility

- Tất cả interactive elements đều có focus states
- Form inputs có proper labels và error messages
- Buttons có disabled states
- Modal có keyboard support (ESC để đóng)

### Consistency

- Luôn sử dụng design tokens từ `theme.ts` khi cần custom styling
- Prefer sử dụng UI components thay vì raw HTML elements
- Maintain consistent spacing và sizing
- Sử dụng semantic colors (primary, success, error, warning)

## Migration Guide

Khi refactor existing components để sử dụng design system:

1. Thay thế raw `<button>` bằng `<Button>`
2. Thay thế raw `<input>` bằng `<Input>` với proper labels
3. Thay thế raw `<select>` bằng `<Select>` với options array
4. Thay thế custom modals bằng `<Modal>` component
5. Sử dụng `<Card>` cho container components
6. Sử dụng `<Badge>` cho status indicators

## Examples

### Form Example

```tsx
import { Card, Input, Select, Button } from '@/components/UI';

function UserForm() {
  return (
    <Card title="User Information" padding="lg">
      <div className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Enter full name"
          required
          fullWidth
        />
        <Input
          label="Email"
          type="email"
          placeholder="Enter email"
          required
          fullWidth
        />
        <Select
          label="Country"
          options={countries}
          fullWidth
        />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Save</Button>
        </div>
      </div>
    </Card>
  );
}
```

### Modal Example

```tsx
import { Modal, Button, Input } from '@/components/UI';

function ConfirmModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    >
      <p>Are you sure you want to delete this item? This action cannot be undone.</p>
    </Modal>
  );
}
```
