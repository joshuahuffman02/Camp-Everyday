export {};

declare global {
  interface Window {
    __keyboardShortcuts?: {
      onSearch: (callback: () => void) => void;
      onHelp: (callback: () => void) => void;
      onNewBooking: (callback: () => void) => void;
      onCloseModal: (callback: () => void) => void;
    };
  }
}
