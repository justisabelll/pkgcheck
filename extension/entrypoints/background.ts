export interface Message {
  type: 'analyzePackage';
  url: string;
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      switch (message.type) {
        case 'analyzePackage':
          console.log('Analyzing package:', message.url);
          break;
      }
    }
  );
});
