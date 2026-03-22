type ToastVariant = 'default' | 'success' | 'error';

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastSubscriber = (toast: ToastInput) => void;

let subscriber: ToastSubscriber | null = null;

export function registerToastSubscriber(nextSubscriber: ToastSubscriber | null) {
  subscriber = nextSubscriber;
}

export function notifyToast(toast: ToastInput) {
  subscriber?.(toast);
}
