# Notification Component

A standardized notification component that supports success, error, warning, and
info types.

## Usage

```jsx
import { Notification } from '../../components';

// Success notification
<Notification type="success" onClose={handleClose}>
  Your changes have been saved successfully!
</Notification>

// Error notification
<Notification type="error" onClose={handleClose}>
  Something went wrong. Please try again.
</Notification>

// Warning notification
<Notification type="warning" onClose={handleClose}>
  Please review your information before proceeding.
</Notification>

// Info notification
<Notification type="info" onClose={handleClose}>
  Here's some helpful information for you.
</Notification>

// Without close button
<Notification type="success" showCloseButton={false}>
  This notification cannot be dismissed.
</Notification>
```

## Props

- `type` (string): The notification type. Options: `'success'`, `'error'`,
  `'warning'`, `'info'`. Default: `'info'`
- `message` (string): The notification message (alternative to children)
- `onClose` (function): Callback function when the close button is clicked
- `showCloseButton` (boolean): Whether to show the close button. Default: `true`
- `className` (string): Additional CSS class for the notification
- `rootClassName` (string): CSS class to override the default root class
- `children` (node): The notification content (alternative to message)

## Styling

The component uses CSS custom properties for consistent theming:

- Success: `--colorSuccess`, `--colorSuccessLight`, `--colorSuccessDark`
- Error: `--colorFail`, `--colorFailLight`
- Warning: `--colorAttention`, `--colorAttentionLight`
- Info: `--colorInfo`, `--colorInfoLight`

## Design System Integration

This component follows the existing design system patterns and uses the same
color variables and spacing units as other components in the application.
