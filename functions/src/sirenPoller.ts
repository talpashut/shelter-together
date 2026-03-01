interface AlertResult {
  type: string;
  cities: string[];
  instructions?: string;
}

export async function pollSirens(): Promise<AlertResult | null> {
  return new Promise((resolve) => {
    try {
      // pikud-haoref-api uses callback style
      // NOTE: This only works from Israeli IP addresses or via proxy
      const pikudHaoref = require('pikud-haoref-api');

      pikudHaoref.getActiveAlert((err: Error | null, alert: AlertResult) => {
        if (err) {
          console.error('Failed to poll sirens:', err);
          resolve(null);
          return;
        }
        resolve(alert);
      });
    } catch (err) {
      console.error('pikud-haoref-api not available:', err);
      resolve(null);
    }
  });
}
