import React, { useEffect, useState } from 'react';
import { SubscriptionService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './SubscriptionPage.css';

export const SubscriptionPage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await SubscriptionService.getStatus();
      setStatus(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch subscription status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCheckout = async () => {
    if (!window.Razorpay) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      return;
    }
    try {
      setProcessing(true);
      const { razorpayOrderId, keyId, amount, currency } = await SubscriptionService.initiateCheckout();

      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // Razorpay expects paise (₹199 = 19900 paise)
        currency: currency,
        name: 'SpendSmart Premium',
        description: 'Monthly Premium Subscription',
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            await SubscriptionService.activate({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Premium Subscription Activated!');
            fetchStatus();
          } catch (activateErr) {
            toast.error(activateErr.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user.fullName,
          email: user.email,
        },
        theme: {
          color: '#3fb950',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err) {
      toast.error(err.message || 'Failed to initiate checkout');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your premium subscription? You will lose access after your current billing period.')) {
      return;
    }
    try {
      setProcessing(true);
      await SubscriptionService.cancel();
      toast.success('Subscription cancelled successfully');
      fetchStatus();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading subscription status...</div>;
  }

  const isPremium = status?.status === 'ACTIVE';

  return (
    <div className="subscription-page">
      <header className="page-header">
        <h1>Premium Subscription</h1>
        <p className="subtitle">Manage your SpendSmart Premium Plan</p>
      </header>

      <div className="subscription-content">
        <div className={`subscription-card ${isPremium ? 'premium-active' : ''}`}>
          <div className="card-header">
            <h2>{isPremium ? '💎 Premium Active' : 'Free Plan'}</h2>
            {isPremium && status?.endDate && (
              <span className="valid-until">
                Valid until {new Date(status.endDate).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="card-body">
            {!isPremium ? (
              <div className="upgrade-pitch">
                <p>Upgrade to SpendSmart Premium for just <strong>₹199/month</strong> to unlock all features:</p>
                <ul className="premium-features-list">
                  <li>✨ Advanced Analytics & Forecasting</li>
                  <li>💸 Track Unlimited Incomes & Budgets</li>
                  <li>🔄 Manage Recurring Transactions</li>
                  <li>📊 Priority Support & Insights</li>
                </ul>
                <button
                  className="btn btn-primary upgrade-btn"
                  onClick={handleCheckout}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Upgrade Now - ₹199/month'}
                </button>
              </div>
            ) : (
              <div className="premium-management">
                <p>You are currently enjoying all Premium features.</p>
                <p>Your subscription will automatically renew unless cancelled.</p>
                
                <div className="premium-actions">
                  <button
                    className="btn btn-outline cancel-btn"
                    onClick={handleCancel}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
