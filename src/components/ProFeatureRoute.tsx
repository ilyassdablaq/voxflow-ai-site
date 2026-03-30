import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { UpgradeModal } from './UpgradeModal';

interface ProFeatureRouteProps {
  featureName: string;
  requiredPlan?: 'PRO' | 'ENTERPRISE';
  children: ReactNode;
}

/**
 * Guard component that restricts access to Pro features
 * Shows upgrade modal if user is not Pro
 */
export function ProFeatureRoute({
  featureName,
  requiredPlan = 'PRO',
  children,
}: ProFeatureRouteProps) {
  useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccess } = useFeatureAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(true);

  const hasAccess = canAccess(featureName);

  useEffect(() => {
    if (!hasAccess) {
      setShowUpgradeModal(true);
    }
  }, [hasAccess]);

  const handleClose = () => {
    // Keep users inside dashboard and return them to the conversation hub.
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard', { replace: true });
    }
  };

  if (!hasAccess) {
    return (
      <UpgradeModal
        isOpen={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onClose={handleClose}
        feature={featureName}
        requiredPlan={requiredPlan}
      />
    );
  }

  return <>{children}</>;
}
