# Accessibility Guidelines - PostmanLocal

Tài liệu này mô tả các best practices và guidelines cho accessibility trong PostmanLocal.

## Tổng quan

PostmanLocal tuân thủ WCAG 2.1 Level AA để đảm bảo ứng dụng có thể truy cập được bởi tất cả người dùng, bao gồm những người sử dụng screen readers, keyboard navigation, và các assistive technologies khác.

## ARIA Attributes

### Labels và Descriptions

**Luôn cung cấp labels cho form inputs:**

```tsx
// ✅ Đúng
<Input label="Email" id="email" />
<Select label="Country" id="country" options={options} />

// ❌ Sai
<input type="email" />
<select><option>...</option></select>
```

**Sử dụng aria-label cho icon-only buttons:**

```tsx
// ✅ Đúng
<Button aria-label="Đóng modal">
  <X size={20} />
</Button>

// ❌ Sai
<Button>
  <X size={20} />
</Button>
```

**Sử dụng aria-describedby cho error messages và helper text:**

```tsx
// ✅ Đúng - Input component tự động xử lý
<Input 
  label="Email"
  error="Email không hợp lệ"
  helperText="Nhập địa chỉ email của bạn"
/>
```

### States và Properties

**Sử dụng aria-invalid cho error states:**

```tsx
// Input component tự động thêm aria-invalid="true" khi có error
<Input error="This field is required" />
```

**Sử dụng aria-required cho required fields:**

```tsx
// Input component tự động thêm aria-required khi props.required = true
<Input label="Email" required />
```

**Sử dụng aria-busy cho loading states:**

```tsx
// Button component tự động thêm aria-busy khi loading
<Button loading={isLoading}>Submit</Button>
```

### Roles

**Sử dụng role="dialog" cho modals:**

```tsx
// Modal component tự động thêm role="dialog" và aria-modal="true"
<Modal isOpen={isOpen} title="Confirm Action">
  ...
</Modal>
```

**Sử dụng role="alert" cho error messages:**

```tsx
// Input component tự động thêm role="alert" cho error messages
<Input error="Error message" />
```

## Keyboard Navigation

### Tab Order

Tất cả interactive elements phải có thể truy cập được bằng Tab key:

- Buttons
- Links
- Form inputs
- Select dropdowns
- Checkboxes và radio buttons

**Focus Management:**

```tsx
// Modal component tự động trap focus và quản lý focus khi mở/đóng
<Modal isOpen={isOpen} onClose={onClose}>
  {/* Focus được trap trong modal */}
</Modal>
```

### Keyboard Shortcuts

**Standard shortcuts:**

- `Tab`: Di chuyển đến element tiếp theo
- `Shift + Tab`: Di chuyển đến element trước đó
- `Enter`: Activate button hoặc submit form
- `Space`: Activate button hoặc toggle checkbox
- `Escape`: Đóng modal hoặc dialog
- `Arrow keys`: Navigate trong dropdowns và lists

**Custom shortcuts trong PostmanLocal:**

- `Ctrl/Cmd + Enter`: Send request
- `Ctrl/Cmd + S`: Save request
- `Ctrl/Cmd + K`: Open command palette
- `Ctrl/Cmd + /`: Toggle comments

### Focus Indicators

Tất cả interactive elements phải có visible focus indicators:

```tsx
// Button component có focus:ring-2 focus:ring-offset-2
<Button>Click me</Button>
```

Focus indicators sử dụng:
- `focus:outline-none`: Loại bỏ default outline
- `focus:ring-2`: Thêm ring với độ dày 2px
- `focus:ring-offset-2`: Offset ring để dễ nhìn hơn

## Screen Reader Support

### Semantic HTML

**Sử dụng semantic HTML elements:**

```tsx
// ✅ Đúng
<button>Click me</button>
<input type="email" />
<label htmlFor="email">Email</label>

// ❌ Sai
<div onClick={handleClick}>Click me</div>
<div contentEditable>Email input</div>
```

### Hidden Text

**Sử dụng visually-hidden text cho screen readers:**

```tsx
// Khi button chỉ có icon
<Button aria-label="Delete item">
  <Trash2 size={20} />
</Button>

// Hoặc sử dụng sr-only class
<span className="sr-only">Delete item</span>
<Trash2 size={20} />
```

### Live Regions

**Sử dụng aria-live cho dynamic content:**

```tsx
// Toast notifications tự động announce cho screen readers
toast.success("Request sent successfully");
```

## Form Accessibility

### Label Association

**Luôn associate labels với inputs:**

```tsx
// Input component tự động tạo id và associate label
<Input label="Email" />
// Renders: <label htmlFor="generated-id">Email</label>
//          <input id="generated-id" />
```

### Error Messages

**Error messages phải:**

1. Có role="alert" để screen reader announce
2. Được associate với input qua aria-describedby
3. Hiển thị ngay sau input

```tsx
// Input component tự động xử lý
<Input 
  label="Email"
  error="Email không hợp lệ"
  // Renders: <input aria-invalid="true" aria-describedby="email-error" />
  //          <p id="email-error" role="alert">Email không hợp lệ</p>
/>
```

### Required Fields

**Required fields phải:**

1. Có visual indicator (dấu *)
2. Có aria-required="true"
3. Label có text "required" cho screen readers

```tsx
// Input component tự động xử lý
<Input label="Email" required />
// Renders: <label>Email <span aria-label="bắt buộc">*</span></label>
//          <input aria-required="true" />
```

## Modal và Dialog Accessibility

### Focus Management

**Modal component tự động:**

1. Trap focus trong modal khi mở
2. Trả focus về element trước đó khi đóng
3. Focus vào modal container khi mở

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Confirm">
  {/* Focus được trap ở đây */}
</Modal>
```

### Keyboard Support

**Modal hỗ trợ:**

- `Escape`: Đóng modal
- `Tab`: Navigate trong modal (trapped)
- `Shift + Tab`: Navigate ngược (trapped)

### ARIA Attributes

**Modal tự động thêm:**

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` (nếu có title)

```tsx
<Modal title="Delete Item">
  {/* Renders: <div role="dialog" aria-modal="true" aria-labelledby="modal-title"> */}
</Modal>
```

## Color và Contrast

### Contrast Ratios

Tất cả text phải đáp ứng:

- **Normal text**: Tối thiểu 4.5:1 contrast ratio
- **Large text (18pt+)**: Tối thiểu 3:1 contrast ratio
- **UI components**: Tối thiểu 3:1 contrast ratio

### Color Independence

**Không chỉ dựa vào color để truyền đạt thông tin:**

```tsx
// ✅ Đúng - Có icon và text
<div className="flex items-center gap-2">
  <CheckCircle className="text-green-600" />
  <span>Success</span>
</div>

// ❌ Sai - Chỉ có color
<div className="text-green-600">Success</div>
```

## Testing Accessibility

### Manual Testing

1. **Keyboard Navigation:**
   - Tab qua tất cả interactive elements
   - Verify focus indicators visible
   - Test Escape key cho modals

2. **Screen Reader:**
   - Test với NVDA (Windows) hoặc VoiceOver (Mac)
   - Verify labels được announce đúng
   - Verify error messages được announce

3. **Color Contrast:**
   - Sử dụng browser DevTools để check contrast
   - Verify tất cả text đáp ứng WCAG AA

### Automated Testing

**Sử dụng các tools:**

- **axe DevTools**: Browser extension để scan accessibility issues
- **Lighthouse**: Accessibility audit trong Chrome DevTools
- **WAVE**: Web accessibility evaluation tool

## Best Practices

### 1. Luôn sử dụng UI Components

```tsx
// ✅ Đúng
import { Button, Input, Modal } from '@/components/UI';

// ❌ Sai
<button className="...">Click</button>
```

### 2. Cung cấp alternative text cho images

```tsx
<img src="..." alt="Mô tả hình ảnh" />
```

### 3. Sử dụng headings đúng hierarchy

```tsx
<h1>Main Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection Title</h3>
```

### 4. Đảm bảo skip links cho keyboard users

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### 5. Test với keyboard only

Disable mouse và chỉ sử dụng keyboard để navigate ứng dụng.

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
