import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import BrandLogo from '@/components/BrandLogo';
import { finishLoginSplash, isLoginSplashActive, subscribeLoginSplash } from '@/lib/loginSplash';

export default function LoginSplashOverlay() {
    const [visible, setVisible] = useState(isLoginSplashActive);

    useEffect(() => subscribeLoginSplash(() => setVisible(isLoginSplashActive())), []);

    useEffect(() => {
        return router.on('success', (event) => {
            if (isLoginSplashActive() && event.detail.page.component !== 'Auth/Login') {
                finishLoginSplash();
            }
        });
    }, []);

    if (!visible) return null;

    return (
        <div
            className="login-splash"
            role="status"
            aria-live="polite"
            aria-label="Signing in"
        >
            <div className="login-splash__glow" />
            <BrandLogo className="login-splash__logo h-[168px] w-auto" />
        </div>
    );
}
