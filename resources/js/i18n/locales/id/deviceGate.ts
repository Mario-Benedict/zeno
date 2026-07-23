// Full-screen gate shown when the viewport is too narrow for this app's
// desktop-only layout (see hooks/useIsDesktopViewport.ts).
import type { deviceGate as en } from '../en/deviceGate';

export const deviceGate: typeof en = {
  eyebrow: 'Layar terlalu kecil',
  title: 'Zeno dibuat untuk layar yang lebih besar',
  description:
    'Tampilan ini belum dioptimalkan untuk ponsel dan tablet kecil, jadi tampilannya bisa berantakan. Beralihlah ke desktop atau laptop untuk melanjutkan.',
  hint: 'Tips: perbesar kembali jendela ini dan aplikasi akan langsung tampil lagi.',
};
