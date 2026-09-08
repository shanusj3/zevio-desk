let isSdkLoaded = false;

export const facebookSdk = {
  /**
   * Load and initialize the Meta Facebook JS SDK on demand
   */
  loadAndInit: (appId: string): Promise<any> => {
    return new Promise((resolve) => {
      if ((window as any).FB) {
        resolve((window as any).FB);
        return;
      }

      if (isSdkLoaded) {
        const timer = setInterval(() => {
          if ((window as any).FB) {
            clearInterval(timer);
            resolve((window as any).FB);
          }
        }, 100);
        return;
      }

      isSdkLoaded = true;

      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.body.appendChild(js);

      (window as any).fbAsyncInit = function () {
        (window as any).FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v20.0',
        });
        resolve((window as any).FB);
      };
    });
  },
};
